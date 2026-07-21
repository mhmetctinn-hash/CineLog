import { pushApi } from '../api/notifications';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const bytes = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    bytes[i] = rawData.charCodeAt(i);
  }
  return bytes;
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function getPushSubscriptionState(): Promise<'unsupported' | 'denied' | 'subscribed' | 'unsubscribed'> {
  if (!isPushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  return existing ? 'subscribed' : 'unsubscribed';
}

export async function enablePush(): Promise<void> {
  if (!isPushSupported()) throw new Error('Bu tarayıcı bildirimleri desteklemiyor');

  const { publicKey } = await pushApi.vapidPublicKey();
  if (!publicKey) throw new Error('Bildirimler bu sunucuda henüz yapılandırılmadı');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Bildirim izni verilmedi');

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  await pushApi.subscribe(subscription.toJSON() as PushSubscriptionJSON);
}

export async function disablePush(): Promise<void> {
  if (!isPushSupported()) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  await subscription.unsubscribe();
  if (subscription.endpoint) {
    await pushApi.unsubscribe(subscription.endpoint);
  }
}
