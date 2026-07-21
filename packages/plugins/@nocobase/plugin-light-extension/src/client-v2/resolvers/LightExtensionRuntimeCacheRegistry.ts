/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type LightExtensionRuntimeCacheInvalidator = {
  invalidateRepo(repoId: string): void;
  clear(): void;
};

const runtimeCaches = new WeakMap<object, LightExtensionRuntimeCacheInvalidator>();
const cacheGenerations = new WeakMap<object, LightExtensionCacheGeneration>();
const identityRegistrations = new WeakMap<object, LightExtensionRuntimeIdentityRegistration[]>();
const fallbackIdentityRegistrations = new WeakMap<object, LightExtensionRuntimeIdentityRegistration>();

type IdentityScalar = string | number | boolean | null | undefined;

export type LightExtensionRuntimeIdentitySnapshot = {
  userId?: IdentityScalar;
  role?: IdentityScalar;
  authenticator?: IdentityScalar;
  token?: IdentityScalar;
  permissionSnapshot?: unknown;
};

type LightExtensionRuntimeIdentityProvider = () => LightExtensionRuntimeIdentitySnapshot;

type EventTargetLike = {
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
};

type LightExtensionRuntimeIdentityRegistration = {
  provider: LightExtensionRuntimeIdentityProvider;
  initialized: boolean;
  sessionEpoch: number;
  permissionGeneration: number;
  previous?: LightExtensionRuntimeIdentitySnapshot;
};

export type LightExtensionCacheGenerationSnapshot = {
  global: number;
  repo: number;
};

export class LightExtensionCacheGeneration {
  private globalGeneration = 0;
  private readonly repoGenerations = new Map<string, number>();

  get(repoId: string): LightExtensionCacheGenerationSnapshot {
    return {
      global: this.globalGeneration,
      repo: this.repoGenerations.get(repoId) || 0,
    };
  }

  isCurrent(repoId: string, snapshot: LightExtensionCacheGenerationSnapshot): boolean {
    const current = this.get(repoId);
    return current.global === snapshot.global && current.repo === snapshot.repo;
  }

  invalidateRepo(repoId: string): void {
    this.repoGenerations.set(repoId, (this.repoGenerations.get(repoId) || 0) + 1);
  }

  clear(): void {
    this.globalGeneration += 1;
    this.repoGenerations.clear();
  }
}

export function getLightExtensionCacheGeneration(api: object): LightExtensionCacheGeneration {
  const existing = cacheGenerations.get(api);
  if (existing) {
    return existing;
  }
  const generation = new LightExtensionCacheGeneration();
  cacheGenerations.set(api, generation);
  return generation;
}

export function getOrCreateLightExtensionRuntimeCache<TCache extends LightExtensionRuntimeCacheInvalidator>(
  api: object,
  create: (generation: LightExtensionCacheGeneration) => TCache,
): TCache {
  const existing = runtimeCaches.get(api);
  if (existing) {
    return existing as TCache;
  }
  const cache = create(getLightExtensionCacheGeneration(api));
  runtimeCaches.set(api, cache);
  return cache;
}

export function getLightExtensionRuntimeIdentity(api: object): string {
  const registration = identityRegistrations.get(api)?.at(-1) || getFallbackIdentityRegistration(api);
  const snapshot = registration.provider();
  const previous = registration.previous;
  if (!registration.initialized) {
    registration.initialized = true;
  } else {
    if (
      previous?.userId !== snapshot.userId ||
      previous?.role !== snapshot.role ||
      previous?.authenticator !== snapshot.authenticator ||
      previous?.token !== snapshot.token
    ) {
      registration.sessionEpoch += 1;
    }
    if (previous?.permissionSnapshot !== snapshot.permissionSnapshot) {
      registration.permissionGeneration += 1;
    }
  }
  registration.previous = { ...snapshot };
  return JSON.stringify([
    snapshot.userId ?? null,
    snapshot.role ?? null,
    snapshot.authenticator ?? null,
    registration.sessionEpoch,
    registration.permissionGeneration,
  ]);
}

