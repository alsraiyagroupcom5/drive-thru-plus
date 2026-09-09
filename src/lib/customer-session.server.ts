/**
 * Signed customer session tokens.
 * Customers authenticate with a phone code (no password), so we mint a
 * short HMAC-signed token instead of a full auth user.
 */

function b64url(bytes: Uint8Array) {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(value: string) {
  const pad = value.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(pad + "=".repeat((4 - (pad.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function key() {
  const secret = process.env["CUSTOMER_SESSION_SECRET"];
  if (!secret) throw new Error("Missing CUSTOMER_SESSION_SECRET");
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signCustomerToken(customerId: string, days = 90) {
  const payload = b64url(
    new TextEncoder().encode(
      JSON.stringify({ sub: customerId, exp: Date.now() + days * 86_400_000 }),
    ),
  );
  const sig = await crypto.subtle.sign("HMAC", await key(), new TextEncoder().encode(payload));
  return `${payload}.${b64url(new Uint8Array(sig))}`;
}

export async function verifyCustomerToken(token: string | null | undefined) {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const ok = await crypto.subtle.verify(
    "HMAC",
    await key(),
    fromB64url(sig),
    new TextEncoder().encode(payload),
  );
  if (!ok) return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as {
      sub: string;
      exp: number;
    };
    if (!data.sub || data.exp < Date.now()) return null;
    return data.sub;
  } catch {
    return null;
  }
}
