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
    primitiveCommands: PrimitiveDefinition[],
    summonLastPrimitive: string,
}

let config: CyborgramConfig | null = null

export function getConfig(): CyborgramConfig {
    if(!config){
        config = JSON.parse(fs.readFileSync("./cyborgramconfig.json").toString())
    }
    return config!!
}