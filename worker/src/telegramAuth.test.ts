import { describe, expect, it } from 'vitest';
import { validateInitData } from './telegramAuth';

const BOT_TOKEN = 'test-bot-token';

// Uses Web Crypto (same runtime as telegramAuth.ts itself) instead of Node's `crypto` module,
// so this file needs no Node type/global additions on top of @cloudflare/workers-types.
async function hmacSha256Hex(key: BufferSource, data: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function signInitData(fields: Record<string, string>, botToken = BOT_TOKEN): Promise<string> {
  const dataCheckString = Object.entries(fields)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const secretKeyHex = await hmacSha256Hex(new TextEncoder().encode('WebAppData'), botToken);
  const secretKeyBytes = new Uint8Array(secretKeyHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  const hash = await hmacSha256Hex(secretKeyBytes, dataCheckString);
  return new URLSearchParams({ ...fields, hash }).toString();
}

function freshFields(overrides: Partial<Record<string, string>> = {}) {
  return {
    auth_date: String(Math.floor(Date.now() / 1000)),
    query_id: 'AAtest',
    user: JSON.stringify({ id: 42, first_name: 'Ada' }),
    ...overrides,
  };
}

describe('validateInitData', () => {
  it('accepts a correctly signed, fresh initData and returns the user', async () => {
    const initData = await signInitData(freshFields());
    const user = await validateInitData(initData, BOT_TOKEN);
    expect(user).toEqual({ id: 42, first_name: 'Ada' });
  });

  it('rejects a tampered payload (hash no longer matches)', async () => {
    const initData = await signInitData(freshFields());
    const tampered = initData.replace('Ada', 'Eve');
    expect(await validateInitData(tampered, BOT_TOKEN)).toBeNull();
  });

  it('rejects when signed with the wrong bot token', async () => {
    const initData = await signInitData(freshFields(), 'a-different-bot-token');
    expect(await validateInitData(initData, BOT_TOKEN)).toBeNull();
  });

  it('rejects initData with no hash at all', async () => {
    const params = new URLSearchParams(freshFields());
    expect(await validateInitData(params.toString(), BOT_TOKEN)).toBeNull();
  });

  it('rejects expired initData beyond maxAgeSeconds', async () => {
    const twoHoursAgo = Math.floor(Date.now() / 1000) - 7200;
    const initData = await signInitData(freshFields({ auth_date: String(twoHoursAgo) }));
    expect(await validateInitData(initData, BOT_TOKEN, 3600)).toBeNull();
  });

  it('accepts initData still within a custom maxAgeSeconds window', async () => {
    const tenMinutesAgo = Math.floor(Date.now() / 1000) - 600;
    const initData = await signInitData(freshFields({ auth_date: String(tenMinutesAgo) }));
    expect(await validateInitData(initData, BOT_TOKEN, 3600)).not.toBeNull();
  });

  it('rejects a well-signed payload with unparseable user JSON', async () => {
    const initData = await signInitData(freshFields({ user: 'not-json' }));
    expect(await validateInitData(initData, BOT_TOKEN)).toBeNull();
  });
});
