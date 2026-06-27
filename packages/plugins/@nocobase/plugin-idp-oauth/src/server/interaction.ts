/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { IdpOauthService } from './service';
import { rewriteProviderLocationHeader } from './provider-dispatch';

type Interaction = import('oidc-provider').Interaction;
type InteractionResults = import('oidc-provider').InteractionResults;
type Provider = import('oidc-provider').Provider;

type InteractionUser = {
  id: string | number;
};

type InteractionContext = {
  req: any;
  res: any;
  status?: number;
  throw: (...args: any[]) => never;
  request: {
    body?: Record<string, any>;
  };
  body?: unknown;
  withoutDataWrapping?: boolean;
};

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function getPromptDetails(details: Interaction) {
  return (details.prompt.details || {}) as Record<string, unknown>;
}

function getInteractionPromptDetails(details: Interaction) {
  const promptDetails = getPromptDetails(details);
  const missingScope = asStringArray(promptDetails.missingOIDCScope).join(' ');
  const missingClaims = asStringArray(promptDetails.missingOIDCClaims).join(', ');
  const missingResourceScopes = Object.entries((promptDetails.missingResourceScopes as Record<string, unknown>) || {})
    .map(([resource, scopes]) => `${resource}: ${asStringArray(scopes).join(' ')}`)
    .join('; ');

  return [missingScope, missingClaims, missingResourceScopes].filter(Boolean).join(' | ');
}

function shouldSkipConsent(clientId: string) {
  return clientId.startsWith('app:');
}

function getClientId(details: Interaction) {
  return String(details.params.client_id || '');
}

function isInteractionSessionNotFound(error: unknown) {
  return (
    error instanceof Error &&
    error.name === 'SessionNotFound' &&
    (error as { error?: unknown }).error === 'invalid_request'
  );
}

async function getInteractionDetails(ctx: InteractionContext, provider: Provider) {
  try {
    return await provider.interactionDetails(ctx.req, ctx.res);
  } catch (error) {
    if (!isInteractionSessionNotFound(error)) {
      throw error;
    }

    ctx.status = 400;
    ctx.body = {
      error: 'invalid_request',
      error_description: 'The authorization request has expired or is no longer available.',
    };
    return null;
  }
}

async function getInteractionRedirect(
  ctx: InteractionContext,
  provider: Provider,
  service: IdpOauthService,
  result: InteractionResults,
  mergeWithLastSubmission: boolean,
) {
  const redirectTo = await provider.interactionResult(ctx.req, ctx.res, result, {
    mergeWithLastSubmission,
  });
  return rewriteProviderLocationHeader(ctx as any, service, redirectTo);
}

async function completeLogin(ctx: InteractionContext, provider: Provider, service: IdpOauthService, accountId: string) {
  return getInteractionRedirect(
    ctx,
    provider,
    service,
    {
      login: {
        accountId,
      },
    },
    false,
  );
}

async function createConsentGrant(provider: Provider, details: Interaction, accountId: string) {
  const promptDetails = getPromptDetails(details);
  const clientId = getClientId(details);
  let grant;
  if (details.grantId) {
    grant = await provider.Grant.find(details.grantId);
  } else {
    grant = new provider.Grant({
      accountId,
      clientId,
    });
  }

  const missingOIDCScope = asStringArray(promptDetails.missingOIDCScope);
  const requestedScope =
    typeof details.params.scope === 'string' ? details.params.scope.split(/\s+/).filter(Boolean) : [];
  const oidcScope = missingOIDCScope.length ? missingOIDCScope : requestedScope;
  if (oidcScope.length) {
    grant.addOIDCScope(oidcScope.join(' '));
  }

  const missingOIDCClaims = asStringArray(promptDetails.missingOIDCClaims);
  if (missingOIDCClaims.length) {
    grant.addOIDCClaims(missingOIDCClaims);
  }
  const missingResourceScopes = (promptDetails.missingResourceScopes as Record<string, unknown>) || {};
  if (Object.keys(missingResourceScopes).length) {
    for (const [indicator, scopes] of Object.entries(missingResourceScopes)) {
      grant.addResourceScope(indicator, asStringArray(scopes).join(' '));
    }
  }

  return grant.save();
}

async function completeTrustedAppLogin(
  ctx: InteractionContext,
  provider: Provider,
  service: IdpOauthService,
  details: Interaction,
  accountId: string,
) {
  return getInteractionRedirect(
    ctx,
    provider,
    service,
    {
      login: {
        accountId,
      },
      consent: {
        grantId: await createConsentGrant(provider, details, accountId),
      },
    },
    false,
  );
}

async function completeConsent(
  ctx: InteractionContext,
  provider: Provider,
  service: IdpOauthService,
  details: Interaction,
  accountId: string,
) {
  return getInteractionRedirect(
    ctx,
    provider,
    service,
    {
      consent: {
        grantId: await createConsentGrant(provider, details, accountId),
      },
    },
    true,
  );
}

export async function handleInteractionGet(
  ctx: InteractionContext,
  provider: Provider,
  user: InteractionUser | undefined,
  service: IdpOauthService,
) {
  const details = await getInteractionDetails(ctx, provider);
  if (!details) {
    return;
  }

  const interactionUser = user || (await service.resolveInteractionSessionUser(details.session?.accountId));

  if (details.prompt.name === 'login') {
    if (!interactionUser) {
      ctx.body = {
        prompt: 'login',
      };
      return;
    }

    const clientId = getClientId(details);
    ctx.body = {
      redirectTo: shouldSkipConsent(clientId)
        ? await completeTrustedAppLogin(ctx, provider, service, details, String(interactionUser.id))
        : await completeLogin(ctx, provider, service, String(interactionUser.id)),
    };
    return;
  }

  if (details.prompt.name === 'consent') {
    const clientId = getClientId(details);
    const client = await provider.Client.find(clientId);
    if (interactionUser && shouldSkipConsent(clientId)) {
      ctx.body = {
        redirectTo: await completeConsent(ctx, provider, service, details, String(interactionUser.id)),
      };
      return;
    }

    ctx.body = {
      prompt: 'consent',
      clientName: client?.clientName || client?.clientId || clientId,
      details: getInteractionPromptDetails(details),
    };
    return;
  }

  ctx.throw(501, `Unsupported interaction prompt: ${details.prompt.name}`);
}

export async function handleInteractionPost(
  ctx: InteractionContext,
  provider: Provider,
  user: InteractionUser | undefined,
  service: IdpOauthService,
) {
  const details = await getInteractionDetails(ctx, provider);
  if (!details) {
    return;
  }

  const interactionUser = user || (await service.resolveInteractionSessionUser(details.session?.accountId));

  if (ctx.request.body?.cancel) {
    ctx.body = {
      redirectTo: await getInteractionRedirect(
        ctx,
        provider,
        service,
        {
          error: 'access_denied',
          error_description: 'End-User aborted interaction',
        },
        false,
      ),
    };
    return;
  }

  if (!interactionUser) {
    ctx.body = {
      prompt: 'login',
    };
    return;
  }

  if (details.prompt.name === 'login') {
    ctx.body = {
      redirectTo: await completeLogin(ctx, provider, service, String(interactionUser.id)),
    };
    return;
  }

  if (details.prompt.name === 'consent') {
    ctx.body = {
      redirectTo: await completeConsent(ctx, provider, service, details, String(interactionUser.id)),
    };
    return;
  }

  ctx.throw(501, `Unsupported interaction prompt: ${details.prompt.name}`);
}
