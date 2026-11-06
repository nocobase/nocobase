import { parameterSections } from './parameter-sections.js';
import { Alert, AlertTitle, AlertDescription } from '#components/ui/alert';
import { Empty, EmptyDescription } from '#components/ui/empty';
import { Spinner } from '#components/ui/spinner';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import type { JsonObject } from '@nocobase/lifecycle';
import { Button } from '#components/ui/button';
import { useRouteOverlay } from '#components/use-route-overlay';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#components/ui/alert-dialog';
import { useRef, useState } from 'react';
import { createUuid, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useBeforeUnload, useLocation, useParams } from 'react-router';
import {
  ParameterEditor,
  parameterApi,
  type ParameterGroupView,
  type ParameterApi,
} from '@nocobase/app-plugin-lifecycle-example/client';
import type { OfficeWorkflowParameters } from '@nocobase/app-plugin-office-flows-example/client';
import { type RouteDialogProps, RouteDialog } from '#components/route-dialog';
import { useWorkflowData, useWorkflowLabels } from './hooks.js';
import { DataState } from './shared.js';
import { OfficeParameterEditor } from './office-parameters.js';

type Parameters =
  | {
      kind: 'lifecycle';
      revision: number;
      values: JsonObject;
      groups: ParameterGroupView[];
    }
  | ({ kind: 'office' } & OfficeWorkflowParameters);
function SaveParameters({
  busy,
  save,
}: {
  busy: boolean;
  save: () => Promise<boolean>;
}) {
  const { close } = useRouteOverlay();
  const { t } = useTranslation();
  return (
    <Button
      disabled={busy}
      onClick={() => {
        void save().then((saved) => {
          if (saved) return close();
        });
      }}
    >
      {t('workflows.saveParameters')}
    </Button>
  );
}
function InlineSaveParameters({
  busy,
  save,
}: {
  busy: boolean;
  save: () => Promise<boolean>;
}) {
  const { t } = useTranslation();
  return (
    <Button disabled={busy} aria-busy={busy} onClick={() => void save()}>
      {busy && <Spinner />}
      {t('workflows.saveParameters')}
    </Button>
  );
}

function InlineParameters({ children, footer }: RouteDialogProps) {
  return (
    <div className='space-y-4'>
      {children}
      <div className='flex justify-end'>{footer}</div>
    </div>
  );
}

export default function WorkflowParametersPage() {
  return <WorkflowParametersForm />;
}

