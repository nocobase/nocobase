import { request } from 'node:https';
import webPush from 'web-push';
import type { PushConfig } from './config.js';
import { vapidKeys } from './keys.js';
import { validateEndpoint, type Subscriptions } from './subscriptions.js';

/** No redirects, no response bodies, and the queue's abort/deadline applies to the actual socket. */
export async function sendPush(
  subscription: ReturnType<Subscriptions['open']>,
  payload: object,
  config: PushConfig,
  signal: AbortSignal,
): Promise<number> {
  const endpoint = validateEndpoint(subscription.endpoint);
  const details = webPush.generateRequestDetails(
    subscription,
    JSON.stringify(payload),
    {
      contentEncoding: 'aes128gcm',
      TTL: 300,
      urgency: 'normal',
      vapidDetails: {
        subject: config.contact,
        ...vapidKeys(config.privateKey!),
      },
    },
  );
  return new Promise((resolve, reject) => {
    const req = request(
      endpoint,
      { method: 'POST', headers: details.headers, signal },
      (response) => {
        const status = response.statusCode ?? 500;
        response.destroy();
        resolve(status);
      },
    );
    req.on('error', () => reject(new Error('Web Push transport failed.')));
    req.end(details.body);
  });
}
