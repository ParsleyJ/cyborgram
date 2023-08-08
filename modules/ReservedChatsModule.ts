import {SendMessageParams} from "telegram/client/messages.js";
import {Api} from "telegram";
import Message = Api.Message;
import {BaseContext, CyborgramModule} from "./BaseModule.js";
import {getKeys} from "../keys.js";
import {isNullish, nullish} from "../utils/nullish.js";

export type ReservedChatUtils = {
    selfID: string,
    testSiteID: string,
    preambleID: string,
    log: (text?: any) => Promise<void>,
    save: (txt?: any) => Promise<void>,
    getPreamble: () => Promise<string>,
    preambleMsgByID: (id: number, replyToMessage?: boolean) => Promise<Api.Message | nullish>,
}

export class AddReservedChatUtils<T extends BaseContext & {
    that: string | undefined,
    thatOrThisTxt: string,
    send: (text?: any, params?: ({
        where?: any
        sendIfEmpty?: boolean
        multiLimit?: number
        schedule?: number | { getEpochSecond(): number }
    } & Omit<SendMessageParams, "message" | "schedule">)) => Promise<Api.Message[]>
}> extends CyborgramModule<T, ReservedChatUtils> {
    async build(obj: T) {

        let _selfID = getKeys()["selfID"]
        let _preambleID = getKeys()["preambleID"]
        let _testSiteID = getKeys()["testSiteID"]

        obj.help["log(text = thatOrThisTxt)"] = "Sends a message to 'me'."

        async function log(text: any = obj.thatOrThisTxt) {
            if (typeof text !== 'string') {
                text = '' + text
            }
            await obj.send(text, {where: "me"});
        }

        obj.help["save(txt = that)"] = "Sends a message to the preamble channel."

        async function save(txt: any = obj.that) {
            if (typeof txt !== 'string') {
                txt = '' + txt;
            }
            if (txt.length !== 0) {
                console.log(`Saving '${txt}' in preamble...`);
                await obj.send(txt, {where: "" + _preambleID, sendIfEmpty: false});
                console.log("Done saving.");
            } else {
                await log("Cannot save an empty string!");
            }
        }

        obj.help["preambleMsgByID(id:number, replyToMessage:boolean=false)"] =
            "Returns the specified preamble message using the id. If replyToMessage is true, it returns the message to " +
            "which the referred message is replying."

        async function preambleMsgByID(id: number, replyToMessage: boolean = false): Promise<Message | nullish> {
            let message: Message | nullish = (
                (
                    await obj.client.getMessages("" + _preambleID, {ids: id})
                ) ?? [null]
            )[0];
            if (replyToMessage && !isNullish(message)) {
                let newId = message.replyToMsgId;
                if (!isNullish(newId)) {
                    return await preambleMsgByID(newId);
                }
            }
            return message;
        }

        obj.help["getPreamble(): string"] = "Get all the preamble contents"

        async function getPreamble() {
            let _preambleMessages = await obj.client.getMessages("" + _preambleID, {limit: undefined});
            console.log("Loading Preamble...");
            let _texts: string[] = [];

            for (let _m of _preambleMessages) {

                let _actualText = _m?.text ?? "";
                //replaces all (not-escaped) $THISMSG with (await client.getMessages("" + _preambleID, {ids: _m.id}))
                _actualText = _actualText.replace(
                    /(?<!\\)\$THISMSG/g,
                    `(await preambleMsgByID(${_m.id}))`,
                );
                _actualText = _actualText.replace(
                    /(?<!\\)\$THATMSG/g,
                    `(await preambleMsgByID(${_m.id}, true))`,
                );
                if (_actualText !== "") {
                    _texts.push(_actualText);
                }
            }
            _texts.reverse();
            let _preambleText = "";
            for (let _t of _texts) {
                _preambleText += _t + ";\n";
            }
            return _preambleText;
        }

        // noinspection JSUnusedGlobalSymbols
        return {
            ...obj,
            selfID: _selfID,
            testSiteID: _testSiteID,
            preambleID: _preambleID,
            log,
            save,
            preambleMsgByID,
            getPreamble
        }
    }
}