export function WorkflowParametersForm({
  inline = false,
}: {
  inline?: boolean;
}) {
  const { workflowId = '' } = useParams();
  const update = useCan({
    resource: { type: 'settings', id: 'workflow-management' },
    action: 'update',
  });
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  const bindingKind = search.get('parameterKind');
  const bindingName = search.get('parameterName');
  const scoped =
    !inline && (search.has('parameterKind') || search.has('parameterName'));
  search.delete('parameterKind');
  search.delete('parameterName');
  const client = useApiClient();
  const { t } = useTranslation();
  const labels = useWorkflowLabels();
  const path = `workflows/definitions/${encodeURIComponent(workflowId)}/parameters`;
  const request = useWorkflowData<{ data: Parameters }>(path);
  const [savedParameters, setSavedParameters] = useState<Parameters>();
  const configuration = savedParameters ?? request.data?.data;
  const sourceGroups =
    configuration?.kind === 'lifecycle'
      ? configuration.groups
          .map((group) => ({
            ...group,
            fields: scoped
              ? Object.fromEntries(
                  Object.entries(group.fields).filter(
                    ([, field]) =>
                      (bindingKind === 'state' ||
                        bindingKind === 'transition') &&
                      !!bindingName &&
                      field.bindings?.some(
                        (binding) => binding[bindingKind] === bindingName,
                      ),
                  ),
                )
              : group.fields,
          }))
          .filter((group) => Object.keys(group.fields).length > 0)
      : [];
  const groups = parameterSections(sourceGroups, (key) => {
    if (key === 'workflow') return t('workflows.workflowParameters');
    const [kind, name] = key.split(':');
    return kind === 'state'
      ? labels.state('lifecycle', name)
      : labels.transition('lifecycle', name);
  });
  const editorsRef = useRef<
    Record<
      string,
      {
        save: () => Promise<boolean>;
        values?: () => JsonObject | undefined;
      } | null
    >
  >({});
  const [success, setSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [revisionOverride, setRevisionOverride] = useState<number>();
  const revision = revisionOverride ?? configuration?.revision ?? 0;
  const savingRef = useRef(false);
  const savedRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [pendingGroups, setPendingGroups] = useState<Record<string, boolean>>(
    {},
  );
  const busy = saving || Object.values(pendingGroups).some(Boolean);
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const decisionRef = useRef<((value: boolean) => void) | null>(null);
  const isDirty = Object.values(dirty).some(Boolean);
  useBeforeUnload((event) => {
    if (busy || isDirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
  const decide = (value: boolean) => {
    decisionRef.current?.(value);
    decisionRef.current = null;
    setConfirmOpen(false);
  };
  const workflow = workflowId.slice(workflowId.indexOf('.') + 1);
  const api: ParameterApi = {
    ...parameterApi(client, 'zhao', workflow),
    read: async (key) => {
      const result = await client.request<{ data: Parameters }>({ path });
      if (result.data.kind !== 'lifecycle')
        throw new Error('Unexpected workflow parameters.');
      return result.data.groups.find((group) => group.key === key)!;
    },
    save: async () => {
      throw new Error('Use the workflow save action.');
    },
  };
  const SaveAction = inline ? InlineSaveParameters : SaveParameters;
  const Container = inline ? InlineParameters : RouteDialog;
  return (
    <Container
      title={t('workflows.parametersTitle', {
        name: [
          labels.title({ name: workflow }),
          bindingName &&
          (bindingKind === 'state' || bindingKind === 'transition')
            ? labels[bindingKind]('lifecycle', bindingName)
            : undefined,
        ]
          .filter(Boolean)
          .join(' · '),
      })}
      description={t(
        scoped
          ? 'workflows.nodeParametersDescription'
          : 'workflows.parametersDescription',
      )}
      closeTo={{
        pathname: `/workflows/definitions/${encodeURIComponent(workflowId)}`,
        search: search.toString(),
      }}
      beforeClose={() => {
        if (savedRef.current) return true;
        if (savingRef.current || busy) return false;
        if (!isDirty) return true;
        setConfirmOpen(true);
        return new Promise<boolean>((resolve) => {
          decisionRef.current = resolve;
        });
      }}
      footer={
        update.can &&
        (groups.some((group) => group.canUpdate) ||
          (configuration?.kind === 'office' && !scoped)) ? (
          <SaveAction
            busy={busy || request.loading}
            save={async () => {
              if (savingRef.current) return false;
              savingRef.current = true;
              setSaving(true);
              try {
                setSaveError('');
                setSuccess(false);
                if (configuration?.kind === 'lifecycle') {
                  const values: JsonObject = {};
                  for (const group of groups) {
                    if (!group.canUpdate) continue;
                    const draft = editorsRef.current[group.key]?.values?.();
                    if (!draft) return false;
                    if (dirty[group.key])
                      for (const field of Object.keys(group.fields))
                        values[field] = draft[field];
                  }
                  if (Object.keys(values).length) {
                    const result = await client.request<{ data: Parameters }>({
                      path,
                      method: 'PUT',
                      json: {
                        kind: 'lifecycle',
                        values,
                        expectedRevision: revision,
                        requestId: createUuid(),
                      },
                    });
                    if (inline) {
                      setSavedParameters(result.data);
                      setRevisionOverride(undefined);
                      setDirty({});
                    }
                  }
                } else {
                  if (!(await editorsRef.current.office?.save())) return false;
                }
                setSuccess(true);
                savedRef.current = !inline;
                return true;
              } catch (error) {
                setSaveError(
                  error instanceof Error
                    ? error.message
                    : t('workflows.parametersFailed'),
                );
                setConflict(
                  Boolean(
                    error &&
                    typeof error === 'object' &&
                    'reason' in error &&
                    error.reason === 'CONFIGURATION_CONFLICT',
                  ),
                );
                return false;
              } finally {
                savingRef.current = false;
                setSaving(false);
              }
            }}
          />
        ) : undefined
      }
      className='sm:max-w-2xl'
    >
      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open) decide(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('workflows.discardParameters')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('workflows.unsavedParameters')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => decide(false)}>
              {t('workflows.keepParameterEditing')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={() => decide(true)}
            >
              {t('workflows.discardParameterChanges')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {inline && configuration?.kind === 'lifecycle' && success && !isDirty && (
        <p role='status'>{t('workflows.parametersSaved')}</p>
      )}
      <fieldset disabled={saving || !update.can} className='min-w-0'>
        <DataState {...request} retry={request.reload} />
        {request.data && (
          <p className='mb-3 text-sm text-muted-foreground'>
            {t('workflows.parameterRevision', { revision })}
          </p>
        )}
        {saveError && (
          <Alert variant='destructive'>
            <AlertTitle>{t('workflows.parametersFailed')}</AlertTitle>
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}
        {conflict && (
          <Button
            variant='outline'
            onClick={() => {
              void client
                .request<{ data: Parameters }>({ path })
                .then(({ data }) => {
                  setSavedParameters(data);
                  setRevisionOverride(data.revision);
                  setDirty({});
                  setConflict(false);
                  setSaveError('');
                })
                .catch((error: unknown) =>
                  setSaveError(
                    error instanceof Error
                      ? error.message
                      : t('workflows.parametersFailed'),
                  ),
                );
            }}
          >
            {t('workflows.reloadParameterRevision')}
          </Button>
        )}

        {configuration?.kind === 'lifecycle' && (
          <div className='divide-y'>
            {groups.map((group) => (
              <div
                key={group.key}
                id={inline ? `workflow-parameters-${group.key}` : undefined}
                tabIndex={-1}
              >
                <ParameterEditor
                  key={`${workflowId}:${group.key}:${configuration?.revision}`}
                  embedded
                  hideRevision
                  saveRef={(editor) => {
                    editorsRef.current[group.key] = group.canUpdate
                      ? editor
                      : null;
                  }}
                  group={{ ...group, canUpdate: group.canUpdate && update.can }}
                  api={api}
                  actor='zhao'
                  onBusyChange={(pending) =>
                    setPendingGroups((previous) => ({
                      ...previous,
                      [group.key]: pending,
                    }))
                  }
                  onDirtyChange={(value) =>
                    setDirty((previous) =>
                      previous[group.key] === value
                        ? previous
                        : { ...previous, [group.key]: value },
                    )
                  }
                />
              </div>
            ))}
            {!groups.length && (
              <Empty>
                <EmptyDescription>
                  {t('workflows.noParameters')}
                </EmptyDescription>
              </Empty>
            )}
          </div>
        )}
        {configuration?.kind === 'office' && !scoped && (
          <OfficeParameterEditor
            key={workflowId}
            disabled={!update.can || saving}
            saveRef={(editor) => {
              editorsRef.current.office = editor;
            }}
            configuration={configuration}
            onSaved={(saved) =>
              setSavedParameters({ ...saved, kind: 'office' })
            }
            path={path}
            onBusyChange={(pending) =>
              setPendingGroups((previous) => ({ ...previous, office: pending }))
            }
            onDirtyChange={(value) =>
              setDirty((previous) =>
                previous.office === value ? previous : { office: value },
              )
            }
          />
        )}
      </fieldset>
    </Container>
  );
}
