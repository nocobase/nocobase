import type {
  MailAuthorizedAccount,
  MailProviderAuthorization,
} from '../../contracts/provider.js';
import type {
  MailProviderError,
  MailProviderResult,
} from '../../../shared/mail.js';

import type {
  GmailCredential,
  GmailMailProviderConfig,
  GmailProfile,
  GmailSendAsList,
  GmailTokenResponse,
} from './types.js';
import { DEFAULT_SCOPES } from './constants.js';
import {
  gmailRequest,
  fetchWithTimeout,
  parseRetryAfter,
  readJson,
} from './http.js';
import { failure, unknownError } from './errors.js';
import { htmlToText } from './mime.js';
import { waitForGmailQuota } from './quota.js';

export function createAuthorization(): MailProviderAuthorization<GmailMailProviderConfig> {
  return {
    async start(_context, config, input) {
      const allowedScopes: readonly string[] = config.scopes ?? DEFAULT_SCOPES;
      const scopes = input.scopes?.length ? input.scopes : allowedScopes;
      if (scopes.some((scope) => !allowedScopes.includes(scope))) {
        return failure(
          'GMAIL_SCOPE_NOT_ALLOWED',
          'Requested Gmail OAuth scopes are not allowed by Provider configuration.',
          'configuration',
          false,
        );
      }
      const url = new URL(
        config.authorizationEndpoint ??
          'https://accounts.google.com/o/oauth2/v2/auth',
      );
      url.search = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: input.redirectUri,
        response_type: 'code',
        scope: scopes.join(' '),
        access_type: 'offline',
        include_granted_scopes: 'true',
        prompt: 'consent',
        state: input.state,
        code_challenge: input.codeChallenge,
        code_challenge_method: 'S256',
      }).toString();
      return {
        ok: true,
        value: { authorizationUrl: url.toString(), state: input.state },
      };
    },
    async complete(context, config, input) {
      const token = await exchangeToken(
        config,
        {
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code: input.code,
          code_verifier: input.codeVerifier,
          redirect_uri: input.redirectUri,
          grant_type: 'authorization_code',
        },
        input.signal,
      );
      if (!token.ok) return token;
      if (!token.value.refresh_token) {
        return failure(
          'GMAIL_REFRESH_TOKEN_MISSING',
          'Google did not return an offline refresh token.',
          'authentication',
          false,
        );
      }
      const expiresAt = expiry(token.value.expires_in);
      const scopes = splitScopes(
        token.value.scope,
        config.scopes ?? DEFAULT_SCOPES,
      );
      const credentialReference = await context.credentials.put({
        provider: 'gmail',
        accessToken: required(token.value.access_token, 'Gmail access token'),
        refreshToken: token.value.refresh_token,
        expiresAt,
        scopes,
        tokenType: token.value.token_type ?? 'Bearer',
      } satisfies GmailCredential);
      try {
        await waitForGmailQuota(
          config,
          '__authorization_profile__',
          1,
          input.signal,
        );
        const profile = await gmailRequest<GmailProfile>(
          config,
          required(token.value.access_token, 'Gmail access token'),
          '/users/me/profile',
          { signal: input.signal },
        );
        if (!profile.ok) {
          await context.credentials.delete(credentialReference);
          return profile;
        }
        if (!profile.value.emailAddress) {
          await context.credentials.delete(credentialReference);
          return failure(
            'GMAIL_PROFILE_INVALID',
            'Gmail profile did not include an email address.',
            'provider',
            false,
          );
        }
        await waitForGmailQuota(
          config,
          profile.value.emailAddress,
          1,
          input.signal,
        );
        const aliases = await gmailRequest<GmailSendAsList>(
          config,
          required(token.value.access_token, 'Gmail access token'),
          '/users/me/settings/sendAs',
          { signal: input.signal },
        );
        const identities = aliases.ok
          ? (aliases.value.sendAs ?? []).flatMap((alias) =>
              alias.sendAsEmail &&
              (alias.isPrimary || alias.verificationStatus === 'accepted')
                ? [
                    {
                      address: alias.sendAsEmail,
                      displayName: alias.displayName,
                      signatureText: htmlToText(alias.signature),
                      signatureHtml: alias.signature,
                      isPrimary:
                        alias.isPrimary ||
                        alias.sendAsEmail === profile.value.emailAddress,
                      canSend: true,
                    },
                  ]
                : [],
            )
          : [];
        return {
          ok: true,
          value: {
            address: profile.value.emailAddress,
            credentialReference,
            scopes,
            identities:
              identities.length > 0
                ? identities
                : [
                    {
                      address: profile.value.emailAddress,
                      isPrimary: true,
                      canSend: true,
                    },
                  ],
          } satisfies MailAuthorizedAccount,
        };
      } catch (error) {
        await context.credentials.delete(credentialReference);
        throw error;
      }
    },
  };
}

export async function exchangeToken(
  config: GmailMailProviderConfig,
  body: Record<string, string>,
  signal?: AbortSignal,
): Promise<MailProviderResult<GmailTokenResponse>> {
  try {
    const response = await fetchWithTimeout(
      config.tokenEndpoint ?? 'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(body),
        signal,
      },
    );
    if (response.ok)
      return { ok: true, value: await readJson<GmailTokenResponse>(response) };
    let value: GmailTokenResponse = {};
    try {
      value = await readJson<GmailTokenResponse>(response);
    } catch {
      // A gateway or throttling response is not always JSON; its status still classifies it.
    }
    return {
      ok: false,
      error: tokenEndpointError(
        'GMAIL',
        response,
        value,
        'Gmail OAuth token exchange failed.',
      ),
    };
  } catch (error) {
    return {
      ok: false,
      error: unknownError(error, 'GMAIL_OAUTH_REQUEST_FAILED'),
    };
  }
}

export function splitScopes(
  value: string | undefined,
  fallback: readonly string[],
): readonly string[] {
  return value?.split(/\s+/).filter(Boolean) ?? fallback;
}

export function expiry(seconds: number | undefined): string {
  return new Date(Date.now() + (seconds ?? 3600) * 1000).toISOString();
}

export function required(value: string | undefined, label: string): string {
  if (!value) throw new Error(`${label} is missing.`);
  return value;
}

/**
 * Classify a failed OAuth token request. A refused grant, such as `invalid_grant` for a refresh token that was revoked
 * or has expired, means the account has to be reauthorized; a throttled request or a failure on the authorization
 * server's side does not, and is retried like any other Provider request.
 */
function tokenEndpointError(
  prefix: string,
  response: Response,
  value: { readonly error?: string; readonly error_description?: string },
  fallbackMessage: string,
): MailProviderError {
  const code = `${prefix}_OAUTH_${value.error ?? response.status}`;
  const message = value.error_description ?? fallbackMessage;
  const retryAfterMs = parseRetryAfter(response.headers.get('retry-after'));
  if (response.status === 429 || value.error === 'slow_down')
    return {
      code,
      message,
      category: 'rate_limit',
      retryable: true,
      ...(retryAfterMs === undefined ? {} : { retryAfterMs }),
    };
  if (response.status >= 500 || value.error === 'temporarily_unavailable')
    return {
      code,
      message,
      category: 'provider',
      retryable: true,
      ...(retryAfterMs === undefined ? {} : { retryAfterMs }),
    };
  return { code, message, category: 'authentication', retryable: false };
}
