// Minimal Node polyfills to support AgentKit in Next.js Node runtime
import * as nodeCrypto from "crypto";
import { TextEncoder as UtilTextEncoder, TextDecoder as UtilTextDecoder } from "util";

// Ensure Web Crypto API is available
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g: any = globalThis as unknown as { [key: string]: unknown };

if (!g.crypto && (nodeCrypto as unknown as { webcrypto?: Crypto }).webcrypto) {
    g.crypto = (nodeCrypto as unknown as { webcrypto?: Crypto }).webcrypto as unknown as Crypto;
}

// Ensure TextEncoder/TextDecoder exist
if (!g.TextEncoder && UtilTextEncoder) {
    g.TextEncoder = UtilTextEncoder as unknown as typeof TextEncoder;
}
if (!g.TextDecoder && UtilTextDecoder) {
    g.TextDecoder = UtilTextDecoder as unknown as typeof TextDecoder;
}

// Provide atob/btoa if missing
if (typeof (g as unknown as { atob?: unknown }).atob !== "function") {
    g.atob = (b64: string): string => Buffer.from(b64, "base64").toString("binary");
}
if (typeof (g as unknown as { btoa?: unknown }).btoa !== "function") {
    g.btoa = (str: string): string => Buffer.from(str, "binary").toString("base64");
}

// Add base64url support for Buffer on Node versions that lack it
(() => {
    const hasBase64Url = (() => {
        try {
            // Attempt decoding using base64url. Some Node versions may throw.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (Buffer as any).from("", "base64url");
            return true;
        } catch {
            return false;
        }
    })();

    if (hasBase64Url) return;

    const originalFrom = Buffer.from.bind(Buffer) as typeof Buffer.from;
    const originalToString: (this: Buffer, encoding?: BufferEncoding, start?: number, end?: number) => string = Buffer.prototype.toString;

    function addPadding(base64: string): string {
        const pad = base64.length % 4;
        if (pad === 0) return base64;
        if (pad === 2) return base64 + "==";
        if (pad === 3) return base64 + "=";
        return base64; // pad===1 is invalid, return as-is
    }

    // Monkey-patch Buffer.from to accept 'base64url'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Buffer as any).from = function fromPolyfill(value: any, encodingOrOffset?: any, length?: any): Buffer {
        if (typeof encodingOrOffset === "string" && encodingOrOffset.toLowerCase() === "base64url") {
            const normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
            return originalFrom(addPadding(normalized), "base64");
        }
        return originalFrom(value as never, encodingOrOffset as never, length as never);
    } as typeof Buffer.from;

    // Monkey-patch Buffer.prototype.toString to support 'base64url'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Buffer.prototype as any).toString = function patchedToString(this: Buffer, encoding?: any, start?: any, end?: any) {
        if (encoding && String(encoding).toLowerCase() === "base64url") {
            let s = originalToString.call(this, "base64", start, end) as string;
            s = s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
            return s;
        }
        return originalToString.call(this, encoding as never, start as never, end as never);
    } as typeof Buffer.prototype.toString;
})();


