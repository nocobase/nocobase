/**
 * The variables of one scope (an agent, a working directory, or a scope the application registers), or of several
 * scopes in one table with a Scope column (a project and its working directories, say), where adding a variable
 * chooses its scope. Values are write-only: the list shows names and who changed them; setting a value replaces it
 * without showing the old one. Whoever may change them may also reveal the values and read the access log (a
 * variable's own from its row's menu, every listed scope's from the footer), where revealing is recorded; runners
 * inject them into the agent's tool processes and mask them in transcripts.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import {
  EyeIcon,
  HistoryIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { useState, type ReactElement } from 'react';

import type { Variable, VariableScope } from '../../../shared/variables.js';
import { agentsKeys } from '../../api/keys.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { useNotify } from '../../hooks/use-notify.js';
import { useFormatters } from '../../lib/format.js';
import { AgSection } from '../ag-section.js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog.js';
import { Badge } from '../ui/badge.js';
import { Button } from '../ui/button.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table.js';
import { VariableAccessLog, type AccessLogTarget } from './access-log.js';
import {
  RevealedDialog,
  VariableDialog,
  type RevealedValue,
} from './variable-dialogs.js';

/** One scope of the table, with the name its Scope column shows. */
export interface VariableScopeOption {
  readonly scope: VariableScope;
  readonly scopeId: string;
  readonly label: string;
}

export interface VariablesPanelProps {
  /** The one scope listed; `scopes` lists several instead. */
  readonly scope?: VariableScope;
  readonly scopeId?: string;
  /** Several scopes in one table, the first the broadest; with more than one, the table has a Scope column. */
  readonly scopes?: readonly VariableScopeOption[];
  /** May add, replace and delete, reveal values and read the access log. */
  readonly canEdit: boolean;
  readonly title: string;
  readonly description: string;
  /** Said under the table, such as which scope wins when two set the same name. */
  readonly note?: string;
  readonly className?: string;
}

interface Row extends Variable {
  /** Its scope's position in `scopes`. */
  readonly at: number;
}

