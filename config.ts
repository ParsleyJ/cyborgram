import fs from "fs";


export type PrimitiveDefinition = {
    type: "prefix",
    key: string,
    name: string,
    description?: string,
    result: "none" | "getEvaluated" | "getReturned",
    onEnd: "keep" | "delete" | "replace" | "append",
    appendSeparator?: string
}

export type CyborgramConfig = {
    summonLastPrimitive: string,
    killswitch: string,
    primitiveCommands: PrimitiveDefinition[],
}

let config: CyborgramConfig | null = null

export let configFileName = "cyborgramconfig.json"

export function getConfig(): CyborgramConfig {
    if(!config){
        try {
            config = JSON.parse(fs.readFileSync("./"+configFileName).toString())
        }catch (e){
            if (e instanceof Error && e["code"] === "ENOENT") {
                console.log("Configuration file not found: creating new from default template.")
                let fileUrl = new URL(configFileName, import.meta.url);
                let configText = fs.readFileSync(fileUrl, {encoding:"utf-8"}).toString();
                config = JSON.parse(configText)
                fs.writeFileSync("./"+configFileName, configText)
            }
        }
    }
    return config!!
}