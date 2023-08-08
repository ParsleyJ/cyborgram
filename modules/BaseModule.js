export function singleOrLast(x) {
    if (Array.isArray(x)) {
        if (x.length === 0) {
            return null;
        }
        else {
            return x[x.length - 1];
        }
    }
    else {
        return x;
    }
}
export function buildCyborgramContext(base) {
    return {
        async with(module) {
            return await module.build(base);
        }
    };
}
export class CyborgramModule {
    andThen(other) {
        let self = this;
        return new class extends CyborgramModule {
            async build(obj) {
                return other.build(await self.build(obj));
            }
        };
    }
}
//# sourceMappingURL=BaseModule.js.map