export function registerLightExtensionRuntimeIdentity(
  api: object,
  provider: LightExtensionRuntimeIdentityProvider,
  eventTarget?: EventTargetLike,
): () => void {
  const registration: LightExtensionRuntimeIdentityRegistration = {
    provider,
    initialized: false,
    sessionEpoch: 0,
    permissionGeneration: 0,
  };
  const registrations = identityRegistrations.get(api) || [];
  registrations.push(registration);
  identityRegistrations.set(api, registrations);
  invalidateLightExtensionRuntimeCache(api);

  const handleTokenChange: EventListener = () => {
    if (identityRegistrations.get(api)?.at(-1) !== registration) {
      return;
    }
    registration.sessionEpoch += 1;
    registration.previous = { ...registration.provider() };
    registration.initialized = true;
    invalidateLightExtensionRuntimeCache(api);
  };
  eventTarget?.addEventListener('auth:tokenChanged', handleTokenChange);

  return () => {
    eventTarget?.removeEventListener('auth:tokenChanged', handleTokenChange);
    const currentRegistrations = identityRegistrations.get(api);
    const index = currentRegistrations?.indexOf(registration) ?? -1;
    if (!currentRegistrations || index < 0) {
      return;
    }
    const wasActive = index === currentRegistrations.length - 1;
    currentRegistrations.splice(index, 1);
    if (!currentRegistrations.length) {
      identityRegistrations.delete(api);
    }
    if (wasActive) {
      invalidateLightExtensionRuntimeCache(api);
    }
  };
}

export function registerLightExtensionRuntimeAuthSession(api: object, app?: object): () => void {
  return registerLightExtensionRuntimeIdentity(api, () => readRuntimeIdentity(api, app), getEventTarget(app));
}

export function invalidateLightExtensionRuntimeCache(api: object, repoId?: string): void {
  const cache = runtimeCaches.get(api);
  if (!cache) {
    const generation = getLightExtensionCacheGeneration(api);
    if (repoId) {
      generation.invalidateRepo(repoId);
    } else {
      generation.clear();
    }
    return;
  }
  if (repoId) {
    cache.invalidateRepo(repoId);
    return;
  }
  cache.clear();
}

function getFallbackIdentityRegistration(api: object): LightExtensionRuntimeIdentityRegistration {
  const existing = fallbackIdentityRegistrations.get(api);
  if (existing) {
    return existing;
  }
  const registration: LightExtensionRuntimeIdentityRegistration = {
    provider: () => readRuntimeIdentity(api),
    initialized: false,
    sessionEpoch: 0,
    permissionGeneration: 0,
  };
  fallbackIdentityRegistrations.set(api, registration);
  return registration;
}

function readRuntimeIdentity(api: object, app?: object): LightExtensionRuntimeIdentitySnapshot {
  const auth = toRecord(toRecord(api)?.auth);
  const context = toRecord(toRecord(app)?.context);
  const user = toRecord(context?.user);
  const acl = toRecord(context?.acl);
  return {
    userId: toIdentityScalar(user?.id),
    role: readAuthValue(auth, 'getRole', 'role'),
    authenticator: readAuthValue(auth, 'getAuthenticator', 'authenticator'),
    token: readAuthValue(auth, 'getToken', 'token'),
    permissionSnapshot: acl?.data,
  };
}

function readAuthValue(auth: Record<string, unknown> | null, getterName: string, propertyName: string): IdentityScalar {
  const getter = auth?.[getterName];
  if (typeof getter === 'function') {
    return toIdentityScalar(getter.call(auth));
  }
  return toIdentityScalar(auth?.[propertyName]);
}

function getEventTarget(app?: object): EventTargetLike | undefined {
  const eventBus = toRecord(toRecord(app)?.eventBus);
  if (typeof eventBus?.addEventListener !== 'function' || typeof eventBus.removeEventListener !== 'function') {
    return undefined;
  }
  return eventBus as EventTargetLike;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function toIdentityScalar(value: unknown): IdentityScalar {
  return ['string', 'number', 'boolean'].includes(typeof value) ? (value as string | number | boolean) : null;
}
