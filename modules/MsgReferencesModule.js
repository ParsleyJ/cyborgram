import { Api } from "telegram";
var PeerUser = Api.PeerUser;
var PeerChat = Api.PeerChat;
var PeerChannel = Api.PeerChannel;
import { CyborgramModule } from "./BaseModule.js";
export class AddMessageReferences extends CyborgramModule {
    async build(obj) {
        obj.help["thisMsg"] = "The message that issued the command";
        let thisMsg = obj.event.message;
        obj.help["thatMsg"] = "The message to which thisMsg is replying to (or undefined).";
        let thatMsg = await thisMsg.getReplyMessage();
        obj.help["thatOrThisMsg"] = "thatMsg ?? thisMsg";
        let thatOrThisMsg = thatMsg !== null && thatMsg !== void 0 ? thatMsg : thisMsg;
        obj.help["thisTxt"] = "The text of thisMsg (or undefined).";
        let thisTxt = thisMsg.text;
        obj.help["that"] = "The text of thatMsg (or undefined).";
        let that = thatMsg === null || thatMsg === void 0 ? void 0 : thatMsg.text;
        obj.help["thatOrThisTxt"] = "that ?? thisTxt";
        let thatOrThisTxt = that !== null && that !== void 0 ? that : thisTxt;
        obj.help["thisMedia"] = "The media sent with thisMsg (undefined if none)";
        let thisMedia = thisMsg === null || thisMsg === void 0 ? void 0 : thisMsg.media;
        obj.help["thatMedia"] = "The media sent with thatMsg (undefined if none)";
        let thatMedia = thatMsg === null || thatMsg === void 0 ? void 0 : thatMsg.media;
        obj.help["thatOrThisMedia"] = "The media sent with thatOrThisMsg (undefined if none)";
        let thatOrThisMedia = thatOrThisMsg.media;
        obj.help["txtLimit"] = "The current maximum of characters that a text message can support";
        let txtLimit = 4096;
        obj.help["here"] = "The peer to which thisMsg was sent";
        let here = thisMsg === null || thisMsg === void 0 ? void 0 : thisMsg.peerId;
        obj.help["hereID"] = "The peer ID (as a long number) to which thisMsg was sent " +
            "(or null if impossible to extract)";
        let hereID = extractLongID(thisMsg === null || thisMsg === void 0 ? void 0 : thisMsg.peerId);
        obj.help["tgutils.extractLongID(peer: Api.TypePeer=thatOrThisMsg.peerId): long"] =
            "Gets the numeric ID from the peerId object.";
        function extractLongID(peer = thatOrThisMsg.peerId) {
            if (peer instanceof PeerUser) {
                return peer.userId;
            }
            else if (peer instanceof PeerChat) {
                return peer.chatId;
            }
            else if (peer instanceof PeerChannel) {
                return peer.channelId;
            }
            else {
                return null;
            }
        }
        obj.help["async previousMsg(msg=thatOrThisMsg)"] = "Gets the message before the specified one," +
            " in «here»";
        async function previousMsg(msg = thatOrThisMsg) {
            return (await obj.client.getMessages(msg.peerId, { ids: msg.id - 1 }))[0];
        }
        obj.help["async previousTxt(msg=thatOrThisMsg)"] = "Gets the text of the message before the specified one," +
            " in «here»";
        async function previousTxt(msg = thatOrThisMsg) {
            var _a;
            return (_a = (await previousMsg(msg))) === null || _a === void 0 ? void 0 : _a.message;
        }
        obj.help["async previousMedia(msg=thatOrThisMsg)"] = "Gets the media of the message before the specified one," +
            " in «here»";
        async function previousMedia(msg = thatOrThisMsg) {
            var _a;
            return (_a = (await previousMsg(msg))) === null || _a === void 0 ? void 0 : _a.media;
        }
        return Object.assign(Object.assign({}, obj), { thisMsg,
            thatMsg,
            thatOrThisMsg,
            thisTxt,
            that,
            thatOrThisTxt,
            thisMedia,
            thatMedia,
            thatOrThisMedia,
            txtLimit,
            here,
            hereID,
            extractLongID,
            previousMsg,
            previousTxt,
            previousMedia });
    }
}
//# sourceMappingURL=MsgReferencesModule.js.map