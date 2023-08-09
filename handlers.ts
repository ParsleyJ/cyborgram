import {NewMessageEvent} from "telegram/events/NewMessage.js";
import {Api, client, TelegramClient} from "telegram";
import {getKeys} from "./keys.js";
import Message = Api.Message;

export abstract class Trigger {
    private readonly _typeName: string;

    protected constructor(typeName: string) {
        this._typeName = typeName;
    }

    get typeName(): string {
        return this._typeName;
    }

    abstract attemptMatch(event: NewMessageEvent): any[] | false
}

export class Reaction extends Trigger {
    private readonly _regex: RegExp;
    private readonly _fromPredicate: (
        message: Api.Message,
        chatType: "private" | "group" | "channel" | "",
        event: NewMessageEvent,
    ) => boolean;

    constructor(
        regex: RegExp,
        fromPredicate: (
            message: Message,
            chatType: "private" | "group" | "channel" | "",
            event: NewMessageEvent,
        ) => boolean,
        typeName: string = "reaction",
    ) {
        super(typeName);
        this._regex = regex;
        this._fromPredicate = fromPredicate;
    }

    get fromPredicate(): (
        message: Message,
        chatType: "private" | "group" | "channel" | "",
        event: NewMessageEvent,
    ) => boolean {
        return this._fromPredicate;
    }

    get regex(): RegExp {
        return this._regex;
    }


    attemptMatch(event: NewMessageEvent): any[] | false {
        let message = event?.message;
        let chatType: "private" | "group" | "channel" | "";
        if (event.isPrivate) {
            chatType = "private";
        } else if (event.isGroup) {
            chatType = "group";
        } else if (event.isChannel) {
            chatType = "channel";
        } else {
            chatType = "";
        }

        if (this.fromPredicate(message, chatType, event)) {
            let text = message?.text;
            if (text?.length > 0) {
                let regExpMatchArray = text.match(this.regex);
                if (regExpMatchArray === null) {
                    return false;
                }
                let result: string[] = [];
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
    constructor(regex: RegExp) {
        super(regex, (message => message?.senderId?.compare?.(getKeys()["selfID"]) === 0), "command");
    }
}

export class Handler {
    private readonly _func: string;
    private readonly _name: string;
    private readonly _trigger: Trigger;
    private readonly _executor: (client: TelegramClient, event: NewMessageEvent, code: string) => Promise<any>;

    constructor(
        name: string,
        trigger: Trigger,
        f: string,
        executor: (
            client: TelegramClient,
            event: NewMessageEvent,
            code: string,
        ) => Promise<any>,
    ) {
        this._name = name;
        this._trigger = trigger;
        this._func = f;
        this._executor = executor;
    }

    get name(): string {
        return this._name;
    }

    get trigger(): Trigger {
        return this._trigger;
    }

    get func(): string {
        return this._func;
    }

    async evaluate(client: TelegramClient, event: NewMessageEvent): Promise<void> {
        let attemptMatch = this.trigger.attemptMatch(event);
        if (!attemptMatch) {
            return;
        }

        try {
            let func = await this._executor(client, event, this.func);
            if (typeof func === 'function') {
                await func(attemptMatch);
            }
        } catch (e) {
            console.log(`Error when attempting to evaluate handler ${this.name} with function=«${this.func}»`)
            console.log(e);
            await client.sendMessage(getKeys()["errDumpID"]??"me", {message: "" + e});
        }
    }
}