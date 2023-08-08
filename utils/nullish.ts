export type nullish = null | undefined;

export function isNullish(x: any | nullish): x is nullish {
    return x == null;
}