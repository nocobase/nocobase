import {
  createInMemoryBroker,
  createMessageBrokerService,
  IN_MEMORY_CAPABILITIES,
} from '@nocobase/message-broker';

import {
  defineMessageBrokerContract,
  silentLogger,
} from '@nocobase/message-broker/contract';

defineMessageBrokerContract({
  name: 'inMemory',
  capabilities: IN_MEMORY_CAPABILITIES,
  entry: ({ scope, publishers, subscriptions }) => ({
    adapter: 'inMemory',
    publishers: Object.fromEntries(
      Object.entries(publishers).map(([name, channel]) => [
        name,
        { topic: `${scope}.${channel}` },
      ]),
    ),
    subscriptions: Object.fromEntries(
      Object.entries(subscriptions).map(([name, { channel, ...options }]) => [
        name,
        { ...options, topic: `${scope}.${channel}` },
      ]),
    ),
  }),
  missingTopology: (scope) => ({
    entry: {
      adapter: 'inMemory',
      topics: [`${scope}.present`],
      publishers: { missing: { topic: `${scope}.absent` } },
    },
    resource: `topic "${scope}.absent"`,
  }),
  create: (entry) => {
    const inMemory = createInMemoryBroker();
    return {
      service: createMessageBrokerService(
        { default: 'contract', backends: { contract: entry } },
        { appName: 'contract', logger: silentLogger, inMemory },
      ),
      deadLetters: (subscription) =>
        Promise.resolve(
          inMemory.deadLetters(subscription).map(({ message, reason }) => ({
            messageId: message.messageId,
            reason,
          })),
        ),
    };
  },
});
