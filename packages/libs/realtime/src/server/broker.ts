import type { RealtimeBroker, RealtimeBrokerEvent } from './types.js';

/** An isolated, non-durable broadcaster owned by one service. */
export function createInMemoryBroker(): RealtimeBroker {
  let receive: ((event: RealtimeBrokerEvent) => Promise<void>) | undefined;
  let closed = false;
  return {
    setup(listener, callbacks) {
      if (closed)
        return Promise.reject(new Error('Realtime broker is closed.'));
      receive = listener;
      callbacks?.onStateChange('ready');
      return Promise.resolve();
    },
    async publish(event) {
      if (!receive || closed) throw new Error('Realtime broker is not ready.');
      await receive(event);
    },
    shutdown() {
      closed = true;
      receive = undefined;
      return Promise.resolve();
    },
  };
}
