import {Api} from "telegram";
import {EditMessageParams, ForwardMessagesParams, SendMessageParams} from "telegram/client/messages.js";
import {EntityLike, MessageIDLike} from "telegram/define.js";
import TypePeer = Api.TypePeer;
import Message = Api.Message;
import {BaseContext, CyborgramModule} from "./BaseModule.js";
import {getKeys} from "../keys.js";
import {isNullish} from "../utils/nullish.js";

export type MessagingUtils = {
    edit: (mess?: Api.Message, txt?: any, params?: ({
        deleteIfEmpty?: boolean;
        schedule?: number | { getEpochSecond(): number }
    } & Omit<EditMessageParams, "message" | "text" | "schedule">)) => Promise<void>,
    retract: (mess?: Api.Message) => Promise<void>,
    forward: (messages?: (MessageIDLike | MessageIDLike[]), params?: ({
        where?: any,
        fromPeer?: EntityLike,
        schedule?: number | { getEpochSecond(): number }
    } & Omit<ForwardMessagesParams, "schedule" | "messages" | "fromPeer">)) => Promise<Api.Message[]>,
    reply: (text?: any, params?: ({
        where?: any,
        sendIfEmpty?: boolean,
        multiLimit?: number,
        schedule?: number | { getEpochSecond(): number },
        replyTo?: number | Api.Message
    } & Omit<SendMessageParams, "message" | "schedule" | "replyTo">)) => Promise<Api.Message[]>,
    send: (text?: any, params?: ({
        where?: any,
        sendIfEmpty?: boolean,
        multiLimit?: number,
        schedule?: number | { getEpochSecond(): number }
    } & Omit<SendMessageParams, "message" | "schedule">)) => Promise<Api.Message[]>,
    sendCopy: (message?: (Api.Message | null), params?: ({
        where?: EntityLike,
        schedule?: number | { getEpochSecond(): number },
        rewriteText?: string
    } & Omit<SendMessageParams, "schedule" | "message">)) => Promise<void>
    summon: (text?: string) => Promise<void>
}

