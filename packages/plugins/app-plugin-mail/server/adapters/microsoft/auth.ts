import type {
  MailAuthorizedAccount,
  MailProviderAuthorization,
} from '../../contracts/provider.js';
import type {
  MailProviderError,
  MailProviderResult,
} from '../../../shared/mail.js';

import type {
  GraphProfile,
  MicrosoftCredential,
  MicrosoftMailProviderConfig,
  MicrosoftTokenResponse,
} from './types.js';
import { DEFAULT_SCOPES } from './constants.js';
import {
  graphRequest,
  fetchWithTimeout,
  parseRetryAfter,
  readJson,
} from './http.js';
import { failure, unknownError } from './errors.js';
import { microsoftIdentities } from './normalize.js';

export function createAuthorization(): MailProviderAuthorization<MicrosoftMailProviderConfig> {
  return {
    async start(_context, config, input) {
      const allowedScopes: readonly string[] = config.scopes ?? DEFAULT_SCOPES;
      const scopes = input.scopes?.length ? input.scopes : allowedScopes;
      if (scopes.some((scope) => !allowedScopes.includes(scope))) {
        return failure(
          'MICROSOFT_SCOPE_NOT_ALLOWED',
          'Requested Microsoft OAuth scopes are not allowed by Provider configuration.',
          'configuration',
          false,
        );
      }
      const url = new URL(`${authority(config)}/oauth2/v2.0/authorize`);
      url.search = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: input.redirectUri,
        response_type: 'code',
        response_mode: 'query',
        scope: scopes.join(' '),
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
          scope: (input.scopes.length
            ? input.scopes
            : (config.scopes ?? DEFAULT_SCOPES)
          ).join(' '),
        },
        input.signal,
      );
      if (!token.ok) return token;
      if (!token.value.refresh_token) {
        return failure(
          'MICROSOFT_REFRESH_TOKEN_MISSING',
          'Microsoft did not return an offline refresh token.',
          'authentication',
          false,
        );
      }
      const accessToken = required(
        token.value.access_token,
        'Microsoft access token',
      );
      const profile = await graphRequest<GraphProfile>(
        config,
        accessToken,
        '/me?$select=id,displayName,mail,userPrincipalName,proxyAddresses',
        { signal: input.signal },
      );
      if (!profile.ok) return profile;
      const address = profile.value.mail ?? profile.value.userPrincipalName;
      if (!address)
        return failure(
          'MICROSOFT_PROFILE_INVALID',
          'Microsoft profile did not include a mailbox address.',
          'provider',
          false,
        );
      const authorizationSubject = profile.value.id;
      if (!authorizationSubject)
        return failure(
          'MICROSOFT_PROFILE_INVALID',
          'Microsoft profile did not include a stable account ID.',
          'provider',
          false,
        );
      const expiresAt = expiry(token.value.expires_in);
      const scopes = splitScopes(
        token.value.scope,
        config.scopes ?? DEFAULT_SCOPES,
      );
      const credentialReference = await context.credentials.put({
        provider: 'microsoft',
        accessToken,
        refreshToken: token.value.refresh_token,
        expiresAt,
        scopes,
        tokenType: token.value.token_type ?? 'Bearer',
      } satisfies MicrosoftCredential);
      return {
        ok: true,
        value: {
          address,
          displayName: profile.value.displayName,
          authorizationSubject,
          credentialReference,
          scopes,
          identities: microsoftIdentities(profile.value, address),
        } satisfies MailAuthorizedAccount,
      };
    },
  };
}

export async function exchangeToken(
  config: MicrosoftMailProviderConfig,
  body: Record<string, string>,
  signal?: AbortSignal,
): Promise<MailProviderResult<MicrosoftTokenResponse>> {
  try {
    const response = await fetchWithTimeout(
      `${authority(config)}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(body),
        signal,
      },
    );
    if (response.ok)
      return {
        ok: true,
        value: await readJson<MicrosoftTokenResponse>(response),
      };
    let value: MicrosoftTokenResponse = {};
    try {
      value = await readJson<MicrosoftTokenResponse>(response);
    } catch {
      // A gateway or throttling response is not always JSON; its status still classifies it.
    }
    return {
      ok: false,
      error: tokenEndpointError(
        'MICROSOFT',
        response,
        value,
        'Microsoft OAuth token exchange failed.',
      ),
    };
  } catch (error) {
    return {
      ok: false,
      error: unknownError(error, 'MICROSOFT_OAUTH_REQUEST_FAILED'),
    };
  }
}

export function authority(config: MicrosoftMailProviderConfig): string {
  return `${(config.authorityBaseUrl ?? 'https://login.microsoftonline.com').replace(/\/$/, '')}/${encodeURIComponent(config.tenant ?? 'common')}`;
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
