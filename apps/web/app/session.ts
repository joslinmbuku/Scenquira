import { en } from '../../../packages/shared/src/messages/en';

// Only retry read requests. Production commands must never be replayed automatically.
export async function readWithSessionRecovery(url: string, renew: () => Promise<void>) {
  const request = () => fetch(url, { credentials: 'include', cache: 'no-store' });
  let response = await request();
  if (response.status === 403) {
    await renew();
    response = await request();
  }
  if (!response.ok) throw new Error(en.error);
  return response.json();
}
