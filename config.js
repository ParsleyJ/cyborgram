import fs from "fs";
let config = null;
export let configFileName = "cyborgramconfig.json";
export function getConfig() {
    if (!config) {
        try {
            config = JSON.parse(fs.readFileSync("./" + configFileName).toString());
        }
        catch (e) {
            if (e instanceof Error && e["code"] === "ENOENT") {
                console.log("Configuration file not found: creating new from default template.");
                let fileUrl = new URL(configFileName, import.meta.url);
                let configText = fs.readFileSync(fileUrl, { encoding: "utf-8" }).toString();
                config = JSON.parse(configText);
                fs.writeFileSync("./" + configFileName, configText);
            }
        }
    }
    return config;
}
//# sourceMappingURL=config.js.map