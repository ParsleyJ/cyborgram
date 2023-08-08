import * as fs from "fs";
let keys = null;
export function getKeys() {
    var _a;
    if (!keys) {
        keys = JSON.parse(fs.readFileSync((_a = process.env.KEYS_FILE) !== null && _a !== void 0 ? _a : "").toString());
    }
    return keys;
}
//# sourceMappingURL=keys.js.map