import { afterEach, expect, it, vi } from 'vitest';
import { readWithSessionRecovery } from './session';

afterEach(() => vi.unstubAllGlobals());

it('renews an expired session and retries the read with cookies', async () => {
  const request = vi.fn().mockResolvedValueOnce(new Response(null, { status: 403 }))
    .mockResolvedValueOnce(Response.json({ connected: true }));
  vi.stubGlobal('fetch', request);
  const renew = vi.fn(async () => undefined);
  await expect(readWithSessionRecovery('/state', renew)).resolves.toEqual({ connected: true });
  expect(renew).toHaveBeenCalledOnce();
  expect(request).toHaveBeenCalledTimes(2);
  expect(request).toHaveBeenLastCalledWith('/state', { credentials: 'include', cache: 'no-store' });
});

it('does not retry indefinitely when the renewed session is rejected', async () => {
  const request = vi.fn().mockResolvedValue(new Response(null, { status: 403 }));
  vi.stubGlobal('fetch', request);
  const renew = vi.fn(async () => undefined);
  await expect(readWithSessionRecovery('/state', renew)).rejects.toThrow();
  expect(renew).toHaveBeenCalledOnce();
  expect(request).toHaveBeenCalledTimes(2);
});

it('does not renew sessions for network failures or server errors', async () => {
  const request = vi.fn().mockRejectedValueOnce(new TypeError('Network unavailable'))
    .mockResolvedValueOnce(new Response(null, { status: 500 }));
  vi.stubGlobal('fetch', request);
  const renew = vi.fn(async () => undefined);
  await expect(readWithSessionRecovery('/state', renew)).rejects.toThrow();
  await expect(readWithSessionRecovery('/state', renew)).rejects.toThrow();
  expect(renew).not.toHaveBeenCalled();
  expect(request).toHaveBeenCalledTimes(2);
});
