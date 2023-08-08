String.prototype.chunked = function (size) {
    const numChunks = Math.ceil(this.length / size);
    const chunks = new Array(numChunks);
    for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
        chunks[i] = this.substring(o, o + size);
    }
    return chunks;
};
String.prototype.clip = function (limit, lengthMarker) {
    if (this.length > limit) {
        const lenghtMark = lengthMarker(this.length - limit);
        const result = this.substring(0, limit - lenghtMark.length - 2);
        return result + lenghtMark;
    }
    else {
        return this;
    }
};
String.prototype.splitclip = function (limit = 4096, multiLimit = 5, emptyStringMarker = "«empty»", lengthMarker = ((length) => `\n\n...« remaining: ${length} »...`)) {
    if (multiLimit < 1) {
        multiLimit = 1;
    }
    const numChunks = Math.min(Math.ceil(this.length / limit), multiLimit);
    const chunks = [];
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
    }
    else {
        chunks.push(s);
    }
    return chunks;
};
String.prototype.isBlank = function () {
    return (!this || /^\s*$/.test(this));
};
String.prototype.replaceRange = function (start, length, replace) {
    return this.substring(0, start) + replace + this.substring(start + length, this.length);
};
export {};
//# sourceMappingURL=extensions.js.map