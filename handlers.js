import { getKeys } from "./keys.js";
export class Trigger {
    constructor(typeName) {
        this._typeName = typeName;
    }
    get typeName() {
        return this._typeName;
    }
}
export class Reaction extends Trigger {
    constructor(regex, fromPredicate, typeName = "reaction") {
        super(typeName);
        this._regex = regex;
        this._fromPredicate = fromPredicate;
    }
    get fromPredicate() {
        return this._fromPredicate;
    }
    get regex() {
        return this._regex;
    }
    attemptMatch(event) {
        let message = event === null || event === void 0 ? void 0 : event.message;
        let chatType;
        if (event.isPrivate) {
            chatType = "private";
        }
        else if (event.isGroup) {
            chatType = "group";
        }
        else if (event.isChannel) {
            chatType = "channel";
        }
        else {
            chatType = "";
        }
        if (this.fromPredicate(message, chatType, event)) {
            let text = message === null || message === void 0 ? void 0 : message.text;
            if ((text === null || text === void 0 ? void 0 : text.length) > 0) {
                let regExpMatchArray = text.match(this.regex);
                if (regExpMatchArray === null) {
                    return false;
                }
                let result = [];
                for (let elem of regExpMatchArray) {
                    result.push(elem);
                }
                return result;
            }
        }
        return false;
    }
}
export class Command extends Reaction {
    constructor(regex) {
        super(regex, (message => { var _a, _b; return ((_b = (_a = message === null || message === void 0 ? void 0 : message.senderId) === null || _a === void 0 ? void 0 : _a.compare) === null || _b === void 0 ? void 0 : _b.call(_a, getKeys()["selfID"])) === 0; }), "command");
    }
}
export class Handler {
    constructor(name, trigger, f, executor) {
        this._name = name;
        this._trigger = trigger;
        this._func = f;
        this._executor = executor;
    }
    get name() {
        return this._name;
    }
    get trigger() {
        return this._trigger;
    }
    get func() {
        return this._func;
    }
    async evaluate(client, event) {
        var _a;
        let attemptMatch = this.trigger.attemptMatch(event);
        if (!attemptMatch) {
            return;
        }
        try {
            let func = await this._executor(client, event, this.func);
            if (typeof func === 'function') {
                await func(attemptMatch);
            }
        }
        catch (e) {
            console.log(`Error when attempting to evaluate handler ${this.name} with function=«${this.func}»`);
            console.log(e);
            await client.sendMessage((_a = getKeys()["errDumpID"]) !== null && _a !== void 0 ? _a : "me", { message: "" + e });
        }
    }
}
//# sourceMappingURL=handlers.js.map