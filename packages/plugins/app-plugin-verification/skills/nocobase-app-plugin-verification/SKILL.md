---
name: nocobase-app-plugin-verification
description: Configure and integrate NocoBase one-time verification codes, verified phone binding, and step-up credentials using server services and React hooks.
---

# Integrate verification in a NocoBase application

Register the default export from `@nocobase/app-plugin-verification/server` after Authentication, Notification, and Notification Providers, including their setup dependencies. Install or apply database migrations before serving traffic. The plugin owns `userPhones`; account identity, sessions, and passwords belong to Authentication and Users. The plugin contributes no pages, no sign-in by SMS and no password reset routes: the application builds those flows on `verify()`. Installing it does not make a given application capable of any of them, so inspect the registered plugins and the `verification` configuration first. Verification codes must never travel through ordinary `notification.send()`, which persists messages; this plugin delivers only the code through `sendTransient()`. A step-up credential is never sent by SMS: the client exchanges the code for it and receives it in the response body of `POST /api/verification/stepUpTokens`, then presents it in the `X-Verification-Token` header of the protected request.

Import the API and hooks from `@nocobase/app-plugin-verification/client`. Use them inside the host application's Authentication and query providers. The [client integration guide](references/client.md) shows binding, changing a number, and confirming a sensitive operation. The hooks improve the user experience only: the business server must check permissions and consume its own step-up credential with `consumeStepUp`, whatever the caller. Notification channel and SMS provider settings stay in the `nocobase-app-plugin-notification-providers` Skill; ordinary notifications stay in `nocobase-app-plugin-notification`.

## Configure SMS

Set up an SMS notification channel using the Notification Providers Skill; `system-sms` is the conventional name that its environment mapping fills, not a fixed requirement. The channel each flow uses is the one named by `verification.bindPhone.channel` for phone binding and `verification.stepUp.channel` for step-up, and each registered scene names its own `channel`. Use `type: sms`, `service: aliyun` or `service: tencent`, and a template such as `code` with a variable mapped from the message's `code`. Keep provider credentials in private environment mappings. Configure a stable application secrets keyring shared by all instances. Keep the preceding key during rotation until all codes issued under it expire.

Add the verification section to the application's `defaultAppConfigs`:

```ts
import { defineVerificationConfig } from '@nocobase/app-plugin-verification/server';

const verification = defineVerificationConfig({
  defaults: {
    ttlSeconds: 300,
    resendSeconds: 60,
    hourlyLimit: 5,
    maxAttempts: 5,
  },
  ipHourlyLimit: 20,
  userHourlyLimit: 20,
  stepUpTtlSeconds: 300,
  bindPhone: { channel: 'system-sms', template: 'code' },
  stepUp: { channel: 'system-sms', template: 'code' },
});
```

Each reserved scene is enabled when its destination is configured. Code expiry and attempt limits are overridable by scene. A scene may increase the common resend interval or decrease the common hourly number limit. The number limits apply across all SMS scenes and server instances. Anonymous requests use an IP quota, while signed-in requests use a separate quota per person. All sender counters use the configured application cache. Use a shared counter backend such as Redis in multi-instance deployments. Anonymous HTTP requests use the authentication plugin's peer-anchored `auth.advanced.ipAddress` proxy rules. Configure `trustedProxies` and, if needed, `ipAddressHeaders` to recognize your ingress. Forwarded addresses from untrusted peers are ignored. Requests with no peer metadata share a fallback bucket.

## Register scenes and verify a code

Resolve `verificationServiceToken` during your server provider's boot and register scenes before use. Choose `signedIn` for a person proving control of a supplied target and `verifiedPhone` for a person receiving a code at their existing verified number. Use `public` for an intentional anonymous flow; provide an eligibility check when sends should be limited to known recipients. Public requests to ineligible targets still count toward limits and return the same response fields as submissions. Providers are contacted synchronously, so response timing may vary.

