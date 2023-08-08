import {Api, TelegramClient} from "telegram";
import input from "input";
import {NewMessage, NewMessageEvent} from "telegram/events/NewMessage.js";
import * as process from "process";

import {Dialog} from "telegram/tl/custom/dialog.js";
import {Handler} from "./handlers.js";

import PeerUser = Api.PeerUser;
import PeerChat = Api.PeerChat;
import PeerChannel = Api.PeerChannel;

import {BaseContext, buildCyborgramContext} from "./modules/BaseModule.js";
import {AddMessageReferences} from "./modules/MsgReferencesModule.js";
import {AddMessagingUtils, MessagingUtils} from "./modules/MessagingModule.js";
import {AddJSUtils, JSUtils} from "./modules/JSUtilsModule.js";
import {AddHandlerUtils, HandlerUtils} from "./modules/EventsModule.js";
import {AddReservedChatUtils, ReservedChatUtils} from "./modules/ReservedChatsModule.js";
import {AddProtoCommands, ProtoCommands} from "./modules/ProtoModule.js";

import {StringSession} from "telegram/sessions/StringSession.js";
import {getKeys} from "./keys.js";
import {CyborgramConfig, getConfig} from "./config.js";
import "./utils/extensions.js";

(async () => {

    let _keys = getKeys()

    // Creating allDialogs const to make it available in the prompt environment
    // noinspection JSMismatchedCollectionQueryUpdate
    const allDialogs: Dialog[] = [];
    const handlers: Map<string, Handler> = new Map<string, Handler>();

    /**
     * Prepares the context object that will be used to evaluate the command.
     *
     * @param client client object
     * @param event the event that caused the evaluation to start
     * @param handlers the set of registered handlers
     * @param wrapAndEval the executor function, passed to handler objects when created
     */
    async function prepareContext(
        client: TelegramClient,
        event: NewMessageEvent,
        handlers: Map<string, Handler>,
        wrapAndEval: (client: TelegramClient, event: NewMessageEvent, code: string) => Promise<any>,
    ) {
        let config = getConfig()

        let helpObj = {
            "(Macro, in preamble) $THISMSG":
                "When loading the preamble, it gets replaced by a JS expression that resolves " +
                "to the message object in the preamble.",
            "(Macro, in preamble) $THATMSG":
                "When loading the preamble, it gets replaced by a JS expression that " +
                "resolves to the message object of the replied message in the preamble.",
        }

        helpObj[config.summonLastPrimitive] =
            "Reload the last command as draft in the chat field " +
            "(may not work, depending on the Telegram client used)."

        for (let p of config.primitiveCommands) {
            helpObj[p.key] = p.name
        }

        let result = await buildCyborgramContext({
            client,
            event,
            handlers,
            wrapAndEval,
            help: helpObj
        }).with(
            new AddMessageReferences<BaseContext>()
                .andThen<MessagingUtils>(new AddMessagingUtils())
                .andThen<HandlerUtils>(new AddHandlerUtils())
                .andThen<JSUtils>(new AddJSUtils())
                .andThen<ReservedChatUtils>(new AddReservedChatUtils())
                .andThen<ProtoCommands>(new AddProtoCommands())
        )

        // noinspection JSUnusedGlobalSymbols
        return {
            ...result,
            Help: () => {
                let str = "";
                for (let key of Object.keys(result.help)) {
                    str += key + " -> " + result.help[key] + "\n\n";
                }
                result.send(str);
            }
        }
    }

    /*
    TODO :
        - isolate modules
        - store session
        - fix need to send something
        - evaluate js sourcefile in chat
            - use sources in preamble
        - parsing system?
        - macros: in-command macros
        - macros: outside-command macros
    */


    async function wrapAndEval(
        client: TelegramClient,
        event: NewMessageEvent,
        code: string,
    ): Promise<any> {

        let prep = await prepareContext(client, event, handlers, wrapAndEval);
        let _preamble = await prep.getPreamble();

        try {
            let _context = `let {${Object.getOwnPropertyNames(prep).join(", ")}} = prep;`
            let _all = _context + _preamble + code
            return await eval(_all)

        } catch (e) {
            console.log(e);
            await client.sendMessage(_keys["testSiteID"], {message: "" + e});
        }
    }


    async function handlePrimitiveCommand(
        client: TelegramClient,
        event: NewMessageEvent,
        lastSelfEvent?: NewMessageEvent,
    ): Promise<boolean> {

        let thisMsg: Api.Message = event.message

        let _config: CyborgramConfig = getConfig()

        if (thisMsg.text === _config.summonLastPrimitive && lastSelfEvent && lastSelfEvent.message.text) {
            try {
                let text = lastSelfEvent.message.text
                await client.invoke(new Api.messages.SaveDraft({
                    peer: thisMsg?.peerId,
                    message: text
                }))
            } finally {
                await client.deleteMessages(thisMsg.chat, [thisMsg.id], {});
            }
            return true
        } else {
            // Using underscoores to not pollute the scope of the eval-ed code
            let _jsText = "";
            for (let _primitive of _config.primitiveCommands) {
                if (_primitive.type === 'prefix' && thisMsg?.text?.startsWith(_primitive.key)) {
                    console.log(`Sent: ${thisMsg?.text}`);
                    _jsText = thisMsg?.text.substring(_primitive.key.length) ?? "";
                    let _wrapped = "";

                    if (!_jsText.isBlank()) {
                        let _result: any = undefined;

                        console.log(`Detected primitive: ${_primitive.name}: ${_jsText}`)

                        // language=JavaScript
                        _wrapped = `(async () => {
                            ${(() => {
                                if (_primitive.result === "getReturned" || _primitive.result === "getEvaluated") {
                                    return "return ";
                                } else {
                                    return "";
                                }
                            })()}await(async () => {
                                try {
                                    ${(() => {
                                        if (_primitive.result === "getEvaluated") {
                                            return "return " + _jsText + ";"
                                        } else {
                                            return _jsText;
                                        }
                                    })()}
                                } catch (e) {
                                    console.log(e);
                                    await client.sendMessage("me", {message: "" + e});
                                    ${(() => {
                                        if (_primitive.result === "getEvaluated" || _primitive.result === "getReturned") {
                                            return "return e;"
                                        } else {
                                            return "";
                                        }
                                    })()}
                                }
                            })();
                        })`
                        try {
                            let func = await wrapAndEval(client, event, _wrapped);
                            _result = await func();
                            console.log(`_result = ${_result}`);
                        } catch (e) {
                            console.log(e);
                            await client.sendMessage(_keys["testSiteID"], {message: "" + e});
                        } finally {
                            if (_primitive.onEnd === 'keep') {
                                await client.editMessage(thisMsg.peerId, {message: thisMsg.id, text: _jsText});
                            } else if (_primitive.onEnd === 'delete') {
                                await client.deleteMessages(thisMsg.chat, [thisMsg.id], {});
                            } else {
                                if (typeof _result !== 'string') {
                                    _result = '' + _result;
                                }
                                if (_result.length === 0) {
                                    _result = '«empty string»';
                                }
                                if (_primitive.onEnd === 'replace') {
                                    await client.editMessage(thisMsg.peerId, {message: thisMsg.id, text: "" + _result});
                                } else {
                                    let sep = _primitive.appendSeparator ?? ' -> '
                                    await client.editMessage(thisMsg.peerId, {
                                        message: thisMsg.id,
                                        text: _jsText + sep + _result
                                    });
                                }
                            }
                        }
                    }
                    return true
                }
            }

            return false;
        }

    }


    const client = new TelegramClient(
        new StringSession(_keys["stringSession"]),
        _keys["apiID"],
        _keys["apiHash"],
        {connectionRetries: 5,}
    );
    await client.start({
        phoneNumber: async () => await input.text("Please enter your number: "),
        password: async () => await input.text("Please enter your password: "),
        phoneCode: async () =>
            await input.text("Please enter the code you received: "),
        onError: (err) => console.log(err),
    });
    console.log("You should now be connected.");
    console.log(client.session.save()); // Save this string to avoid logging in again

    (await client.getDialogs({})).forEach((v: Dialog) => {
        allDialogs.push(v);
    });

    let lastSelfEvent: NewMessageEvent | undefined;

    // adds an event handler for new messages
    client.addEventHandler(async function (event: NewMessageEvent) {
        let wasBuiltinCommand = false;
        if (event?.message?.senderId?.compare?.(_keys["selfID"]) === 0) {
            if (event.message?.text.trim() === 'SEPPUKU') {
                console.log("Self-kill command detected.");
                process.exit(0);
            }
            wasBuiltinCommand = await handlePrimitiveCommand(client, event, lastSelfEvent);
            lastSelfEvent = event;

        }

        if (!wasBuiltinCommand) {
            let peerForTestSiteCheck = event?.message.peerId ?? {};
            let checkResult = false;
            if (peerForTestSiteCheck instanceof PeerUser) {
                checkResult = peerForTestSiteCheck.userId.compare(_keys["testSiteID"]) === 0;
            } else if (peerForTestSiteCheck instanceof PeerChat) {
                checkResult = peerForTestSiteCheck.chatId.compare(_keys["testSiteID"]) === 0;
            } else if (peerForTestSiteCheck instanceof PeerChannel) {
                checkResult = peerForTestSiteCheck.channelId.compare(_keys["testSiteID"]) === 0;
            }
            if (checkResult) {
                wasBuiltinCommand = await handlePrimitiveCommand(client, event, lastSelfEvent);
            }
        }

        if (!wasBuiltinCommand) {
            let keys: string[] = [];
            handlers.forEach((h, k) => {
                keys.push(k);
            });
            for (const key of keys) {
                let handler = handlers.get(key);
                await handler?.evaluate(client, event);
            }
        }

        if (!wasBuiltinCommand && !lastSelfEvent) {
            // If it is normal (unaffected) text, but lastSelfEvent is still not set,
            // set it now.
            lastSelfEvent = event
        }
    }, new NewMessage({}));


    // noinspection InfiniteLoopJS
    while (true) {
        let code = await input.text(">>>");
        if (typeof lastSelfEvent !== 'undefined') {
            let _enclosed = `(async () => {\n
                    await (async () => {
                        try{
                            ${code}
                        }catch(e){
                            console.log(e);
                            await client.sendMessage("me", {message: "" + e});
                        }
                    })();\n
                })`;
            try {
                let func = await wrapAndEval(client, lastSelfEvent, _enclosed);
                await func();
            } catch (e) {
                console.log(e);
                await client.sendMessage(_keys["testSiteID"], {message: "" + e});
            }
        } else {
            console.log(
                "Missing NewMessage self-event... " +
                "Please send a message first on Telegram (it will set thisMsg, thisTxt, etc...)"
            );
        }
    }
})();



