import { CyborgramModule } from "./BaseModule.js";
import { isNullish } from "../utils/nullish.js";
export class AddJSUtils extends CyborgramModule {
    async build(obj) {
        function protoNavigate(obj, func, levels = 10) {
            let map = new Map();
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
        function mapStr(map) {
            let result = "{\n";
            map.forEach((v, k) => result += `${k} : ${v}\n`);
            return result + "}";
        }
        function delay(ms, func) {
            if (func === undefined) {
                return new Promise((resolve) => setTimeout(resolve, ms));
            }
            else {
                setTimeout(func, ms);
            }
        }
        function ls(obj, levels = 0) {
            let map = protoNavigate(obj, (x, prop) => '' + (typeof x[prop]), levels);
            return mapStr(map);
        }
        // noinspection JSUnusedGlobalSymbols
        return Object.assign(Object.assign({}, obj), { jsutils: {
                protoNavigate,
                mapStr,
                ls,
                isNullish,
            }, delay });
    }
}
//# sourceMappingURL=JSUtilsModule.js.map