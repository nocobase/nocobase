# SMS channel

## Configure

```yaml
# server/config/notification.ts defaults, or config.yml
notification:
  channels:
    system-sms:
      type: sms
      service: aliyun # aliyun | tencent | a service you register
      signName: Example # the approved signature, without brackets
      aliyun:
        endpoint: dysmsapi.aliyuncs.com # optional; host must end in aliyuncs.com
        regionId: cn-hangzhou # optional
      templates:
        code: { templateId: SMS_123456789, params: { code: code } }
        notification:
          { templateId: SMS_987654321, params: { title: title, body: body } }
```

Tencent Cloud:

```yaml
system-sms:
  type: sms
  service: tencent
  signName: Example
  tencent:
    sdkAppId: '1400000001'
    region: ap-guangzhou # optional
  templates:
    code: { templateId: '123456', params: { code: code } }
```

- `provider` is the old alias of `type`, so the service is named `service`.
- The service's settings live under its own name (`aliyun`, `tencent`, or the registered name).
- Each `templates` entry is a purpose: `templateId` is the provider's template code, and `params` maps the provider's variable name to the message variable name (`{ <provider variable>: <message variable> }`). Without `params` the message variables pass through under their own names. Tencent Cloud fills variables by position, so list them in the template's order.
- `code` is the purpose a verification code uses. `notification` is the purpose `notify()` uses, with the variables `title` (at most 60 characters) and `body` (at most 200).
- Secrets come from the environment through `defineMailChannelsConfig`, which maps onto the channel named `system-sms`: `SMS_ALIYUN_ACCESS_KEY_ID`, `SMS_ALIYUN_ACCESS_KEY_SECRET`, `SMS_TENCENT_SECRET_ID`, `SMS_TENCENT_SECRET_KEY` (private) and `SMS_SIGN_NAME`. Name the channel `system-sms` to use them. They are never public configuration, and the settings page shows only whether each is set.
- Startup validation rejects a channel without a `service`, `signName`, a template with a `templateId`, or a built-in service's required settings. Enabled channels are checked; `enabled: false` is skipped.

## Send

```ts
const notification = app.container.resolve(notificationServiceToken);

// An ordinary SMS: logged, retried, deduplicated.
await notification.send({
  idempotencyKey: 'order-42-shipped',
  messages: {
    'system-sms': {
      to: '+8613800138000', // E.164; one or up to 100 numbers
      template: 'notification',
      params: { title: 'Shipped', body: 'Order 42 is on its way.' },
    },
  },
});

// A one-time code: in memory only, never stored, queued, retried or logged.
const [result] = await notification.sendTransient({
  channel: 'system-sms',
  message: { to: phone, template: 'code', params: { code } },
});
```

A message needs numbers in E.164 form (`+` and the country code). A `template` the channel does not configure is refused before anything is sent.

Never send a one-time code with `send()`: it would be stored in the delivery history. `sendTransient()` replaces the provider's text with a generic error and keeps only the category (`rate_limit`, `configuration`, `recipient`, `authentication`, `provider`), so a caller that needs the exact reason reads the test send or its own logs, never the code itself.

## Notification rules

A notification kind selects SMS in its `channels` (policies): `channels: { sms: 'on' }`. `notify(kind, { to: userIds })` then sends to each user's verified number, found through `userPhoneDirectoryToken` (`find(userIds)` returns `Map<userId, e164Phone>`; the verification plugin provides it). A user without a number, or an application without the directory, is skipped with `no_recipient`. The channel needs a `notification` template to reach users.

## Errors

| Code                       | Meaning and remedy                                                                 | Retried                   |
| -------------------------- | ---------------------------------------------------------------------------------- | ------------------------- |
| `SMS_SIGNATURE_INVALID`    | The signature does not exist or is not approved. Check `signName` and its review.  | No                        |
| `SMS_TEMPLATE_INVALID`     | The template does not exist, is not approved, or does not fit. Check `templateId`. | No                        |
| `SMS_PARAMS_INVALID`       | A template variable is missing or rejected. Check the template's `params`.         | No                        |
| `SMS_INVALID_PHONE`        | The number is not accepted, or is blocked.                                         | No                        |
| `SMS_AUTH_FAILED`          | The credentials are wrong or may not send SMS. Check the access key and its role.  | No                        |
| `SMS_INSUFFICIENT_BALANCE` | The account has no balance or SMS package. Top it up.                              | No                        |
| `SMS_RATE_LIMITED`         | The provider limited the frequency for this number or account.                     | Yes                       |
| `SMS_PROVIDER_UNAVAILABLE` | The provider did not answer. The message may have been sent.                       | No (`submission_unknown`) |
| `SMS_REJECTED`             | Any other refusal; the message adds the provider's text without numbers or links.  | No                        |

The message of an error ends with the provider's own code and request id, which the provider's support asks for. It never contains template variables, so it never contains a verification code.

## Register another service

```ts
class AcmeProvider extends ServiceProvider {
  override register(): void {}
  override async boot(): Promise<void> {
    this.app.container.resolve(smsProviderRegistryToken).register({
      service: 'acme',
      validate(options) {
        if (!options.apiKey) throw new Error('acme.apiKey is required.');
      },
      summarize: (options) => [
        { label: 'acme.apiKey', value: maskedSecret(options.apiKey) },
      ],
      create: (options) => ({
        async send({ phone, templateId, params, signName, signal }) {
          // Call the service. Throw SmsProviderError(code, { providerCode, requestId }) for any refusal.
          return { messageId: '…' };
        },
      }),
    });
  }
}
```

Register before the channel is first used, and select it with `service: acme` and an `acme:` settings object. A service must never log or throw `params`, and must show a secret only as set or not set in `summarize()`. Import the helpers from `@nocobase/app-plugin-notification-providers/sms`.

## Verify

Run the channel's test send, then confirm the message arrived on the administrator's phone. The test goes through the normal delivery log, so a failure shows the stable code and message there. Unit tests use a stubbed `fetch`; only a person with a provider account can confirm a real delivery.
