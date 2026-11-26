# Verification client integration

Register the Verification server and configure the `bindPhone` and `stepUp` scenes as described in the [Verification Skill](../SKILL.md). Use the hooks in routes under the application's Authentication client and query providers. The client entry consists of named imports that can be used directly from application code.

| Hook                        | Contract                                                                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useSendVerificationCode()` | Submit a scene with `phone` or `purpose` as required, and receive `expiresAt` and `resendAt`.                                                                             |
| `useMyVerifiedPhone()`      | Read `data.phone`, which is masked or `null` after a successful read. Use `isLoading` for the initial fetch and `error` for a failed read.                                |
| `useBindPhone()`            | Submit a new phone and its code, plus the old-phone credential when changing a binding. On success, read the updated masked phone from the result or the refreshed query. |
| `useIssueStepUpToken()`     | Submit a registered purpose and the code sent to the verified phone, and receive `{ token, expiresAt }`.                                                                  |

Action hooks expose `isPending`, `isSuccess`, `error` and `reset()`. Access successful results through the promise returned by `submit(input)`. Use those handlers in response to explicit user actions. Outside React, call `sendVerificationCode(api, input)`, `getMyVerifiedPhone(api)`, `bindPhone(api, input)` or `issueStepUpToken(api, input)` with the host's `ApiClient`. The API functions use the configured base path and credentials. If you call `bindPhone` directly, refresh your caller's phone state after it succeeds.

## Bind a first phone

Collect a phone in E.164 format and submit the code in a separate interaction after it arrives. The signed-in user sees the masked number through `useMyVerifiedPhone()` after the bind.

```ts
import {
  useBindPhone,
  useMyVerifiedPhone,
  useSendVerificationCode,
} from '@nocobase/app-plugin-verification/client';

export function useFirstPhoneBinding() {
  const send = useSendVerificationCode();
  const bind = useBindPhone();
  const verifiedPhone = useMyVerifiedPhone();

  return {
    verifiedPhone,
    sendCode: (phone: string) => send.submit({ scene: 'bindPhone', phone }),
    confirm: (phone: string, code: string) => bind.submit({ phone, code }),
  };
}
```

## Change a verified phone

Send a `stepUp` code to the currently verified phone for the built-in `changePhonePurpose`. Send a `bindPhone` code to the new number. Once the user has entered both codes, exchange the old-phone code and immediately pass the returned token to the bind call. The hook sends it in `X-Verification-Token`.

```ts
import {
  changePhonePurpose,
  useBindPhone,
  useIssueStepUpToken,
  useSendVerificationCode,
} from '@nocobase/app-plugin-verification/client';

export function useChangeVerifiedPhone() {
  const send = useSendVerificationCode();
  const issue = useIssueStepUpToken();
  const bind = useBindPhone();

  return {
    sendOldPhoneCode: () =>
      send.submit({ scene: 'stepUp', purpose: changePhonePurpose }),
    sendNewPhoneCode: (phone: string) =>
      send.submit({ scene: 'bindPhone', phone }),
    async confirm(phone: string, oldCode: string, newCode: string) {
      const { token } = await issue.submit({
        purpose: changePhonePurpose,
        code: oldCode,
      });
      return bind.submit({ phone, code: newCode, token });
    },
  };
}
```

## Confirm a sensitive business operation

Register the application's purpose on the server before sending a code. Use the issued credential only for the intended request, in the verification header. This example assumes the application owns the tenant endpoint.

```ts
import { useApiClient } from '@nocobase/app-client';
import {
  useIssueStepUpToken,
  useSendVerificationCode,
} from '@nocobase/app-plugin-verification/client';

const disableTenantPurpose = 'tenants.disable';

export function useDisableTenant() {
  const api = useApiClient();
  const send = useSendVerificationCode();
  const issue = useIssueStepUpToken();

  return {
    sendCode: () =>
      send.submit({ scene: 'stepUp', purpose: disableTenantPurpose }),
    async confirm(tenantId: string, code: string) {
      const { token } = await issue.submit({
        purpose: disableTenantPurpose,
        code,
      });
      return api.request({
        method: 'POST',
        path: `tenants/${encodeURIComponent(tenantId)}/disable`,
        headers: { 'X-Verification-Token': token },
      });
    },
  };
}
```

The business server checks the authenticated person's permission to operate on the target and calls `consumeStepUp({ userId, purpose, token })` before the write. Use the authenticated user ID and the server's registered purpose. See the [server example](../SKILL.md#bind-a-phone-or-enforce-step-up). Enforce both checks on every protected request, including callers outside the React flow.

## Handle errors and resend timing

Use `resendAt` to render the normal countdown and `expiresAt` to show when the code expires. On HTTP 429, `getVerificationRateLimit(error)` gives the raw `retryAfter` header when visible to the client and the ISO `retryAt` from `error.metadata`. The server decides when another send is allowed. The original `ApiClientError` retains its status, reason, domain, request ID and payload. Network errors propagate as received.

The action hooks send each submission once. A network failure can occur after the server has already sent a message, issued a credential or changed the binding. Before asking for another bind submission, refresh the phone query to see the current binding. Wait for the applicable resend time before asking for another code.

Keep codes and credentials in the active interaction and clear app-owned inputs when the flow completes, is cancelled, or changes account. Keep both out of URLs, logs, analytics and persistent storage. Hook status is local and can be cleared with `reset()`. The hooks pass credentials back through the initiating promise and keep submitted parameters and successful responses out of the mutation cache. The phone query uses a session-specific key, discards its inactive data, and follows the host's query-cache lifecycle on sign-out.
