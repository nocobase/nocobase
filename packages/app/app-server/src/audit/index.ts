import type { DatabaseConnection } from '@nocobase/db';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

export type AuditActor =
  | { readonly type: 'anonymous' }
  | { readonly type: 'user'; readonly userId: string }
  | {
      readonly type: 'apiKey';
      readonly userId: string;
      readonly apiKeyId: string;
    }
  | {
      readonly type: 'agentRun';
      readonly userId: string;
      readonly runId: string;
    };

export interface AuditTarget {
  readonly collection: string;
  /** A scalar key or a map of the fields of a compound key. */
  readonly key?: unknown;
}

export interface AuditEvent {
  readonly requestId: string;
  readonly resource: string;
  readonly action: string;
  readonly source?: AuditTarget;
  readonly targets: readonly AuditTarget[];
  readonly actor: AuditActor;
  readonly roles: readonly string[];
  readonly ip?: string;
  readonly userAgent?: string;
  readonly outcome: 'success' | 'failure' | 'denied';
  readonly status: number;
  readonly durationMs: number;
  readonly occurredAt: string;
  readonly request?: unknown;
  readonly response?: unknown;
  readonly metadata?: unknown;
}

export interface AuditService {
  /** When a connection is supplied, persist on that exact transaction and propagate write failures. */
  record(
    event: AuditEvent,
    options?: { readonly connection?: DatabaseConnection },
  ): Promise<void>;
}

export const auditServiceToken: ServiceToken<AuditService> =
  createServiceToken<AuditService>('@nocobase/app-server/audit');

export {
  addAuditMetadata,
  auditEnabled,
  auditRoute,
  auditRouteContext,
  markAuditApiKeySession,
  recordAuditInTransaction,
  setAuditActor,
  setAuditRoles,
  setAuditSessionActor,
  setAuditTarget,
  type AuditRouteOptions,
} from './request.js';
