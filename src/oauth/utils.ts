import { createHash, randomBytes } from 'node:crypto';

export function base64UrlEncode(input: Buffer): string {
  return input
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function sha256Base64Url(value: string): string {
  const hash = createHash('sha256').update(value).digest();
  return base64UrlEncode(hash);
}

export function generateToken(bytes = 32): string {
  return base64UrlEncode(randomBytes(bytes));
}

export function isValidPkceS256(verifier: string, challenge: string): boolean {
  return sha256Base64Url(verifier) === challenge;
}
