import type { DatabaseConnection } from '@nocobase/db';
import {
  auditEnabled,
  recordAuditInTransaction,
  setAuditTarget,
} from '@nocobase/app-server/audit';

type RuleWrite =
  | { readonly action: 'create'; readonly rule: { readonly key: string } }
  | {
      readonly action: 'update';
      readonly rule: { readonly key: string };
      readonly previousKey: string;
    }
  | { readonly action: 'delete'; readonly key: string };

/** Record only the rule mutation named by the active settings route. */
export async function recordRuleAudit(
  connection: DatabaseConnection,
  settings: string,
  collection: string,
  write: RuleWrite,
): Promise<void> {
  if (!auditEnabled(write.action, `settings:${settings}`)) return;
  if (write.action === 'delete') {
    setAuditTarget({ collection, key: write.key });
    await recordAuditInTransaction(connection, { status: 204 });
    return;
  }
  const { rule } = write;
  setAuditTarget(
    { collection, key: rule.key },
    write.action === 'update' && write.previousKey !== rule.key
      ? { collection, key: write.previousKey }
      : undefined,
  );
  await recordAuditInTransaction(connection, {
    status: write.action === 'create' ? 201 : 200,
    response: { data: rule },
  });
}
