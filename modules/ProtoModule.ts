import {Api} from "telegram";
import {SendMessageParams} from "telegram/client/messages.js";
import {Entity, EntityLike} from "telegram/define.js";
import {NewMessage, NewMessageEvent} from "telegram/events/NewMessage.js";
import Message = Api.Message;
import User = Api.User;
import {BaseContext, CyborgramModule, singleOrLast} from "./BaseModule.js";
import {isNullish, nullish} from "../utils/nullish.js";

export type ProtoCommands = {
    tgutils: {
        extractLongID: (peer?: (Api.TypePeer | nullish)) => (Api.long | nullish),
        fromName: (message?: Api.Message) => Promise<string>,
        extractFrom: (message?: Api.Message) => Promise<Entity | undefined>,
        fromUsername: (message?: Api.Message) => Promise<string | undefined>,
    },
    protos: {
        getComingMessage: (where: any) => Promise<Api.Message>,
        multirequestAsk: (query1?: () => Promise<Api.Message | Api.Message[] | nullish>, query2?: (string | nullish)) => Promise<string>,
        multirequestFrom: (query1?: () => Promise<Api.Message | Api.Message[] | nullish>, query2?: (string | nullish), forwardWhere?: (EntityLike | undefined), replyingTo?: (number | Api.Message | undefined)) => Promise<void>,
        requestMsg: (where: any, query?: string) => Promise<Api.Message>,
        multirequestMsg: (query1?: () => Promise<Api.Message | Api.Message[] | nullish>, query2?: (string | nullish)) => Promise<Api.Message | Api.Message[]>,
        requestAsk: (where: any, query?: string) => Promise<string>,
        requestFrom: (where: any, query?: string, forwardWhere?: (EntityLike | undefined)) => Promise<void>
    }
}

