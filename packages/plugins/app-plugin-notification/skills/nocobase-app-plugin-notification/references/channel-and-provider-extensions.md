# Channel Type Extensions

Implement `ChannelInstance` in a class, and register the class once with `registerChannelType`. The class's static `type` is the configuration discriminator. A configured name selects an independent instance; `system-email` and `marketing-email` may both use `smtp`. Extension authors need no separate message-family or Provider registration and no abstract base class.

## Contract

`registerChannelType(ChannelClass)` checks the constructor and static members against `ChannelTypeClass<TConfig, TMessage, TRecipient, TPrepared>`. `implements ChannelInstance` checks instance methods; it does not check statics by itself. Duplicate identifiers, including collisions with legacy Provider definitions, fail registration.

| Member                          | Responsibility                                                                                                                                  |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Static `type`                   | Required, globally unique, non-empty trimmed identifier.                                                                                        |
| Static `label`                  | Optional safe display label or translation descriptor.                                                                                          |
| Static `validateConfig(config)` | Optional synchronous configuration validation, before constructing instances.                                                                   |
| Static `test`                   | Optional safe test fields and `toSendInput`; receives normalized config and must return the normal message input.                               |
| Constructor `(context, config)` | Receive this named channel's context and normalized configuration. Avoid allocating resources that cannot be cleaned up if construction throws. |
| `initialize()`                  | Optional asynchronous resource initialization.                                                                                                  |
| `validateMessage(unknown)`      | Validate and normalize the complete message; expand native recipient snapshots before persistence.                                              |
| `prepare(input)`                | Build one delivery's payload without external delivery side effects; honor `signal`.                                                            |
| `send(input)`                   | Submit once and classify the outcome. Includes prepared `message`, `notificationId`, `deliveryId`, `attemptId`, `deadline` and `signal`.        |
| `capabilities`                  | Optional instance metadata about transport idempotency.                                                                                         |
| `close()`                       | Optional cleanup of resources owned by this instance. Never close services owned by the host container.                                         |

The context has exactly these members:

```ts
interface ChannelContext {
  readonly channelName: string;
  readonly container: ServiceContainer;
}
```

Use `context.container.resolve(serviceToken)` for application services. There is no `logger`, `now()` or `resolve()` wrapper on the context. A constructor receives a configuration with `type`; the compatibility `provider` property has been removed. Configuration validation should be synchronous and side-effect free.

The runtime caches one instance per configured name, coalesces concurrent initialization, and closes a partially initialized instance if `initialize()` rejects. A later request can initialize a fresh instance. During shutdown the runtime stops accepting new sends, drains active requests and jobs, then closes instances in reverse creation order. Classes must respect cancellation and own any initialization timeouts they need. Register all types before activation.

## Complete custom class example

This example assumes a team webhook contract where HTTP 2xx confirms acceptance, 4xx confirms rejection, and 5xx or a lost response leaves submission uncertain. Replace the allowlisted hostname and result classification with the actual service contract. It does not claim server-side idempotency just because it sends a delivery ID.

```ts
import {
  notificationExtensionRegistryToken,
  type ChannelConfig,
  type ChannelContext,
  type ChannelInstance,
  type ChannelPreparationInput,
  type ChannelSendInput,
  type ChannelSendResult,
  type NotificationTestAdapter,
  type ValidatedChannelMessage,
} from '@nocobase/app-plugin-notification';
import { ServiceProvider } from '@nocobase/service-provider';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';

interface TeamWebhookConfig extends ChannelConfig {
  readonly type: 'team-webhook';
  readonly endpoint: string;
  readonly apiKey: string;
}
interface TeamMessage {
  readonly text: string;
}
interface TeamRecipient {
  readonly webhook: true;
}

export class TeamWebhookChannel implements ChannelInstance<
  TeamMessage,
  TeamRecipient,
  TeamMessage
> {
  static readonly type = 'team-webhook';
  static readonly label = 'Team webhook';
  static readonly test: NotificationTestAdapter<TeamWebhookConfig> = {
    label: 'Team webhook',
    fields: [
      {
        name: 'text',
        label: 'Text',
        type: 'textarea',
        required: true,
        maxLength: 2000,
      },
    ],
    toSendInput: ({ values }) => ({ text: values.text }),
  };

  static validateConfig(config: TeamWebhookConfig): void {
    if (typeof config.endpoint !== 'string' || !URL.canParse(config.endpoint))
      throw new Error('A valid team webhook endpoint is required.');
    const url = new URL(config.endpoint);
    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'hooks.example.com' ||
      url.port ||
      url.username ||
      url.password
    )
      throw new Error(
        'The team webhook endpoint must use the approved HTTPS host.',
      );
    if (typeof config.apiKey !== 'string' || !config.apiKey.trim())
      throw new Error('A team webhook API key is required.');
  }

  constructor(
    private readonly context: ChannelContext,
    private readonly config: TeamWebhookConfig,
  ) {}

  validateMessage(
    input: unknown,
  ): ValidatedChannelMessage<TeamMessage, TeamRecipient> {
    if (!input || typeof input !== 'object' || Array.isArray(input))
      throw new Error('A team webhook message is required.');
    const text: unknown = Reflect.get(input, 'text');
    if (
      Object.keys(input).some((key) => key !== 'text') ||
      typeof text !== 'string' ||
      !text.trim() ||
      text.length > 2000
    )
      throw new Error(
        'The message must contain only text, between 1 and 2000 characters.',
      );
    return { message: { text: text.trim() }, recipients: [{ webhook: true }] };
  }

  async prepare({
    message,
  }: ChannelPreparationInput<
    TeamMessage,
    TeamRecipient
  >): Promise<TeamMessage> {
    return message;
  }

  async send({
    message,
    deliveryId,
    signal,
  }: ChannelSendInput<TeamMessage>): Promise<ChannelSendResult> {
    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        redirect: 'error',
        signal,
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.config.apiKey}`,
          'x-notification-channel': encodeURIComponent(
            this.context.channelName,
          ),
          'x-notification-delivery-id': deliveryId,
        },
        body: JSON.stringify(message),
      });
      await response.body?.cancel();
      if (response.ok) return { status: 'accepted' };
      if (response.status >= 400 && response.status < 500)
        return {
          status: 'failed',
          disposition: response.status === 429 ? 'same_provider' : 'never',
          error: {
            category: response.status === 429 ? 'rate_limit' : 'provider',
            message: 'Team webhook rejected the message.',
          },
        };
      return {
        status: 'submission_unknown',
        error: {
          category: 'provider',
          message: 'Team webhook acceptance was not confirmed.',
        },
      };
    } catch {
      return {
        status: 'submission_unknown',
        error: {
          category: 'network',
          message: 'Team webhook acceptance was not confirmed.',
        },
      };
    }
  }
}

