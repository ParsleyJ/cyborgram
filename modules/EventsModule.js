import { Command, Handler, Reaction } from "../handlers.js";
import { CyborgramModule } from "./BaseModule.js";
export class AddHandlerUtils extends CyborgramModule {
    async build(obj) {
        function logHandlersSize() {
            console.log(`Handlers count: ${obj.handlers.size}`);
        }
        obj.help["events.setCommand(name: string, r: RegExp, func: string)"] =
            "Adds an handler which executes the string when *you* send a message that matches the regex.";
        function setCommand(name, r, func) {
            let sizeBefore = obj.handlers.size;
            obj.handlers.set(name, new Handler(name, new Command(r), func, obj.wrapAndEval));
            if (sizeBefore != obj.handlers.size) {
                logHandlersSize();
            }
        }
        obj.help["events.setReaction(name: string, fromPredicate: function, r: RegExp, func: string)"] =
            "Adds an handler which executes the string for a new text message. Predicate type: " +
                "fromPredicate: (message: Message, chatType: string, event: NewMessageEvent) => boolean,";
        function setReaction(name, fromPredicate, r, func) {
            let sizeBefore = obj.handlers.size;
            obj.handlers.set(name, new Handler(name, new Reaction(r, fromPredicate), func, obj.wrapAndEval));
            if (sizeBefore != obj.handlers.size) {
                logHandlersSize();
            }
        }
        obj.help["events.remHandler(name: string): boolean"] =
            "Deletes the handler with the specified name.";
        function remHandler(name) {
            let b = obj.handlers.delete(name);
            if (b) {
                logHandlersSize();
            }
            return b;
        }
        // noinspection JSUnusedGlobalSymbols
        return Object.assign(Object.assign({}, obj), { events: {
                logHandlersSize,
                setCommand,
                setReaction,
                remHandler,
            } });
    }
}
//# sourceMappingURL=EventsModule.js.map