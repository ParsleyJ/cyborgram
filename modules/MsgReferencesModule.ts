import {Api} from "telegram";
import long = Api.long;
import TypePeer = Api.TypePeer;
import TypeMessageMedia = Api.TypeMessageMedia;
import Message = Api.Message;
import PeerUser = Api.PeerUser;
import PeerChat = Api.PeerChat;
import PeerChannel = Api.PeerChannel;
import {BaseContext, CyborgramModule} from "./BaseModule.js";
import {nullish} from "../utils/nullish.js";

export type MessageReferences = {
    thisMsg: Message,
    thatMsg: Message | undefined,
    thatOrThisMsg: Message,
    thisTxt: string,
    that: string | undefined,
    thatOrThisTxt: string,
    thisMedia: TypeMessageMedia | undefined,
    thatMedia: TypeMessageMedia | undefined,
    thatOrThisMedia: TypeMessageMedia | undefined,
    txtLimit: number,
    here: TypePeer,
    hereID: long | nullish,
    previousMsg: () => Promise<Message>;
    previousTxt: () => Promise<string>;
    previousMedia: () => Promise<TypeMessageMedia | nullish>;
    extractLongID: (peer?: (TypePeer | nullish)) => (long | nullish)
}

export class AddMessageReferences<T extends BaseContext>
    extends CyborgramModule<T, MessageReferences> {
    async build(obj: T) {
        obj.help["thisMsg"] = "The message that issued the command"
        let thisMsg: Message = obj.event.message;
        obj.help["thatMsg"] = "The message to which thisMsg is replying to (or undefined)."
        let thatMsg: Api.Message | undefined = await thisMsg.getReplyMessage();
        obj.help["thatOrThisMsg"] = "thatMsg ?? thisMsg"
        let thatOrThisMsg: Message = thatMsg ?? thisMsg;

        obj.help["thisTxt"] = "The text of thisMsg (or undefined)."
        let thisTxt: string = thisMsg.text;
        obj.help["that"] = "The text of thatMsg (or undefined)."
        let that: string | undefined = thatMsg?.text;
        obj.help["thatOrThisTxt"] = "that ?? thisTxt"
        let thatOrThisTxt: string = that ?? thisTxt;

        obj.help["thisMedia"] = "The media sent with thisMsg (undefined if none)"
        let thisMedia: TypeMessageMedia | undefined = thisMsg?.media;
        obj.help["thatMedia"] = "The media sent with thatMsg (undefined if none)"
        let thatMedia: TypeMessageMedia | undefined = thatMsg?.media;
        obj.help["thatOrThisMedia"] = "The media sent with thatOrThisMsg (undefined if none)"
        let thatOrThisMedia: TypeMessageMedia | undefined = thatOrThisMsg.media;

        obj.help["txtLimit"] = "The current maximum of characters that a text message can support"
        let txtLimit: number = 4096;

        obj.help["here"] = "The peer to which thisMsg was sent"
        let here: TypePeer | undefined = thisMsg?.peerId;
        obj.help["hereID"] = "The peer ID (as a long number) to which thisMsg was sent " +
            "(or null if impossible to extract)"
        let hereID: long | nullish = extractLongID(thisMsg?.peerId);

        obj.help["tgutils.extractLongID(peer: Api.TypePeer=thatOrThisMsg.peerId): long"] =
            "Gets the numeric ID from the peerId object."

        function extractLongID(peer: TypePeer | nullish = thatOrThisMsg.peerId): long | nullish {
            if (peer instanceof PeerUser) {
                return peer.userId;
            } else if (peer instanceof PeerChat) {
                return peer.chatId;
            } else if (peer instanceof PeerChannel) {
                return peer.channelId;
            } else {
                return null;
            }
        }

        obj.help["async previousMsg(msg=thatOrThisMsg)"] = "Gets the message before the specified one," +
            " in «here»"

        async function previousMsg(msg: Message = thatOrThisMsg): Promise<Message> {
            return (await obj.client.getMessages(msg.peerId, {ids: msg.id - 1}))[0]
        }

        obj.help["async previousTxt(msg=thatOrThisMsg)"] = "Gets the text of the message before the specified one," +
            " in «here»"

        async function previousTxt(msg: Message = thatOrThisMsg): Promise<string> {
            return (await previousMsg(msg))?.message;
        }

        obj.help["async previousMedia(msg=thatOrThisMsg)"] = "Gets the media of the message before the specified one," +
            " in «here»"

        async function previousMedia(msg: Message = thatOrThisMsg): Promise<TypeMessageMedia | nullish> {
            return (await previousMsg(msg))?.media;
        }


        return {
            ...obj,
            thisMsg,
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
            previousMedia,
        }
    }
}