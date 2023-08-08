import {TelegramClient} from "telegram";
import {NewMessageEvent} from "telegram/events/NewMessage.js";
import {Handler} from "../handlers.js";

export function singleOrLast<T>(x: T | T[]): T | null {
    if (Array.isArray(x)) {
        if (x.length === 0) {
            return null;
        } else {
            return x[x.length - 1];
        }
    } else {
        return x;
    }
}

export function buildCyborgramContext(base:BaseContext){
    return {
        async with<R>(module: CyborgramModule<BaseContext, R>):Promise<BaseContext & R> {
            return await module.build(base)
        }
    }
}

export type BaseContext = {
    client: TelegramClient,
    event: NewMessageEvent,
    handlers: Map<string, Handler>,
    wrapAndEval: (client: TelegramClient, event: NewMessageEvent, code: string) => Promise<any>,
    help: Record<string, string>
}

export abstract class CyborgramModule<T extends BaseContext, A> {
    abstract build(obj: T): Promise<T & A>

    andThen<A2>(other: CyborgramModule<T & A, A2>): CyborgramModule<T, A & A2> {
        let self = this
        return new class extends CyborgramModule<T, A & A2> {
            async build(obj: T) {
                return other.build(await self.build(obj))
            }
        }
    }
}