export class TeamNotificationsProvider extends ServiceProvider<AppPluginApplication> {
  readonly name = 'app/team-notifications';
  override async boot(): Promise<void> {
    this.app.container
      .resolve(notificationExtensionRegistryToken)
      .registerChannelType(TeamWebhookChannel);
  }
}

declare module '@nocobase/app-plugin-notification' {
  interface NotificationChannelSchemas {
    'team-webhook': {
      readonly message: TeamMessage;
      readonly recipient: TeamRecipient;
    };
  }
}
```

Register `TeamNotificationsProvider` after the notification core in the application's provider list, or contribute it through an extension plugin's `serviceProviders`. Then configure a named channel:

```yaml
notification:
  channels:
    team-alerts:
      type: team-webhook
      endpoint: https://hooks.example.com/notify
      apiKey: replace-with-the-api-key
```

Map the key to `channels.team-alerts.apiKey` using the host configuration's environment mappings. Configuration stays on the server. Consumers keep the existing send input:

```ts
const notification = app.container.resolve(notificationServiceToken);
await notification.send({
  idempotencyKey: 'approval-123:team-alerts',
  messages: { 'team-alerts': { text: 'Approval 123 is complete.' } },
});
```

`NotificationChannelSchemas` maps concrete type identifiers to message/recipient schemas. `ConfiguredNotificationChannels<typeof channels>` infers message types from either `type` or the legacy `provider` discriminator; when a configuration uses both, `type` drives inference and runtime validation requires equality. Keep literal discriminator types with `as const` in typed custom hosts.

## Compatibility

`provider`-only config continues to work; both keys are accepted when equal and rejected when different. The host mailer uses the same rule. Old `registerChannel` and `registerProvider` APIs and built-in factory exports remain available, and legacy factories receive normalized `provider` config even when the user supplied `type`. New extensions should use classes.

Built-in class registration preserves historical `channelType` (`email` for SMTP/Resend, `im` for the two webhooks) and `providerType`, so pending deliveries, retries, status results and test descriptors retain their identities. These storage and response fields are compatibility details, not additional registration concepts. Custom legacy extensions can keep their existing factories to retain their historical message-family identity; migrating a custom type with a different historical message family requires an explicit history migration or draining that work first.

`send()` and `sendTransient()` inputs, outputs, message maps, recipient rules, queue behavior and retry classification are unchanged. There is no new `submit()` API. SMTP and Resend still share email helpers; Feishu and DingTalk share IM helpers. No new SMS transport is bundled.

## Result classification

Return `accepted` only when the external service confirms it accepted the submission. Include a Provider message id when available.

Return `failed` when the service definitively rejected or did not submit the message. Classify the error and choose retry disposition:

- `never` for invalid recipient/content/configuration and other permanent failures.
- `same_provider` for bounded transient failures such as a retryable rate limit or temporary network failure.
- Set `retryAfterMs` only from a validated Provider hint. The notification runtime uses the configured fixed retry interval when this field is absent.

Return `submission_unknown` when the request may have reached the Provider but confirmation was lost. This prevents automatic duplicates.

Declare Provider-side duplicate protection with `capabilities.idempotency`. This describes the external Provider contract only; it does not make an `unknown` Delivery directly retryable. Omitted capabilities are treated as `{ idempotency: { supported: false } }`. Set `{ supported: true }` only when repeated submissions with the same core-supplied `deliveryId` are idempotent; include `retentionMs` when the guarantee expires. The built-in database Provider is durable for the Delivery lifetime, Resend is bounded to its declared retention, and SMTP plus the built-in Webhook Providers omit capabilities because they do not claim idempotency.

Use the core error categories: `authentication`, `channel`, `configuration`, `content`, `network`, `provider`, `rate_limit`, `recipient`, `storage`, `timeout`, or `unknown`. Error messages must be actionable and sanitized.

## Security

- Validate outbound hostnames, schemes, redirects, ports, and payload sizes for Webhook-like Providers.
- Keep credentials in Provider configuration supplied by the host secret source.
- Redact credentials, authorization headers, Webhook query tokens, message bodies, and personal recipient data from errors/logs.
- Bound Provider execution with the supplied `deadline` and `AbortSignal`.
- Avoid unbounded response bodies and parse only the fields needed to classify a result.

## Extension tests

Cover complete message validation, native recipient expansion, atomic rejection before enqueue, final recipient validation where applicable, Provider result classification, timeout/abort, same-Provider retries, lease recovery, resource cleanup, and redacted errors. Verify globally unique Provider registration and that persisted deliveries cannot move to a replacement Channel or Provider. Run package checks and consuming application checks after changing public contracts.
