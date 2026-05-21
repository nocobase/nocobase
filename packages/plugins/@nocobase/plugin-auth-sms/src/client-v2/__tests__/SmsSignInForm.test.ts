/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Authenticator } from '@nocobase/plugin-auth/client-v2';
import { describe, expect, it } from 'vitest';
import { pickSmsPublicOptions } from '../forms/SmsSignInForm';

function makeAuthenticator(options: Record<string, unknown>): Authenticator {
  return {
    name: 'sms',
    authType: 'SMS',
    authTypeTitle: 'SMS',
    options,
  };
}

describe('SmsSignInForm pickSmsPublicOptions', () => {
  it('reads verifier directly off authenticator.options (the flattened public shape)', () => {
    // `/authenticators:publicList` flattens server-side `options.public.*` into
    // `options.*`. Reading from `options.public.verifier` here yields undefined
    // and the form silently sends `verifier: ''` to `smsOTP:publicCreate`,
    // making the login flow fail with the wrong verifier binding. Pin the
    // source so a future refactor cannot regress to the deeper path.
    const out = pickSmsPublicOptions(makeAuthenticator({ verifier: 'v_ciq3sc898pu', autoSignup: true }));
    expect(out).toEqual({ verifier: 'v_ciq3sc898pu', autoSignup: true });
  });

  it('returns autoSignup=false when the option is missing or falsy', () => {
    expect(pickSmsPublicOptions(makeAuthenticator({ verifier: 'v_x' })).autoSignup).toBe(false);
    expect(pickSmsPublicOptions(makeAuthenticator({ verifier: 'v_x', autoSignup: 0 })).autoSignup).toBe(false);
  });

  it('returns verifier=undefined when the authenticator has no options at all', () => {
    expect(pickSmsPublicOptions(null)).toEqual({ verifier: undefined, autoSignup: false });
    expect(pickSmsPublicOptions(undefined)).toEqual({ verifier: undefined, autoSignup: false });
    expect(pickSmsPublicOptions({ name: 'sms', authType: 'SMS', authTypeTitle: 'SMS' })).toEqual({
      verifier: undefined,
      autoSignup: false,
    });
  });

  it('does NOT read from authenticator.options.public — that path is server-side storage only', () => {
    // Explicit anti-regression: even if the deeper shape is provided, we
    // ignore it. Only the flattened `options.*` from publicList is the API
    // contract for the sign-in form.
    const out = pickSmsPublicOptions(
      makeAuthenticator({ public: { verifier: 'v_should_be_ignored', autoSignup: true } }),
    );
    expect(out).toEqual({ verifier: undefined, autoSignup: false });
  });
});