export class AddMessagingUtils<T extends BaseContext & {
    that: string | undefined,
    thisMsg: Api.Message,
    thatOrThisMsg: Api.Message,
    txtLimit: number,
    here: TypePeer | undefined,
}> extends CyborgramModule<T, MessagingUtils> {
    async build(obj: T) {

        obj.help["send(text: string = that, " +
        "{ where: any = thisMsg.chatId, sendIfEmpty?: boolean = true, multiLimit?: number =true, " +
        "schedule?: (number|{getEpochSecond():number}) } & Omit<SendMessageParams, 'message'|'schedule'>)"] =
            "Sends a text message."

        async function send(
            text: any = obj.that ?? "",
            {
                where = obj.thisMsg.chatId,
                sendIfEmpty = true,
                multiLimit = 5,
                schedule,
                ...otherParams
            }: {
                where?: any,
                sendIfEmpty?: boolean,
                multiLimit?: number,
                schedule?: (number | { getEpochSecond(): number })
            } & Omit<SendMessageParams, "message" | "schedule"> = {},
        ): Promise<Message[]> {
            if (typeof text !== 'string') {
                text = '' + text;
            }
            let result: Message[] = [];
            if (typeof schedule !== 'number' && typeof schedule !== 'undefined') {
                schedule = schedule.getEpochSecond();
            }

            //special case for when the text is empty but the message contains a file
            if (otherParams.file && text.length === 0) {
                result.push(await obj.client.sendMessage(where, {...otherParams, ...{message: undefined, schedule}}))
                return result
            }

            let strings = text.splitclip(
                obj.txtLimit,
                multiLimit,
                sendIfEmpty ? "«empty»" : null,
            );


            if (strings.length !== 0) {
                for (let s of strings) {
                    result.push(await obj.client.sendMessage(where, {...otherParams, ...{message: "" + s, schedule}}));
                }
            } else {
                if ("file" in otherParams && !isNullish(otherParams.file)) {
                    result.push(await obj.client.sendMessage(where, {...otherParams}));
                }
            }
            return result;
        }

        async function summon(text: string = obj.that ?? ""): Promise<void> {
            await obj.client.invoke(new Api.messages.SaveDraft({
                peer: obj.thisMsg?.peerId,
                message: text
            }))
        }

        obj.help["'..string..'.send({...same named optional params as send...})"] =
            "'txt.send(...)' is the same as 'send(txt, ...)'."
        String.prototype.send = async function (
            params: {
                where?: any,
                sendIfEmpty?: boolean,
                multiLimit?: number,
                schedule?: (number | { getEpochSecond(): number })
            } & Omit<SendMessageParams, "message" | "schedule"> = {},
        ) {
            return await send(obj, {...params});
        };

        obj.help["reply(...same as send...)"] =
            "Like send, but 'replyTo' parameter defaults to thatOrThisMsg."

        async function reply(
            text: any = obj.that ?? "",
            {
                replyTo = obj.thatOrThisMsg,
                ...otherParams
            }: {
                where?: any,
                sendIfEmpty?: boolean,
                multiLimit?: number,
                schedule?: (number | { getEpochSecond(): number }),
                replyTo?: number | Message
            } & Omit<SendMessageParams, "message" | "schedule" | "replyTo"> = {},
        ): Promise<Message[]> {
            return await send(text, {replyTo, ...otherParams});
        }

        obj.help["retract(msg: Message = thatOrThisMsg)"] =
            "Deletes (for everyone) the message"

        async function retract(
            mess: Message = obj.thatOrThisMsg,
        ) {
            await obj.client.deleteMessages(mess.peerId, [mess.id], {});
        }

        obj.help["edit(mess: Message = thatOrThisMsg, " +
        "txt: string, { deleteIfEmpty?: boolean, schedule?: (number | { getEpochSecond(): number }) } " +
        "& Omit<EditMessageParams, 'message' | 'text' | 'schedule'>)"] =
            "Edits the text in mess, replacing it with txt."

        async function edit(
            mess: Message = obj.thatOrThisMsg,
            txt: any = "",
            {
                deleteIfEmpty = true,
                schedule,
                ...otherParams
            }: {
                deleteIfEmpty?: boolean,
                schedule?: (number | { getEpochSecond(): number })
            } & Omit<EditMessageParams, "message" | "text" | 'schedule'> = {},
        ) {
            if (typeof txt !== 'string') {
                txt = '' + txt;
            }
            let strings = txt.splitclip(obj.txtLimit, 1, deleteIfEmpty ? null : undefined);
            if (strings.length <= 0) {
                console.log(`Deleting message with id ${mess.id}`);
                await retract(mess);
            } else {
                if (typeof schedule !== 'number' && typeof schedule !== 'undefined') {
                    schedule = schedule.getEpochSecond();
                }
                let t = strings[0];
                console.log(`Editing '${mess.id}' to '${t}'`);
                await obj.client.editMessage(mess.peerId, {
                    ...otherParams, ...{
                        message: mess.id,
                        text: "" + t,
                        schedule
                    }
                });
            }
        }

        obj.help["sendCopy(message: Message | null = thatOrThisMsg,{where = here, schedule,...otherParams}: " +
        "{where?: any, schedule?: (number | { getEpochSecond(): number }),} " +
        "& Omit<SendMessageParams, 'schedule' | 'messages'> = {},)"] =
            "Sends a copy of the message to where."

        async function sendCopy(
            message: Message | null = obj.thatOrThisMsg,
            {
                where = obj.here,
                schedule,
                rewriteText = message?.message,
                ...otherParams
            }: {
                where?: EntityLike,
                schedule?: (number | { getEpochSecond(): number }),
                rewriteText?: string,
            } & Omit<SendMessageParams, 'schedule' | 'message'> = {},
        ) {
            if (typeof schedule !== 'number' && typeof schedule !== 'undefined') {
                schedule = schedule.getEpochSecond();
            }
            if (typeof where !== 'undefined') {
                await obj.client.sendMessage(where, {
                    ...{
                        message: rewriteText,
                        formattingEntities: message?.entities,
                        file: message?.media,
                    },
                    ...otherParams,
                    ...{schedule},
                });
            }
        }

        obj.help["forward(messages: MessageIDLike " +
        "| MessageIDLike[] = thatOrThisMsg, params: {where: any = selfID, schedule?: (number | " +
        "{ getEpochSecond(): number })} & Omit<ForwardMessagesParams, 'schedule' | 'messages'>)"] =
            "Forwards the specified messages. Note that in case messages is not a single Message object, " +
            "fromPeer is by default thisMsg.peerId. Change it accordingly."

        async function forward(
            messages: MessageIDLike | MessageIDLike[] = obj.thatOrThisMsg,
            {
                where = getKeys()["selfID"],
                schedule,
                fromPeer = obj.thatOrThisMsg.peerId,
                ...otherParams
            }: {
                where?: any,
                fromPeer?: EntityLike,
                schedule?: (number | { getEpochSecond(): number }),
            } & Omit<ForwardMessagesParams, 'schedule' | 'messages' | 'fromPeer'> = {},
        ): Promise<Message[]> {
            if (typeof schedule !== 'number' && typeof schedule !== 'undefined') {
                schedule = schedule.getEpochSecond();
            }
            if (!Array.isArray(messages) && messages instanceof Message) {
                fromPeer = messages.peerId;
            }
            return await obj.client.forwardMessages(where, {
                messages,
                schedule,
                fromPeer,
                ...otherParams,
            });
        }

        return {
            ...obj,
            send,
            reply,
            retract,
            edit,
            sendCopy,
            forward,
            summon
        }
    }
}