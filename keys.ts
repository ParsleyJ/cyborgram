import * as fs from "fs";


export type CyborgramKeys = {
    apiID: number,
    apiHash: string,
    selfID: string,
    errDumpID?: string,
    preambleID?: string,
}

let keys: CyborgramKeys | null = null

export function getKeys(): CyborgramKeys {
    if (!keys) {
        keys = JSON.parse(fs.readFileSync(process.env.KEYS_FILE ?? "").toString())
    }
    return keys!!
}