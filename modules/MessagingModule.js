var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { Api } from "telegram";
var Message = Api.Message;
import { CyborgramModule } from "./BaseModule.js";
import { getKeys } from "../keys.js";
import { isNullish } from "../utils/nullish.js";
export class AddMessagingUtils extends CyborgramModule {
    async build(obj) {
        obj.help["send(text: string = that, " +
            "{ where: any = thisMsg.chatId, sendIfEmpty?: boolean = true, multiLimit?: number =true, " +
            "schedule?: (number|{getEpochSecond():number}) } & Omit<SendMessageParams, 'message'|'schedule'>)"] =
            "Sends a text message.";
        async function send(text, _a) {
            var _b;
            if (text === void 0) { text = (_b = obj.that) !== null && _b !== void 0 ? _b : ""; }
            var _c = _a === void 0 ? {} : _a, { where = obj.thisMsg.chatId, sendIfEmpty = true, multiLimit = 5, schedule } = _c, otherParams = __rest(_c, ["where", "sendIfEmpty", "multiLimit", "schedule"]);
            if (typeof text !== 'string') {
                text = '' + text;
            }
            let result = [];
            if (typeof schedule !== 'number' && typeof schedule !== 'undefined') {
                schedule = schedule.getEpochSecond();
            }
            //special case for when the text is empty but the message contains a file
            if (otherParams.file && text.length === 0) {
                result.push(await obj.client.sendMessage(where, Object.assign(Object.assign({}, otherParams), { message: undefined, schedule })));
                return result;
            }
            let strings = text.splitclip(obj.txtLimit, multiLimit, sendIfEmpty ? "«empty»" : null);
            if (strings.length !== 0) {
                for (let s of strings) {
                    result.push(await obj.client.sendMessage(where, Object.assign(Object.assign({}, otherParams), { message: "" + s, schedule })));
                }
            }
            else {
                if ("file" in otherParams && !isNullish(otherParams.file)) {
                    result.push(await obj.client.sendMessage(where, Object.assign({}, otherParams)));
                }
            }
            return result;
        }
        async function summon(text) {
            var _a, _b;
            if (text === void 0) { text = (_a = obj.that) !== null && _a !== void 0 ? _a : ""; }
            await obj.client.invoke(new Api.messages.SaveDraft({
                peer: (_b = obj.thisMsg) === null || _b === void 0 ? void 0 : _b.peerId,
                message: text
            }));
        }
        obj.help["'..string..'.send({...same named optional params as send...})"] =
            "'txt.send(...)' is the same as 'send(txt, ...)'.";
        String.prototype.send = async function (params = {}) {
            return await send(obj, Object.assign({}, params));
        };
        obj.help["reply(...same as send...)"] =
            "Like send, but 'replyTo' parameter defaults to thatOrThisMsg.";
        async function reply(text, _a) {
            var _b;
            if (text === void 0) { text = (_b = obj.that) !== null && _b !== void 0 ? _b : ""; }
            var _c = _a === void 0 ? {} : _a, { replyTo = obj.thatOrThisMsg } = _c, otherParams = __rest(_c, ["replyTo"]);
            return await send(text, Object.assign({ replyTo }, otherParams));
        }
        obj.help["retract(msg: Message = thatOrThisMsg)"] =
            "Deletes (for everyone) the message";
        async function retract(mess = obj.thatOrThisMsg) {
            await obj.client.deleteMessages(mess.peerId, [mess.id], {});
        }
        obj.help["edit(mess: Message = thatOrThisMsg, " +
            "txt: string, { deleteIfEmpty?: boolean, schedule?: (number | { getEpochSecond(): number }) } " +
            "& Omit<EditMessageParams, 'message' | 'text' | 'schedule'>)"] =
            "Edits the text in mess, replacing it with txt.";
        async function edit(mess = obj.thatOrThisMsg, txt = "", _a = {}) {
            var { deleteIfEmpty = true, schedule } = _a, otherParams = __rest(_a, ["deleteIfEmpty", "schedule"]);
            if (typeof txt !== 'string') {
                txt = '' + txt;
            }
            let strings = txt.splitclip(obj.txtLimit, 1, deleteIfEmpty ? null : undefined);
            if (strings.length <= 0) {
                console.log(`Deleting message with id ${mess.id}`);
                await retract(mess);
            }
            else {
                if (typeof schedule !== 'number' && typeof schedule !== 'undefined') {
                    schedule = schedule.getEpochSecond();
                }
                let t = strings[0];
                console.log(`Editing '${mess.id}' to '${t}'`);
                await obj.client.editMessage(mess.peerId, Object.assign(Object.assign({}, otherParams), {
                    message: mess.id,
                    text: "" + t,
                    schedule
                }));
            }
        }
        obj.help["sendCopy(message: Message | null = thatOrThisMsg,{where = here, schedule,...otherParams}: " +
            "{where?: any, schedule?: (number | { getEpochSecond(): number }),} " +
            "& Omit<SendMessageParams, 'schedule' | 'messages'> = {},)"] =
            "Sends a copy of the message to where.";
        async function sendCopy(message = obj.thatOrThisMsg, _a = {}) {
            var { where = obj.here, schedule, rewriteText = message === null || message === void 0 ? void 0 : message.message } = _a, otherParams = __rest(_a, ["where", "schedule", "rewriteText"]);
            if (typeof schedule !== 'number' && typeof schedule !== 'undefined') {
                schedule = schedule.getEpochSecond();
            }
            if (typeof where !== 'undefined') {
                await obj.client.sendMessage(where, Object.assign(Object.assign({
                    message: rewriteText,
                    formattingEntities: message === null || message === void 0 ? void 0 : message.entities,
                    file: message === null || message === void 0 ? void 0 : message.media,
                }, otherParams), { schedule }));
            }
        }
        obj.help["forward(messages: MessageIDLike " +
            "| MessageIDLike[] = thatOrThisMsg, params: {where: any = selfID, schedule?: (number | " +
            "{ getEpochSecond(): number })} & Omit<ForwardMessagesParams, 'schedule' | 'messages'>)"] =
            "Forwards the specified messages. Note that in case messages is not a single Message object, " +
                "fromPeer is by default thisMsg.peerId. Change it accordingly.";
        async function forward(messages = obj.thatOrThisMsg, _a = {}) {
            var { where = getKeys()["selfID"], schedule, fromPeer = obj.thatOrThisMsg.peerId } = _a, otherParams = __rest(_a, ["where", "schedule", "fromPeer"]);
            if (typeof schedule !== 'number' && typeof schedule !== 'undefined') {
                schedule = schedule.getEpochSecond();
            }
            if (!Array.isArray(messages) && messages instanceof Message) {
                fromPeer = messages.peerId;
            }
            return await obj.client.forwardMessages(where, Object.assign({ messages,
                schedule,
                fromPeer }, otherParams));
        }
        return Object.assign(Object.assign({}, obj), { send,
            reply,
            retract,
            edit,
            sendCopy,
            forward,
            summon });
    }
}
//# sourceMappingURL=MessagingModule.js.map