/** Translation descriptor used by NocoBase labels (namespace and key). */
export interface AuditTranslation {
  readonly ns: string;
  readonly key: string;
}

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
  readonly operationName: string;
  readonly operationNameI18n?: AuditTranslation;
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

export {
  auditServiceToken,
  type AuditService,
  type AuditActorResolver,
  type AuditTransport,
  type AuditTransportDriver,
  type AuditTransportContext,
} from './service.js';
export {
  defineAuditConfig,
  type AuditConfig,
  type AuditConfigFactory,
  type AuditDestinationConfig,
} from './config.js';
export {
  describeAudit,
  auditRecordKey,
  type AuditRouteOptions,
  type AuditExecutionResult,
  type AuditTargets,
} from './request.js';
export type { AuditRedactRule } from './redact.js';
