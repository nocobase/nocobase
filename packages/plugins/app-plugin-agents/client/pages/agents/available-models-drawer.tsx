/**
 * Every tool a runner has selected, grouped so a tool reporting hundreds of models (the discovery bug this replaced)
 * reads as one collapsed row until someone opens it: create an agent from a model that has none, or see the state of
 * one that already does. A large drawer, not a dialog, because the group list and a tool's own models can be long —
 * search, a status filter defaulting to "Available", per-tool collapse (open by default under
 * `DEFAULT_EXPAND_THRESHOLD` models), multi-select across pages and a sticky "Add" bar. The application's recommended
 * combinations never show a checkbox here: a runner reporting one signed in creates and enables it on its own.
 */
import type { AgentTool } from '@nocobase/agent-protocol';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useMemo, useState, type ReactElement } from 'react';
import { Virtuoso } from 'react-virtuoso';

import type {
  AvailableModel,
  AvailableModelGroup,
  ModelAvailabilityStatus,
} from '../../../shared/agents.js';
import { TOOL_LABELS } from '../../../shared/model-catalog.js';
import { modelSuggestion } from '../../model-suggestion.js';
import { agentsKeys } from '../../api/keys.js';
import { AgListSkeleton, AgLoadError } from '../../components/ag-states.js';
import { AgTag, type Tone } from '../../components/ag-tag.js';
import { Button } from '../../components/ui/button.js';
import { Checkbox } from '../../components/ui/checkbox.js';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../components/ui/collapsible.js';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '../../components/ui/field.js';
import { Input } from '../../components/ui/input.js';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '../../components/ui/sheet.js';
import { Textarea } from '../../components/ui/textarea.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { useNotify } from '../../hooks/use-notify.js';

/** Exactly the drawer's four filter buttons; other reasons (timeout, a mismatched program) fall under `failed`. */
const STATUS_FILTERS: readonly ModelAvailabilityStatus[] = [
  'available',
  'needsLogin',
  'notConfigured',
  'versionTooOld',
];

/** A group with this many models or fewer starts open; a larger one starts collapsed. */
const DEFAULT_EXPAND_THRESHOLD = 10;
/** Rows loaded past this count in one group switch from a plain list to a virtualized one. */
const VIRTUALIZE_THRESHOLD = 30;
const PAGE_SIZE = 50;

const STATUS_TONE: Readonly<Record<ModelAvailabilityStatus, Tone>> = {
  available: 'green',
  needsLogin: 'amber',
  notConfigured: 'amber',
  versionTooOld: 'amber',
  failed: 'red',
};

function rowKey(tool: AgentTool, model: string): string {
  return `${tool}\u0000${model}`;
}

export interface AvailableModelsDrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

