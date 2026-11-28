import { request } from 'node:https';
import webPush from 'web-push';
import { parsePushProxy, type PushConfig } from './config.js';
import type { PushDeliveryOptions } from './service.js';
import { vapidKeys } from './keys.js';
import { validateEndpoint, type Subscriptions } from './subscriptions.js';

/** No redirects, no response bodies, and the queue's abort/deadline applies to the actual socket. */
export async function sendPush(
  subscription: ReturnType<Subscriptions['open']>,
  payload: object,
  config: PushConfig,
  signal: AbortSignal,
  options?: PushDeliveryOptions,
): Promise<number> {
  const endpoint = validateEndpoint(subscription.endpoint);
  const details = webPush.generateRequestDetails(
    subscription,
    JSON.stringify(payload),
    {
      contentEncoding: 'aes128gcm',
      TTL: options?.ttl ?? 300,
      urgency: options?.urgency ?? 'normal',
      vapidDetails: {
        subject: config.contact,
        ...vapidKeys(config.privateKey!),
      },
    },
  );
  if (config.proxyUrl) {
    signal.throwIfAborted();
    const proxy = parsePushProxy(config.proxyUrl);
    const { ProxyAgent, request: proxyRequest } = await import('undici');
    const dispatcher = new ProxyAgent({
      uri: proxy.href,
      connectTimeout: 5_000,
    });
    try {
      const response = await proxyRequest(endpoint, {
        dispatcher,
        method: 'POST',
        headers: details.headers,
        body: details.body,
        signal,
      });
      // Undici aborts the unread body on destroy, which can emit a stream error.
      response.body.on('error', () => {}).destroy();
      return response.statusCode;
    } catch {
      throw new Error('Web Push proxy transport failed.');
    } finally {
      await dispatcher.destroy();
    }
  }
  return new Promise((resolve, reject) => {
    const req = request(
      endpoint,
      { method: 'POST', headers: details.headers, signal, agent: false },
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
