import {SendMessageParams} from "telegram/client/messages.js";
import {Api} from "telegram";
import Message = Api.Message;

declare global {
    // noinspection JSUnusedGlobalSymbols

    interface String {
        splitclip(
            limit?: number,
            multiLimit?: number,
            emptyStringMarker?: string | null,
            lengthMarker?: (length: number) => string,
        ): string[];

        chunked(size: number): string[];

        clip(limit: number, lengthMarker: (length: number) => string): string;

        send(
            params: {
                where?: any,
                sendIfEmpty?: boolean,
                multiLimit?: number,
                schedule?: (number | { getEpochSecond(): number })
            } & Omit<SendMessageParams, "message" | "schedule">,
        ): Promise<Message[]>;

        isBlank(): boolean;

        replaceRange(start: number, length: number, other: string);
    }
}

String.prototype.chunked = function (size: number): string[] {
    const numChunks = Math.ceil(this.length / size);
    const chunks = new Array(numChunks);
    for (let i = 0, o = 0; i < numChunks; ++i, o += size) {

        chunks[i] = this.substring(o, o + size);
    }
    return chunks;
};

String.prototype.clip = function (limit: number, lengthMarker: (length: number) => string): string {
    if (this.length > limit) {
        const lenghtMark = lengthMarker(this.length - limit);
        const result = this.substring(0, limit - lenghtMark.length - 2);
        return result + lenghtMark;
    } else {
        return this;
    }
};

String.prototype.splitclip = function (
    limit: number = 4096,
    multiLimit: number = 5,
    emptyStringMarker: string | null = "«empty»",
    lengthMarker: (length: number) => string
        = ((length) => `\n\n...« remaining: ${length} »...`),
): string[] {
    if (multiLimit < 1) {
        multiLimit = 1;
    }
    const numChunks = Math.min(Math.ceil(this.length / limit), multiLimit);
    const chunks: string[] = [];
    let o = 0;
    for (let i = 0; i < numChunks - 1; ++i) {
        chunks.push(this.substring(o, o + limit));
        o += limit;
    }
    let s = this.substring(o).clip(limit, lengthMarker);
    if (s === "") {
        if (emptyStringMarker !== null) {
            chunks.push(emptyStringMarker);
        }
    } else {
        chunks.push(s);
    }
    return chunks;
};

String.prototype.isBlank = function () {
    return (!this || /^\s*$/.test(this));
};

String.prototype.replaceRange = function (start: number, length: number, replace: string) {
    return this.substring(0, start) + replace + this.substring(start + length, this.length)
}