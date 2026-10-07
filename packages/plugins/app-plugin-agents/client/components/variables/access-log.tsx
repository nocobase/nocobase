/**
 * The access log of the panel's variables in a sheet: who viewed, set or deleted them and when, and which runs received
 * them. Opened for one variable of one scope (its row's "Access log") or for every variable of every listed scope (the
 * panel's footer link), each record then naming its scope when there are several; read only while open.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useQueries } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import type { VariableAudit } from '../../../shared/variables.js';
import { agentsKeys } from '../../api/keys.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { useFormatters } from '../../lib/format.js';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet.js';
import { Spinner } from '../ui/spinner.js';
import type { VariableScopeOption } from './variables-panel.js';

/** What the log is opened on: one variable by name in the scope at `at`, or every variable of every scope. */
export type AccessLogTarget =
  | { readonly kind: 'one'; readonly name: string; readonly at: number }
  | { readonly kind: 'all' };

export function VariableAccessLog({
  scopes,
  target,
  onClose,
}: {
  readonly scopes: readonly VariableScopeOption[];
  /** Null while closed. */
  readonly target: AccessLogTarget | null;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const read = scopes.filter(
    (_, at) => target?.kind !== 'one' || target.at === at,
  );
  const lists = useQueries({
    queries: read.map((item) => ({
      queryKey: agentsKeys.variableAudits(item.scope, item.scopeId),
      queryFn: () => api.variableAudits(item.scope, item.scopeId),
      enabled: target !== null,
    })),
  });
  const audits = {
    isPending: lists.some((list) => list.isPending),
    isError: lists.some((list) => list.isError),
  };
  const one = target?.kind === 'one' ? target.name : null;
  const records = lists
    .flatMap((list, index) =>
      (list.data ?? []).map((audit) => ({
        audit,
        scope: scopes.length > 1 ? (read[index]?.label ?? null) : null,
      })),
    )
    .filter(({ audit }) => one === null || audit.names.includes(one))
    .sort((a, b) => b.audit.at.localeCompare(a.audit.at));

  return (
    <Sheet
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className='w-full gap-0 data-[side=right]:sm:max-w-xl'>
        <SheetHeader className='border-b pr-12'>
          <SheetTitle>
            {one
              ? t('envVars.accessLogOf', { name: one })
              : t('envVars.accessLog')}
          </SheetTitle>
          <SheetDescription>
            {t('envVars.accessLogDescription')}
          </SheetDescription>
        </SheetHeader>
        <div className='min-h-0 flex-1 overflow-y-auto p-4'>
          {audits.isPending ? (
            <div className='flex justify-center py-6'>
              <Spinner />
            </div>
          ) : audits.isError ? (
            <p className='text-sm text-destructive'>
              {t('common.requestFailed')}
            </p>
          ) : records.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              {t('envVars.auditsEmpty')}
            </p>
          ) : (
            <ol className='space-y-3' data-testid='variable-access-log'>
              {records.map(({ audit, scope }) => (
                <AccessRecord
                  key={audit.id}
                  audit={audit}
                  scope={scope}
                  showNames={one === null}
                />
              ))}
            </ol>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AccessRecord({
  audit,
  scope,
  showNames,
}: {
  readonly audit: VariableAudit;
  /** The scope's name, when the log covers several. */
  readonly scope: string | null;
  readonly showNames: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const format = useFormatters();
  const who =
    audit.userName ??
    audit.userId ??
    (audit.runnerId ? t('envVars.runner', { id: audit.runnerId }) : '—');
  return (
    <li className='space-y-0.5 text-sm'>
      <p className='flex flex-wrap gap-x-1.5'>
        <span className='font-medium'>{who}</span>
        <span className='text-muted-foreground'>
          {t(`envVars.auditAction.${audit.action}`)}
        </span>
        {showNames ? (
          <span className='font-mono text-xs leading-5 break-all'>
            {audit.names.join(', ')}
          </span>
        ) : null}
      </p>
      <time dateTime={audit.at} className='block text-xs text-muted-foreground'>
        {format.dateTime(audit.at)}
        {scope ? ` · ${scope}` : ''}
      </time>
    </li>
  );
}