export class AddProtoCommands<T extends BaseContext & {
    that: string | undefined,
    thisMsg: Message,
    thatMsg: Api.Message | undefined,
    thatOrThisMsg: Api.Message,
    thatOrThisTxt: string,
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
    } & Omit<SendMessageParams, "schedule" | "message">)) => Promise<void>,
    extractLongID: (peer?: (Api.TypePeer | nullish)) => (Api.long | nullish),
}> extends CyborgramModule<T, ProtoCommands> {
    async build(obj: T) {
        obj.help["tgutils.extractFrom(message: Message): Promise<Entity | undefined>"] =
            "gets the entity (user, group, channel) that sent the message"

        async function extractFrom(message: Message = obj.thatOrThisMsg): Promise<Entity | undefined> {
            let fromId = message.fromId ?? message.peerId;
            if (typeof fromId === "undefined") {
                return undefined;
            } else {
                return await obj.client.getEntity(fromId);
            }
        }

        obj.help["tgutils.fromUsername(message: Message): Promise<string | undefined>"] =
            "gets the username (user/channel) that sent the message"

        async function fromUsername(message: Message = obj.thatOrThisMsg): Promise<string | undefined> {
            let from = await extractFrom(message);
            if (typeof from === "undefined") {
                return undefined;
            } else if ('username' in from) {
                return from.username;
            } else {
                return undefined;
            }
        }


        obj.help["tgutils.fromName(message: Message): Promise<string>"] =
            "gets the first thing available that resembles a name from the sender of the message."

        async function fromName(message: Message = obj.thatOrThisMsg): Promise<string> {
            let from = await extractFrom(message);
            if (typeof from === "undefined") {
                return "(undefined name)";
            } else if (from instanceof User) {
                return from.firstName ?? from.username ?? '' + from.id;
            } else if ('title' in from) {
                return from['title'];
            } else {
                return "(undefined name)";
            }
        }


        obj.help["protos.getComingMessage(where: any): Promise<Message>"] =
            "Awaits the next message sent (from someone else) in 'where'."

        async function getComingMessage(where: any): Promise<Message> {
            return new Promise(async (resolve: (value: (Api.Message | PromiseLike<Api.Message>)) => void) => {
                let eventBuilder = new NewMessage({chats: [where]});
                let callback: (event: NewMessageEvent) => Promise<void> = async (event: NewMessageEvent) => {
                    if (event?.message?.out === false) {
                        console.log("Resolving promise...");
                        await event?.message?.markAsRead();
                        clean();
                        resolve(event.message);
                    }
                };

                function clean() {
                    console.log("Removing event handler...");
                    obj.client.removeEventHandler(callback, eventBuilder);
                }

                console.log("Setting event handler... from " + where + "...");
                obj.client.addEventHandler(callback, eventBuilder);
            });
        }

        obj.help["protos.requestMsg(where: any, query: string = thatOrThisTxt): Promise<Message>"] =
            "Sends a message in a chat, awaits and returns the response message."

        async function requestMsg(where: any, query: string = obj.thatOrThisTxt): Promise<Message> {
            if (query.length === 0) {
                query = "«empty»";
            }
            console.log("Sending " + query + " to " + where + "...");
            await obj.send(query, {where: where, sendIfEmpty: false, multiLimit: 1});
            return getComingMessage(where);
        }

        obj.help["protos.requestAsk(where: any, query: string = thatOrThisTxt): Promise<string>"] =
            "Sends a message in a chat, awaits and returns the text of the response message."

        async function requestAsk(where: any, query: string = obj.thatOrThisTxt): Promise<string> {
            return (await requestMsg(where, query))?.text ?? "«»";
        }

        obj.help["protos.requestFrom(where: any, query: string = thatOrThisTxt," +
        " forwardWhere: EntityLike = thisMsg.chatId)"] =
            "Sends a message in a chat, awaits the response, which is then sendCopy-ed to forwardWhere."

        async function requestFrom(
            where: any,
            query: string = obj.thatOrThisTxt,
            forwardWhere: EntityLike | undefined = obj.thisMsg.chatId,
        ) {
            await obj.sendCopy(await requestMsg(where, query), {where: forwardWhere});
        }


        obj.help["protos.multirequestMsg(query1: () => (Promise<Message | Message[]>) = " +
        "async () => thatMsg, query2: string = that,): Promise<Message | Message[]>"] =
            "executes query1, then sends a message with query2 replying to the resulting (last) " +
            "message in the same chat, then returns the first response from that chat."

        async function multirequestMsg(
            query1: () => (Promise<Message | Message[] | nullish>) = async () => obj.thatMsg,
            query2: string | nullish = obj.that,
        ): Promise<Message | Message[]> {
            if (typeof query2 !== "string" || query2.length === 0) {
                query2 = "«empty»";
            }
            let messages = await query1();
            if (isNullish(messages)) {
                messages = [];
            } else if (!Array.isArray(messages)) {
                messages = [messages];
            }
            if (messages.length !== 0) {
                let msg = messages[messages.length - 1];
                let where = obj.extractLongID(msg.peerId);
                console.log("Sending " + query2 + " to " + where + "...");
                await obj.send(query2, {where: msg.peerId, replyTo: msg.id});
                return getComingMessage(where);
            }
            return [];
        }

        obj.help["protos.multirequestAsk(query1: () => (Promise<Message | Message[]>) = async () " +
        "=> thatMsg, query2: string = that,): Promise<string>"] =
            "Like multirequestMsg, but returns the text of the response message at the end."

        async function multirequestAsk(
            query1: () => (Promise<Message | Message[] | nullish>) = async () => obj.thatMsg,
            query2: string | nullish = obj.that,
        ): Promise<string> {
            return singleOrLast(await multirequestMsg(query1, query2))
                ?.text ?? "«»";
        }

        obj.help["protos.multirequestFrom(query1: () => (Promise<Message | Message[]>) = async () " +
        "=> thatMsg, query2: string = that, forwardWhere: EntityLike = thisMsg.chatId, " +
        "replyingTo: number | Message | undefined = thatMsg,)"] =
            "Like multirequestMsg, but at the end forwards the resulting message."

        async function multirequestFrom(
            query1: () => (Promise<Message | Message[] | nullish>) = async () => obj.thatMsg,
            query2: string | nullish = obj.that,
            forwardWhere: EntityLike | undefined = obj.thisMsg.chatId,
            replyingTo: number | Message | undefined = obj.thatMsg,
        ) {
            await obj.sendCopy(
                singleOrLast(await multirequestMsg(query1, query2)),
                {where: forwardWhere, replyTo: replyingTo},
            );
        }


        // noinspection JSUnusedGlobalSymbols
        return {
            ...obj,
            tgutils: {
                extractFrom,
                fromUsername,
                fromName,
                extractLongID: obj.extractLongID,
            },
            protos: {
                getComingMessage,
                requestMsg,
                requestAsk,
                requestFrom,
                multirequestMsg,
                multirequestAsk,
                multirequestFrom,
            },
        }
    }
}