export function VariablesPanel({
  scope,
  scopeId,
  scopes: given,
  canEdit,
  title,
  description,
  note,
  className,
}: VariablesPanelProps): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const format = useFormatters();
  const scopes: readonly VariableScopeOption[] =
    given ??
    (scope !== undefined && scopeId !== undefined
      ? [{ scope, scopeId, label: '' }]
      : []);
  const several = scopes.length > 1;
  const [editing, setEditing] = useState<{
    readonly name: string | null;
    readonly at: number | null;
  } | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [confirmReveal, setConfirmReveal] = useState(false);
  const [revealed, setRevealed] = useState<readonly RevealedValue[] | null>(
    null,
  );
  const [accessLog, setAccessLog] = useState<AccessLogTarget | null>(null);

  const lists = useQueries({
    queries: scopes.map((item) => ({
      queryKey: agentsKeys.variables(item.scope, item.scopeId),
      queryFn: () => api.variables(item.scope, item.scopeId),
    })),
  });
  const loaded = lists.every((list) => list.data !== undefined);
  const failed = lists.some((list) => list.isError);
  const rows: Row[] = lists.flatMap((list, at) =>
    (list.data ?? []).map((item) => ({ ...item, at })),
  );
  const refresh = (at?: number): void => {
    for (const item of at === undefined ? scopes : [scopes[at]]) {
      void queryClient.invalidateQueries({
        queryKey: agentsKeys.variables(item.scope, item.scopeId),
      });
      void queryClient.invalidateQueries({
        queryKey: agentsKeys.variableAudits(item.scope, item.scopeId),
      });
    }
  };

  const remove = useMutation({
    mutationFn: (row: Row) =>
      api.deleteVariable(
        scopes[row.at].scope,
        scopes[row.at].scopeId,
        row.name,
      ),
    onSuccess: (_, row) =>
      notify.success(t('envVars.deleted', { name: row.name })),
    onError: (error) => notify.error(error),
    onSettled: (_, __, row) => refresh(row.at),
  });
  const reveal = useMutation({
    mutationFn: async () => {
      const values: RevealedValue[] = [];
      for (const [at, item] of scopes.entries()) {
        if (!lists[at]?.data?.length) continue;
        for (const value of await api.revealVariables(item.scope, item.scopeId))
          values.push({ ...value, scope: several ? item.label : null });
      }
      return values;
    },
    onSuccess: (values) => setRevealed(values),
    onError: (error) => notify.error(error),
    onSettled: () => refresh(),
  });
  const id = `ag-vars-${scopes.map((item) => `${item.scope}-${item.scopeId}`).join('-')}`;
  const editingAt = editing?.at ?? 0;

  return (
    <AgSection
      id={id}
      title={title}
      description={description}
      className={className}
      actions={
        <>
          {canEdit ? (
            <Button
              variant='outline'
              size='sm'
              disabled={reveal.isPending || rows.length === 0}
              onClick={() => setConfirmReveal(true)}
            >
              <EyeIcon data-icon='inline-start' />
              {t('envVars.reveal')}
            </Button>
          ) : null}
          {canEdit ? (
            <Button
              variant='outline'
              size='sm'
              disabled={scopes.length === 0}
              onClick={() => setEditing({ name: null, at: null })}
            >
              <PlusIcon data-icon='inline-start' />
              {t('envVars.add')}
            </Button>
          ) : null}
        </>
      }
    >
      {!loaded ? (
        <p className='text-sm text-muted-foreground'>
          {failed ? t('common.requestFailed') : t('status.loading')}
        </p>
      ) : rows.length === 0 ? (
        <p className='text-sm text-muted-foreground'>{t('envVars.empty')}</p>
      ) : (
        <div className='overflow-hidden rounded-lg border'>
          <Table aria-label={title} data-variables-table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('envVars.name')}</TableHead>
                {several ? <TableHead>{t('envVars.scope')}</TableHead> : null}
                <TableHead className='hidden sm:table-cell'>
                  {t('envVars.updated')}
                </TableHead>
                {canEdit ? (
                  <TableHead className='w-0'>
                    <span className='sr-only'>{t('envVars.actionsHead')}</span>
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item) => (
                <TableRow
                  key={`${item.at}:${item.name}`}
                  data-variable={item.name}
                  data-variable-scope={scopes[item.at]?.scopeId}
                >
                  <TableCell className='font-mono text-xs'>
                    {item.name}
                  </TableCell>
                  {several ? (
                    <TableCell>
                      <Badge variant={item.at === 0 ? 'secondary' : 'outline'}>
                        {scopes[item.at]?.label}
                      </Badge>
                    </TableCell>
                  ) : null}
                  <TableCell className='hidden text-xs text-muted-foreground sm:table-cell'>
                    {item.updatedByName
                      ? t('envVars.updatedBy', {
                          name: item.updatedByName,
                          time: format.relative(item.updatedAt),
                        })
                      : format.relative(item.updatedAt)}
                  </TableCell>
                  {canEdit ? (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant='ghost'
                              size='icon-sm'
                              aria-label={t('envVars.actions', {
                                name: item.name,
                              })}
                            />
                          }
                        >
                          <MoreHorizontalIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align='end'
                          className='w-auto min-w-40'
                        >
                          <DropdownMenuItem
                            onClick={() =>
                              setEditing({ name: item.name, at: item.at })
                            }
                          >
                            <PencilIcon />
                            {t('envVars.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setAccessLog({
                                kind: 'one',
                                name: item.name,
                                at: item.at,
                              })
                            }
                          >
                            <HistoryIcon />
                            {t('envVars.accessLog')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant='destructive'
                            disabled={remove.isPending}
                            onClick={() => setDeleting(item)}
                          >
                            <Trash2Icon />
                            {t('envVars.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {note ? <p className='text-sm text-muted-foreground'>{note}</p> : null}
      {canEdit ? (
        <Button
          variant='link'
          size='sm'
          className='h-auto px-0 text-muted-foreground'
          onClick={() => setAccessLog({ kind: 'all' })}
        >
          {t('envVars.accessLogAll')}
        </Button>
      ) : null}

      <VariableAccessLog
        scopes={scopes}
        target={accessLog}
        onClose={() => setAccessLog(null)}
      />

      <VariableDialog
        scopes={scopes}
        target={
          editing
            ? {
                name: editing.name,
                at: editing.at ?? 0,
                fixed: editing.at !== null,
              }
            : null
        }
        existingNames={(at) => (lists[at]?.data ?? []).map((item) => item.name)}
        onClose={() => setEditing(null)}
        onSaved={(at) => refresh(at ?? editingAt)}
      />
      <RevealedDialog values={revealed} onClose={() => setRevealed(null)} />
      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('envVars.deleteTitle', { name: deleting?.name ?? '' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('envVars.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={() => {
                const row = deleting;
                setDeleting(null);
                if (row) remove.mutate(row);
              }}
            >
              {t('envVars.deleteConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={confirmReveal} onOpenChange={setConfirmReveal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('envVars.revealTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('envVars.revealAudit')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmReveal(false);
                reveal.mutate();
              }}
            >
              {t('envVars.reveal')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AgSection>
  );
}
