import {Api} from "telegram";
import {NewMessageEvent} from "telegram/events/NewMessage.js";
import {Command, Handler, Reaction} from "../handlers.js";
import Message = Api.Message;
import {BaseContext, CyborgramModule} from "./BaseModule.js";

export type HandlerUtils = {
    events: {
        setCommand: (name: string, r: RegExp, func: string) => void,
        logHandlersSize: () => void,
        setReaction: (name: string,
                      fromPredicate: (message: Api.Message,
                                      chatType: ("private" | "group" | "channel" | ""),
                                      event: NewMessageEvent) => boolean,
                      r: RegExp,
                      func: string) => void,
        remHandler: (name: string) => boolean
    }
}

export class AddHandlerUtils<T extends BaseContext> extends CyborgramModule<T, HandlerUtils> {

    async build(obj: T) {
        function logHandlersSize() {
            console.log(`Handlers count: ${obj.handlers.size}`);
        }

        obj.help["events.setCommand(name: string, r: RegExp, func: string)"] =
            "Adds an handler which executes the string when *you* send a message that matches the regex."

        function setCommand(name: string, r: RegExp, func: string) {
            let sizeBefore = obj.handlers.size
            obj.handlers.set(name, new Handler(name, new Command(r), func, obj.wrapAndEval));
            if (sizeBefore != obj.handlers.size) {
                logHandlersSize();
            }
        }

        obj.help["events.setReaction(name: string, fromPredicate: function, r: RegExp, func: string)"] =
            "Adds an handler which executes the string for a new text message. Predicate type: " +
            "fromPredicate: (message: Message, chatType: string, event: NewMessageEvent) => boolean,"

        function setReaction(
            name: string,
            fromPredicate: (message: Message,
                            chatType: "private" | "group" | "channel" | "",
                            event: NewMessageEvent) => boolean,
            r: RegExp,
            func: string,
        ) {
            let sizeBefore = obj.handlers.size
            obj.handlers.set(name, new Handler(name, new Reaction(r, fromPredicate), func, obj.wrapAndEval));
            if (sizeBefore != obj.handlers.size) {
                logHandlersSize();
            }
        }


        obj.help["events.remHandler(name: string): boolean"] =
            "Deletes the handler with the specified name."
        function remHandler(name: string): boolean {
            let b = obj.handlers.delete(name);
            if (b) {
                logHandlersSize();
            }
            return b;
        }

        // noinspection JSUnusedGlobalSymbols
        return {
            ...obj,
            events: {
                logHandlersSize,
                setCommand,
                setReaction,
                remHandler,
            }
        }
    }

}