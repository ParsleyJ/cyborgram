import {BaseContext, CyborgramModule} from "./BaseModule.js";
import {isNullish, nullish} from "../utils/nullish.js";

export type JSUtils = {
    jsutils: {
        ls: (obj, levels?: number) => string,
        protoNavigate: <T>(obj: object, func: (x, prop) => T, levels?: number) => Map<string, T>,
        mapStr: (map: Map<unknown, unknown>) => string,
        isNullish: (o: any) => o is nullish,
    },
    delay: (ms: number, func?: () => unknown) => void | Promise<void>,
}

export class AddJSUtils<T extends BaseContext> extends CyborgramModule<T, JSUtils> {
    async build(obj: T) {
        function protoNavigate<T>(obj: object, func: (x, prop) => T, levels: number = 10): Map<string, T> {
            let map = new Map<string, T>();
            if (levels !== 0) {
                let ob = Object.getPrototypeOf(obj);
                if (ob) {
                    let subMap = protoNavigate(ob, func, levels - 1);
                    subMap.forEach((v, k) => map.set(k, v));
                }
            }
            Object.getOwnPropertyNames(obj).forEach((prop) => {
                map.set(prop, func(obj, prop));
            });
            return map;
        }

        function mapStr(map: Map<unknown, unknown>): string {
            let result = "{\n";
            map.forEach((v, k) => result += `${k} : ${v}\n`);
            return result + "}";
        }

        function delay(ms: number, func?: () => unknown): void | Promise<void> {
            if (func === undefined) {
                return new Promise((resolve) => setTimeout(resolve, ms));
            } else {
                setTimeout(func, ms);
            }
        }

        function ls(obj, levels: number = 0): string {
            let map = protoNavigate(obj, (x, prop) => '' + (typeof x[prop]), levels);
            return mapStr(map);
        }

        // noinspection JSUnusedGlobalSymbols
        return {
            ...obj,
            jsutils: {
                protoNavigate,
                mapStr,
                ls,
                isNullish,
            },
            delay
        }
    }
}