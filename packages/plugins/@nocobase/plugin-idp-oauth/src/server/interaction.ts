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

async function completeConsent(
  ctx: InteractionContext,
  provider: Provider,
  service: IdpOauthService,
  details: Interaction,
  accountId: string,
) {
  const promptDetails = getPromptDetails(details);
  const clientId = String(details.params.client_id || '');
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
  if (missingOIDCScope.length) {
    grant.addOIDCScope(missingOIDCScope.join(' '));
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

  return getInteractionRedirect(
    ctx,
    provider,
    service,
    {
      consent: {
        grantId: await grant.save(),
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
  const details = await provider.interactionDetails(ctx.req, ctx.res);
  const interactionUser = user || (await service.resolveInteractionSessionUser(details.session?.accountId));

  if (details.prompt.name === 'login') {
    if (!interactionUser) {
      ctx.body = {
        prompt: 'login',
      };
      return;
    }

    ctx.body = {
      redirectTo: await completeLogin(ctx, provider, service, String(interactionUser.id)),
    };
    return;
  }

  if (details.prompt.name === 'consent') {
    const clientId = String(details.params.client_id || '');
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
  const details = await provider.interactionDetails(ctx.req, ctx.res);
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