```ts
import { verificationServiceToken } from '@nocobase/app-plugin-verification/server';

const verification = container.resolve(verificationServiceToken);
verification.registerScene('confirmEnrollment', {
  method: 'sms',
  channel: 'system-sms',
  template: 'code',
  audience: 'signedIn',
});

await verification.verify({
  scene: 'confirmEnrollment',
  target: normalizedPhone,
  userId: authenticatedUser.id,
  code: submittedCode,
});
```

Clients request codes with `POST /api/verification/codes/send`, body `{ scene, phone? }`. Supply a canonical E.164 phone for SMS unless the scene targets the user's verified phone. A 429 response includes a `Retry-After` header in seconds and `error.metadata.retryAt` in ISO format. For a trusted server send, use `verification.send({ scene, target, userId, clientAddress })` with the authenticated user ID when signed in. For anonymous sends, resolve the peer through `Auth.clientAddress(request, peer)`. `verify()` belongs inside the consuming operation's authorized server path. A successful verification consumes the code, and inputs from a client must never select another user's identity. Register additional delivery methods with `registerMethod()` and keep their OTP messages in memory during delivery.

## Bind a phone or enforce step-up

Read the signed-in person's masked phone at `GET /api/verification/me/phone`. Send a `bindPhone` code to the new phone and submit `{ phone, code }` to `PUT /api/verification/me/phone`. For a change, also prove control of the currently bound phone using the built-in purpose `verification.changePhone` and include the resulting credential as `X-Verification-Token`. An incorrect new-phone code counts as a failed code attempt and leaves the old-phone credential available. A verified phone can belong to one person. There is no phone recovery or administrative unlink endpoint. Account deletion removes its phone binding and step-up records.

```ts
verification.registerStepUpPurpose('tenants.disable', { ttlSeconds: 300 });

// In an operation that has already checked the person's session and tenant permission:
await verification.consumeStepUp({
  userId: context.get('auth')!.user.id,
  purpose: 'tenants.disable',
  token: context.req.header('X-Verification-Token'),
});
await disableTenant(tenantId);
```

To obtain the credential, send `{ scene: 'stepUp', purpose: 'tenants.disable' }` to the code endpoint, then post `{ purpose, code }` to `/api/verification/stepUpTokens`. Keep the returned opaque token in memory and send it only to the intended operation. A new credential for the same user and purpose replaces the previous one. Consumption is atomic and precedes the operation. If the operation fails afterward, request a new credential. Changing the verified phone invalidates credentials issued against the previous binding. Step-up confirms the person and action purpose. The protected operation checks its own target authorization, and can register distinct purposes for operations it needs to distinguish.

The documented business actions are `verification.codes/send`, `verification.stepUpTokens/create`, `verification.phone/read`, and `verification.phone/update`. Access to public sends is limited by the scene and rate policy. All other access is limited to the signed-in person's own account by session authentication and ownership. No role grant can extend this access to a different account. Only codes go through `sendTransient()`; tokens come back in the response body. Keep codes and tokens out of request logs and analytics.

## Migrate a sub-application from SmsCodes

Move the Alibaba Cloud template settings to the shared channel's `templates.code` and keep secrets in the Notification Providers environment mappings. Preserve other uses such as activation messages as distinct templates. For a gradual rollout, register `externalSignIn` and `resetPassword` as public scenes with an eligibility check that looks up the application's member records. Use `verification.verify({ scene, target, code })` inside the corresponding server flow, then run the application's existing account activation, authentication, or password reset policy. Keep old routes until their callers switch. The verification plugin does not automatically create accounts or start sessions.

Review old profile/member data before importing phones. Use an application migration to add only independently verified E.164 values to `userPhones`, with the matching authentication `userId`, a distinct random `bindingId`, and a `verifiedAt` timestamp. Resolve duplicates and conflicting identities before import. Require reverification for numbers without trustworthy provenance, and ask users to request new codes after cutover. Pending `SmsCodes` records use a different challenge format and should expire under the old flow. Remove the old sender and code store after the application has switched its callers.
