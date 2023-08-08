import fs from "fs";
let config = null;
export function getConfig() {
    if (!config) {
        config = JSON.parse(fs.readFileSync("./cyborgramconfig.json").toString());
    }
    return config;
}
//# sourceMappingURL=config.js.map