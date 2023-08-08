import { Api } from "telegram";
import { NewMessage } from "telegram/events/NewMessage.js";
var User = Api.User;
import { CyborgramModule, singleOrLast } from "./BaseModule.js";
import { isNullish } from "../utils/nullish.js";
export class AddProtoCommands extends CyborgramModule {
    async build(obj) {
        obj.help["tgutils.extractFrom(message: Message): Promise<Entity | undefined>"] =
            "gets the entity (user, group, channel) that sent the message";
        async function extractFrom(message = obj.thatOrThisMsg) {
            var _a;
            let fromId = (_a = message.fromId) !== null && _a !== void 0 ? _a : message.peerId;
            if (typeof fromId === "undefined") {
                return undefined;
            }
            else {
                return await obj.client.getEntity(fromId);
            }
        }
        obj.help["tgutils.fromUsername(message: Message): Promise<string | undefined>"] =
            "gets the username (user/channel) that sent the message";
        async function fromUsername(message = obj.thatOrThisMsg) {
            let from = await extractFrom(message);
            if (typeof from === "undefined") {
                return undefined;
            }
            else if ('username' in from) {
                return from.username;
            }
            else {
                return undefined;
            }
        }
        obj.help["tgutils.fromName(message: Message): Promise<string>"] =
            "gets the first thing available that resembles a name from the sender of the message.";
        async function fromName(message = obj.thatOrThisMsg) {
            var _a, _b;
            let from = await extractFrom(message);
            if (typeof from === "undefined") {
                return "(undefined name)";
            }
            else if (from instanceof User) {
                return (_b = (_a = from.firstName) !== null && _a !== void 0 ? _a : from.username) !== null && _b !== void 0 ? _b : '' + from.id;
            }
            else if ('title' in from) {
                return from['title'];
            }
            else {
                return "(undefined name)";
            }
        }
        obj.help["protos.getComingMessage(where: any): Promise<Message>"] =
            "Awaits the next message sent (from someone else) in 'where'.";
        async function getComingMessage(where) {
            return new Promise(async (resolve) => {
                let eventBuilder = new NewMessage({ chats: [where] });
                let callback = async (event) => {
                    var _a, _b;
                    if (((_a = event === null || event === void 0 ? void 0 : event.message) === null || _a === void 0 ? void 0 : _a.out) === false) {
                        console.log("Resolving promise...");
                        await ((_b = event === null || event === void 0 ? void 0 : event.message) === null || _b === void 0 ? void 0 : _b.markAsRead());
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
            "Sends a message in a chat, awaits and returns the response message.";
        async function requestMsg(where, query = obj.thatOrThisTxt) {
            if (query.length === 0) {
                query = "«empty»";
            }
            console.log("Sending " + query + " to " + where + "...");
            await obj.send(query, { where: where, sendIfEmpty: false, multiLimit: 1 });
            return getComingMessage(where);
        }
        obj.help["protos.requestAsk(where: any, query: string = thatOrThisTxt): Promise<string>"] =
            "Sends a message in a chat, awaits and returns the text of the response message.";
        async function requestAsk(where, query = obj.thatOrThisTxt) {
            var _a, _b;
            return (_b = (_a = (await requestMsg(where, query))) === null || _a === void 0 ? void 0 : _a.text) !== null && _b !== void 0 ? _b : "«»";
        }
        obj.help["protos.requestFrom(where: any, query: string = thatOrThisTxt," +
            " forwardWhere: EntityLike = thisMsg.chatId)"] =
            "Sends a message in a chat, awaits the response, which is then sendCopy-ed to forwardWhere.";
        async function requestFrom(where, query = obj.thatOrThisTxt, forwardWhere = obj.thisMsg.chatId) {
            await obj.sendCopy(await requestMsg(where, query), { where: forwardWhere });
        }
        obj.help["protos.multirequestMsg(query1: () => (Promise<Message | Message[]>) = " +
            "async () => thatMsg, query2: string = that,): Promise<Message | Message[]>"] =
            "executes query1, then sends a message with query2 replying to the resulting (last) " +
                "message in the same chat, then returns the first response from that chat.";
        async function multirequestMsg(query1 = async () => obj.thatMsg, query2 = obj.that) {
            if (typeof query2 !== "string" || query2.length === 0) {
                query2 = "«empty»";
            }
            let messages = await query1();
            if (isNullish(messages)) {
                messages = [];
            }
            else if (!Array.isArray(messages)) {
                messages = [messages];
            }
            if (messages.length !== 0) {
                let msg = messages[messages.length - 1];
                let where = obj.extractLongID(msg.peerId);
                console.log("Sending " + query2 + " to " + where + "...");
                await obj.send(query2, { where: msg.peerId, replyTo: msg.id });
                return getComingMessage(where);
            }
            return [];
        }
        obj.help["protos.multirequestAsk(query1: () => (Promise<Message | Message[]>) = async () " +
            "=> thatMsg, query2: string = that,): Promise<string>"] =
            "Like multirequestMsg, but returns the text of the response message at the end.";
        async function multirequestAsk(query1 = async () => obj.thatMsg, query2 = obj.that) {
            var _a, _b;
            return (_b = (_a = singleOrLast(await multirequestMsg(query1, query2))) === null || _a === void 0 ? void 0 : _a.text) !== null && _b !== void 0 ? _b : "«»";
        }
        obj.help["protos.multirequestFrom(query1: () => (Promise<Message | Message[]>) = async () " +
            "=> thatMsg, query2: string = that, forwardWhere: EntityLike = thisMsg.chatId, " +
            "replyingTo: number | Message | undefined = thatMsg,)"] =
            "Like multirequestMsg, but at the end forwards the resulting message.";
        async function multirequestFrom(query1 = async () => obj.thatMsg, query2 = obj.that, forwardWhere = obj.thisMsg.chatId, replyingTo = obj.thatMsg) {
            await obj.sendCopy(singleOrLast(await multirequestMsg(query1, query2)), { where: forwardWhere, replyTo: replyingTo });
        }
        // noinspection JSUnusedGlobalSymbols
        return Object.assign(Object.assign({}, obj), { tgutils: {
                extractFrom,
                fromUsername,
                fromName,
                extractLongID: obj.extractLongID,
            }, protos: {
                getComingMessage,
                requestMsg,
                requestAsk,
                requestFrom,
                multirequestMsg,
                multirequestAsk,
                multirequestFrom,
            } });
    }
}
//# sourceMappingURL=ProtoModule.js.map