export function AvailableModelsDrawer({
  open,
  onClose,
}: AvailableModelsDrawerProps): ReactElement {
  const { t, i18n } = useTranslation();
  const api = useAgentsApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ModelAvailabilityStatus>('available');
  const [toggled, setToggled] = useState<ReadonlySet<AgentTool>>(
    () => new Set(),
  );
  const [selected, setSelected] = useState<ReadonlyMap<string, AvailableModel>>(
    () => new Map(),
  );
  const [editing, setEditing] = useState<AvailableModel | null>(null);
  const q = search.trim();
  const forceExpand = q !== '';

  const reset = (): void => {
    setSearch('');
    setStatus('available');
    setToggled(new Set());
    setSelected(new Map());
    setEditing(null);
  };

  const groups = useQuery({
    queryKey: agentsKeys.availableModelGroups(q, status),
    queryFn: () => api.availableModelGroups({ q: q || undefined, status }),
    enabled: open,
  });

  const toggle = (tool: AgentTool): void =>
    setToggled((current) => {
      const next = new Set(current);
      if (next.has(tool)) next.delete(tool);
      else next.add(tool);
      return next;
    });

  const setRowSelected = (model: AvailableModel, checked: boolean): void =>
    setSelected((current) => {
      const next = new Map(current);
      const key = rowKey(model.tool, model.model);
      if (checked) next.set(key, model);
      else next.delete(key);
      return next;
    });

  const bulkCreate = useMutation({
    mutationFn: async () => {
      const entries = [...selected.values()];
      const outcomes = await Promise.allSettled(
        entries.map((model) =>
          api.createRunnerAgent({
            tool: model.tool,
            model: model.model,
            ...(model.displayModel ? { displayModel: model.displayModel } : {}),
            description:
              modelSuggestion(model, i18n.language, t) ||
              t('agents.available.genericGoodAt', {
                tool: TOOL_LABELS[model.tool],
                model: model.displayModel ?? model.model,
              }),
          }),
        ),
      );
      return outcomes;
    },
    onSuccess: (outcomes) => {
      const succeeded = outcomes.filter((o) => o.status === 'fulfilled').length;
      const failed = outcomes.length - succeeded;
      setSelected(new Map());
      void queryClient.invalidateQueries({ queryKey: agentsKeys.agents });
      void queryClient.invalidateQueries({
        queryKey: agentsKeys.availableModelsAll,
      });
      if (failed === 0)
        notify.success(t('agents.available.addedCount', { count: succeeded }));
      else
        notify.error(t('agents.available.addedPartial', { succeeded, failed }));
    },
    onError: (error) => notify.error(error),
  });

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset();
          onClose();
        }
      }}
    >
      <SheetContent
        className='flex w-full flex-col gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[780px]'
        data-testid='available-models-drawer'
      >
        {editing ? (
          <CreateForm
            model={editing}
            onBack={() => setEditing(null)}
            onDone={() => setEditing(null)}
          />
        ) : (
          <>
            <SheetHeader className='shrink-0'>
              <SheetTitle>{t('agents.available.title')}</SheetTitle>
              <SheetDescription>
                {t('agents.available.description')}
              </SheetDescription>
            </SheetHeader>
            <div className='shrink-0 space-y-3 border-b px-4 pb-3 sm:px-6'>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('agents.discovery.search')}
                aria-label={t('agents.discovery.search')}
                data-testid='available-models-search'
              />
              <div className='flex flex-wrap gap-2'>
                {STATUS_FILTERS.map((option) => (
                  <Button
                    key={option}
                    type='button'
                    size='sm'
                    variant={status === option ? 'default' : 'outline'}
                    onClick={() => setStatus(option)}
                    data-testid={`available-models-filter-${option}`}
                  >
                    {t(`agents.available.status.${option}`)}
                  </Button>
                ))}
              </div>
            </div>
            <div className='min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3 sm:px-6'>
              {groups.isError && !groups.data ? (
                <AgLoadError
                  title={t('agents.loadFailed')}
                  error={groups.error}
                  onRetry={() => void groups.refetch()}
                />
              ) : !groups.data ? (
                <AgListSkeleton />
              ) : groups.data.data.length === 0 ? (
                <p className='text-sm text-muted-foreground'>
                  {t('agents.noneInFilter')}
                </p>
              ) : (
                groups.data.data.map((group) => (
                  <ToolGroup
                    key={group.tool}
                    group={group}
                    q={q}
                    status={status}
                    expanded={
                      toggled.has(group.tool) !==
                      group.modelCount <= DEFAULT_EXPAND_THRESHOLD
                    }
                    forceExpand={forceExpand}
                    onToggle={() => toggle(group.tool)}
                    selected={selected}
                    onSelect={setRowSelected}
                    onCustomCreate={setEditing}
                  />
                ))
              )}
            </div>
            <SheetFooter className='shrink-0 flex-row items-center justify-between border-t'>
              <div className='text-sm text-muted-foreground'>
                {selected.size > 0
                  ? t('agents.available.selectedCount', {
                      count: selected.size,
                    })
                  : null}
              </div>
              <div className='flex gap-2'>
                <Button variant='outline' onClick={onClose}>
                  {t('actions.close')}
                </Button>
                <Button
                  disabled={selected.size === 0 || bulkCreate.isPending}
                  onClick={() => bulkCreate.mutate()}
                  data-testid='available-models-add-selected'
                >
                  {t('agents.available.addSelected', { count: selected.size })}
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ToolGroup({
  group,
  q,
  status,
  expanded,
  forceExpand,
  onToggle,
  selected,
  onSelect,
  onCustomCreate,
}: {
  readonly group: AvailableModelGroup;
  readonly q: string;
  readonly status: ModelAvailabilityStatus;
  readonly expanded: boolean;
  readonly forceExpand: boolean;
  readonly onToggle: () => void;
  readonly selected: ReadonlyMap<string, AvailableModel>;
  readonly onSelect: (model: AvailableModel, checked: boolean) => void;
  readonly onCustomCreate: (model: AvailableModel) => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const open = forceExpand || expanded;
  const rows = useInfiniteQuery({
    queryKey: agentsKeys.availableModelRows(group.tool, q, status),
    queryFn: ({ pageParam }) =>
      api.availableModelRows(group.tool, {
        q: q || undefined,
        status,
        page: pageParam,
        pageSize: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page * last.meta.pageSize < last.meta.total
        ? last.meta.page + 1
        : undefined,
    enabled: open,
  });
  const loaded = useMemo(
    () => rows.data?.pages.flatMap((page) => page.data) ?? [],
    [rows.data],
  );
  return (
    <Collapsible open={open} onOpenChange={onToggle}>
      <div className='rounded-lg border'>
        <CollapsibleTrigger
          className='flex w-full items-center justify-between gap-3 p-3 text-left'
          data-testid={`available-models-group-${group.tool}`}
        >
          <span className='font-medium'>
            {t('agents.available.group', {
              count: group.modelCount,
              tool: TOOL_LABELS[group.tool],
              runners: t('agents.available.runners', {
                count: group.runnerCount,
              }),
            })}
          </span>
          <AgTag tone={STATUS_TONE[group.status]} dot>
            {t(
              `agents.available.status.${group.status === 'failed' ? 'needsLogin' : group.status}`,
            )}
          </AgTag>
        </CollapsibleTrigger>
        <CollapsibleContent className='border-t px-3 pb-3'>
          {group.status !== 'available' ? (
            <p className='pt-3 text-sm text-muted-foreground'>
              {t('agents.available.reason', {
                reason:
                  group.statusDetail ??
                  t(
                    `agents.available.status.${group.status === 'failed' ? 'needsLogin' : group.status}`,
                  ),
              })}
            </p>
          ) : rows.isError && !rows.data ? (
            <AgLoadError
              title={t('agents.loadFailed')}
              error={rows.error}
              onRetry={() => void rows.refetch()}
            />
          ) : !rows.data ? (
            <AgListSkeleton rows={2} />
          ) : loaded.length === 0 ? (
            <p className='pt-3 text-sm text-muted-foreground'>
              {t('agents.available.noModels')}
            </p>
          ) : (
            <div className='pt-2'>
              {loaded.length > VIRTUALIZE_THRESHOLD ? (
                <Virtuoso
                  style={{ height: 320 }}
                  data={loaded}
                  computeItemKey={(_, model) => rowKey(model.tool, model.model)}
                  endReached={() => {
                    if (rows.hasNextPage && !rows.isFetchingNextPage)
                      void rows.fetchNextPage();
                  }}
                  itemContent={(_, model) => (
                    <div className='py-1'>
                      <ModelRow
                        model={model}
                        checked={selected.has(rowKey(model.tool, model.model))}
                        onSelect={onSelect}
                        onCustomCreate={onCustomCreate}
                      />
                    </div>
                  )}
                />
              ) : (
                <div className='space-y-1'>
                  {loaded.map((model) => (
                    <ModelRow
                      key={rowKey(model.tool, model.model)}
                      model={model}
                      checked={selected.has(rowKey(model.tool, model.model))}
                      onSelect={onSelect}
                      onCustomCreate={onCustomCreate}
                    />
                  ))}
                </div>
              )}
              {rows.hasNextPage ? (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='mt-2'
                  disabled={rows.isFetchingNextPage}
                  onClick={() => void rows.fetchNextPage()}
                >
                  {t('agents.loadMore')}
                </Button>
              ) : null}
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function ModelRow({
  model,
  checked,
  onSelect,
  onCustomCreate,
}: {
  readonly model: AvailableModel;
  readonly checked: boolean;
  readonly onSelect: (model: AvailableModel, checked: boolean) => void;
  readonly onCustomCreate: (model: AvailableModel) => void;
}): ReactElement {
  const { t } = useTranslation();
  const added = model.agentId !== null;
  return (
    <div
      data-testid={`available-model-${model.tool}-${model.model}`}
      className='flex items-center gap-3 rounded-md p-2 hover:bg-muted/50'
    >
      <Checkbox
        aria-label={t('agents.cleanup.select', {
          name: model.displayModel ?? model.model,
        })}
        checked={checked}
        disabled={added}
        onCheckedChange={(next) => onSelect(model, next === true)}
      />
      <div className='min-w-0 flex-1'>
        <div className='font-medium'>
          {model.displayModel ?? (model.model || TOOL_LABELS[model.tool])}
        </div>
        {model.recommended ? (
          <div className='text-xs text-muted-foreground'>
            {t('agents.available.recommended')}
          </div>
        ) : null}
      </div>
      {added ? (
        <AgTag tone='grey'>{t('agents.available.added')}</AgTag>
      ) : (
        <Button
          type='button'
          size='sm'
          variant='outline'
          onClick={() => onCustomCreate(model)}
          data-testid={`available-model-create-${model.tool}-${model.model}`}
        >
          {t('agents.available.create')}
        </Button>
      )}
    </div>
  );
}

function CreateForm({
  model,
  onBack,
  onDone,
}: {
  readonly model: AvailableModel;
  readonly onBack: () => void;
  readonly onDone: () => void;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const api = useAgentsApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [goodAt, setGoodAt] = useState(() =>
    modelSuggestion(model, i18n.language, t),
  );
  const [submitted, setSubmitted] = useState(false);
  const create = useMutation({
    mutationFn: () =>
      api.createRunnerAgent({
        tool: model.tool,
        model: model.model,
        ...(model.displayModel ? { displayModel: model.displayModel } : {}),
        description: goodAt.trim(),
      }),
    onSuccess: (agent) => {
      notify.success(t('agents.enable.done', { name: agent.name }));
      void queryClient.invalidateQueries({ queryKey: agentsKeys.agents });
      void queryClient.invalidateQueries({
        queryKey: agentsKeys.availableModelsAll,
      });
      onDone();
    },
    onError: (error) => notify.error(error),
  });
  const missing = goodAt.trim() === '';
  return (
    <>
      <SheetHeader className='shrink-0'>
        <SheetTitle>
          {t('agents.available.createTitle', {
            name: model.displayModel ?? model.model,
          })}
        </SheetTitle>
      </SheetHeader>
      <form
        id='available-model-create-form'
        className='min-h-0 flex-1 overflow-y-auto px-4 pb-1 sm:px-6'
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
          if (missing) return;
          create.mutate();
        }}
      >
        <FieldGroup>
          <Field data-invalid={submitted && missing ? true : undefined}>
            <FieldLabel htmlFor='available-model-good-at'>
              {t('agents.columns.goodAt')}
            </FieldLabel>
            <Textarea
              id='available-model-good-at'
              rows={4}
              value={goodAt}
              onChange={(event) => setGoodAt(event.target.value)}
              aria-invalid={submitted && missing ? true : undefined}
              data-testid='available-model-good-at'
            />
            <FieldDescription>{t('agents.enable.goodAtHint')}</FieldDescription>
            {submitted && missing ? (
              <FieldError>{t('agents.enable.goodAtRequired')}</FieldError>
            ) : null}
          </Field>
        </FieldGroup>
      </form>
      <SheetFooter className='shrink-0 flex-row justify-end border-t'>
        <Button variant='outline' type='button' onClick={onBack}>
          {t('actions.back')}
        </Button>
        <Button
          type='submit'
          form='available-model-create-form'
          disabled={create.isPending}
          data-testid='available-model-create-submit'
        >
          {t('agents.available.create')}
        </Button>
      </SheetFooter>
    </>
  );
}
