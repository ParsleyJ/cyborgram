import { CyborgramModule } from "./BaseModule.js";
import { getKeys } from "../keys.js";
import { isNullish } from "../utils/nullish.js";
export class AddReservedChatUtils extends CyborgramModule {
    async build(obj) {
        let _selfID = getKeys()["selfID"];
        let _preambleID = getKeys()["preambleID"];
        let _testSiteID = getKeys()["testSiteID"];
        obj.help["log(text = thatOrThisTxt)"] = "Sends a message to 'me'.";
        async function log(text = obj.thatOrThisTxt) {
            if (typeof text !== 'string') {
                text = '' + text;
            }
            await obj.send(text, { where: "me" });
        }
        obj.help["save(txt = that)"] = "Sends a message to the preamble channel.";
        async function save(txt = obj.that) {
            if (typeof txt !== 'string') {
                txt = '' + txt;
            }
            if (txt.length !== 0) {
                console.log(`Saving '${txt}' in preamble...`);
                await obj.send(txt, { where: "" + _preambleID, sendIfEmpty: false });
                console.log("Done saving.");
            }
            else {
                await log("Cannot save an empty string!");
            }
        }
        obj.help["preambleMsgByID(id:number, replyToMessage:boolean=false)"] =
            "Returns the specified preamble message using the id. If replyToMessage is true, it returns the message to " +
                "which the referred message is replying.";
        async function preambleMsgByID(id, replyToMessage = false) {
            var _a;
            let message = ((_a = (await obj.client.getMessages("" + _preambleID, { ids: id }))) !== null && _a !== void 0 ? _a : [null])[0];
            if (replyToMessage && !isNullish(message)) {
                let newId = message.replyToMsgId;
                if (!isNullish(newId)) {
                    return await preambleMsgByID(newId);
                }
            }
            return message;
        }
        obj.help["getPreamble(): string"] = "Get all the preamble contents";
        async function getPreamble() {
            var _a;
            let _preambleMessages = await obj.client.getMessages("" + _preambleID, { limit: undefined });
            console.log("Loading Preamble...");
            let _texts = [];
            for (let _m of _preambleMessages) {
                let _actualText = (_a = _m === null || _m === void 0 ? void 0 : _m.text) !== null && _a !== void 0 ? _a : "";
                //replaces all (not-escaped) $THISMSG with (await client.getMessages("" + _preambleID, {ids: _m.id}))
                _actualText = _actualText.replace(/(?<!\\)\$THISMSG/g, `(await preambleMsgByID(${_m.id}))`);
                _actualText = _actualText.replace(/(?<!\\)\$THATMSG/g, `(await preambleMsgByID(${_m.id}, true))`);
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
        return Object.assign(Object.assign({}, obj), { selfID: _selfID, testSiteID: _testSiteID, preambleID: _preambleID, log,
            save,
            preambleMsgByID,
            getPreamble });
    }
}
//# sourceMappingURL=ReservedChatsModule.js.map