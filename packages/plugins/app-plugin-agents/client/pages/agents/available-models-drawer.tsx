/**
 * Every tool a runner has selected, grouped so a tool reporting hundreds of models (the discovery bug this replaced)
 * reads as one collapsed row until someone opens it: add an agent from a model that has none, or see the state of
 * one that already does. A large drawer, not a dialog, because the group list and a tool's own models can be long —
 * a combined search (tool and model name), a status filter defaulting to "Available", per-tool collapse (open by
 * default under `DEFAULT_EXPAND_THRESHOLD` models, with its own search once expanded), multi-select across pages and
 * a sticky "Add" bar that opens a second step to confirm what each selected model is good at before creating
 * anything. The application's recommended combinations never show a checkbox here: a runner reporting one signed in
 * creates and enables it on its own. Only the tools a runtime has checked are ever detected, so a tool nobody checked
 * never appears in this list at all.
 */
import { CheckIcon } from 'lucide-react';
import type { AgentTool } from '@nocobase/agent-protocol';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQueryClient,
} from '@tanstack/react-query';
import { useMemo, useRef, useState, type ReactElement } from 'react';
import { Virtuoso } from 'react-virtuoso';

import type {
  AvailableModel,
  AvailableModelGroup,
  ModelAvailabilityStatus,
} from '../../../shared/agents.js';
import {
  agentNameOf,
  TOOL_LABELS,
  TOOL_SIGN_IN,
} from '../../../shared/model-catalog.js';
import { modelSuggestion } from '../../model-suggestion.js';
import { GoodAtTemplates } from './good-at-templates.js';
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
import { Field, FieldError, FieldLabel } from '../../components/ui/field.js';
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
import { errorText, useNotify } from '../../hooks/use-notify.js';

/** Exactly the drawer's four filter buttons. */
const STATUS_FILTERS: readonly ModelAvailabilityStatus[] = [
  'available',
  'needsSetup',
  'versionTooOld',
  'failed',
];

/** A group with this many models or fewer starts open; a larger one starts collapsed. */
const DEFAULT_EXPAND_THRESHOLD = 10;
/** Rows loaded past this count in one group switch from a plain list to a virtualized one. */
const VIRTUALIZE_THRESHOLD = 30;
const PAGE_SIZE = 50;
/** A reason or detail line longer than this starts collapsed, with a toggle to read the rest. */
const REASON_CLAMP_LENGTH = 160;

const STATUS_TONE: Readonly<Record<ModelAvailabilityStatus, Tone>> = {
  available: 'green',
  needsSetup: 'amber',
  versionTooOld: 'amber',
  failed: 'red',
};

function rowKey(tool: AgentTool, model: string): string {
  return `${tool}\u0000${model}`;
}

/** Setup actions and diagnostic output have different jobs: keep the command visible once, with raw output opt-in. */
function SetupGuidance({
  group,
}: {
  readonly group: AvailableModelGroup;
}): ReactElement {
  const { t } = useTranslation();
  const command = TOOL_SIGN_IN[group.tool];
  if (group.status !== 'needsSetup')
    return (
      <ExpandableText
        text={
          (group.statusDetail ??
            t(
              group.status === 'versionTooOld'
                ? 'agents.available.minimumVersionUnknown'
                : 'agents.available.noDetail',
            )) +
          (group.status === 'versionTooOld'
            ? ' ' + t('agents.available.upgradeAdvice')
            : '')
        }
      />
    );
  const [before, after] = t('agents.available.setupCommand', {
    command: '\u0000',
  }).split('\u0000');
  return (
    <div className='space-y-2 pt-3 text-sm text-muted-foreground'>
      <p>
        {command ? (
          <>
            {before}
            <code className='rounded bg-muted px-1 py-0.5 font-mono text-foreground'>
              {command}
            </code>
            {after}
          </>
        ) : (
          t('agents.available.setupUnknown')
        )}
      </p>
      {group.statusDetail ? (
        <details>
          <summary className='cursor-pointer'>
            {t('agents.available.details')}
          </summary>
          <p className='whitespace-pre-wrap break-words pt-2'>
            {group.statusDetail}
          </p>
        </details>
      ) : null}
    </div>
  );
}

function modelName(model: AvailableModel): string {
  return agentNameOf(model.tool, model.model, model.displayModel);
}

function ExpandableText({ text }: { readonly text: string }): ReactElement {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const long = text.length > REASON_CLAMP_LENGTH;
  return (
    <p className='pt-3 text-sm text-muted-foreground'>
      {long && !expanded ? `${text.slice(0, REASON_CLAMP_LENGTH)}…` : text}
      {long ? (
        <Button
          type='button'
          variant='link'
          size='sm'
          className='h-auto p-0 pl-1 align-baseline'
          onClick={() => setExpanded((value) => !value)}
        >
          {t(
            expanded
              ? 'agents.available.showLess'
              : 'agents.available.showMore',
          )}
        </Button>
      ) : null}
    </p>
  );
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
  const [statuses, setStatuses] = useState<
    ReadonlySet<ModelAvailabilityStatus>
  >(() => new Set(['available']));
  const [toggled, setToggled] = useState<ReadonlySet<AgentTool>>(
    () => new Set(),
  );
  const [selected, setSelected] = useState<ReadonlyMap<string, AvailableModel>>(
    () => new Map(),
  );
  const [groupSearches, setGroupSearches] = useState<
    ReadonlyMap<AgentTool, string>
  >(() => new Map());
  const [step, setStep] = useState<'select' | 'confirm'>('select');
  const [drafts, setDrafts] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );
  const submittingRef = useRef(false);
  const [rowErrors, setRowErrors] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );
  const q = search.trim();
  const forceExpand = q !== '';
  // Each status already has a server-side model filter and count. Empty (or all four) means no filter.
  const filters = useMemo<readonly (ModelAvailabilityStatus | undefined)[]>(
    () =>
      statuses.size === 0 || statuses.size === STATUS_FILTERS.length
        ? [undefined]
        : STATUS_FILTERS.filter((status) => statuses.has(status)),
    [statuses],
  );

  const reset = (): void => {
    setSearch('');
    setStatuses(new Set(['available']));
    setToggled(new Set());
    setGroupSearches(new Map());
    setSelected(new Map());
    setDrafts(new Map());
    setStep('select');
    setRowErrors(new Map());
  };

  const removeSucceeded = (keys: ReadonlySet<string>): void => {
    setSelected(
      (current) => new Map([...current].filter(([key]) => !keys.has(key))),
    );
    setDrafts(
      (current) => new Map([...current].filter(([key]) => !keys.has(key))),
    );
  };
  // Both steps and every dismissal share one request owner. The ref also closes the same-tick submit race.
  const entries = [...selected.values()];
  const bulkCreate = useMutation({
    mutationFn: async () => {
      const results = await Promise.all(
        entries.map((model) => {
          const key = rowKey(model.tool, model.model);
          return api
            .createRunnerAgent({
              tool: model.tool,
              model: model.model,
              ...(model.displayModel
                ? { displayModel: model.displayModel }
                : {}),
              description: (drafts.get(key) ?? '').trim(),
            })
            .then(
              () => ({ key, ok: true as const }),
              (error: unknown) => ({ key, ok: false as const, error }),
            );
        }),
      );
      return results;
    },
    onSuccess: (results) => {
      const succeeded = new Set(results.filter((r) => r.ok).map((r) => r.key));
      const failed = results.filter((r) => !r.ok);
      void queryClient.invalidateQueries({ queryKey: agentsKeys.agents });
      void queryClient.invalidateQueries({
        queryKey: agentsKeys.availableModelsAll,
      });
      if (failed.length === 0) {
        notify.success(
          t('agents.available.addedCount', { count: succeeded.size }),
        );
        reset();
        onClose();
        return;
      }
      // Partial (or total) failure: drop only what succeeded from the selection and drafts, so the failed rows stay
      // on screen with what was typed and their own real reason, instead of discarding everything and closing.
      setRowErrors(
        new Map(
          failed.map((r) => [
            r.key,
            errorText(t, r.error, t('common.requestFailed')),
          ]),
        ),
      );
      removeSucceeded(succeeded);
      notify.error(
        undefined,
        succeeded.size === 0
          ? t('agents.available.addFailed', { failed: failed.length })
          : t('agents.available.addedPartial', {
              succeeded: succeeded.size,
              failed: failed.length,
            }),
      );
    },
    onError: (error) => notify.error(error),
    onSettled: () => {
      submittingRef.current = false;
    },
  });
  const submit = (): void => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    bulkCreate.mutate();
  };

  const groupQueries = useQueries({
    queries: filters.map((status) => ({
      queryKey: agentsKeys.availableModelGroups(q, status ?? ''),
      queryFn: () => api.availableModelGroups({ q: q || undefined, status }),
      enabled: open && step === 'select',
    })),
  });
  const mergedGroups = new Map<AgentTool, AvailableModelGroup>();
  for (const query of groupQueries)
    for (const group of query.data?.data ?? []) {
      const previous = mergedGroups.get(group.tool);
      mergedGroups.set(
        group.tool,
        previous
          ? {
              ...group,
              modelCount: previous.modelCount + group.modelCount,
              recommendedCount:
                previous.recommendedCount + group.recommendedCount,
            }
          : group,
      );
    }
  const groups = {
    data: groupQueries.every((query) => query.data !== undefined)
      ? {
          data: [...mergedGroups.values()].sort((a, b) =>
            a.tool.localeCompare(b.tool),
          ),
        }
      : undefined,
    isError: groupQueries.some((query) => query.isError),
    error: groupQueries.find((query) => query.isError)?.error,
    refetch: () => Promise.all(groupQueries.map((query) => query.refetch())),
  };

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

  // Pre-fills a draft from the catalog's suggestion (or leaves it for the confirm step to mark as needed) the first
  // time a model is selected; going back and forth keeps whatever was already typed.
  const goToConfirm = (addedModel?: AvailableModel): void => {
    setDrafts((current) => {
      const entries = addedModel
        ? [addedModel, ...selected.values()]
        : [...selected.values()];
      const next = new Map(current);
      for (const model of entries) {
        const key = rowKey(model.tool, model.model);
        if (!next.has(key))
          next.set(key, modelSuggestion(model, i18n.language, t));
      }
      return next;
    });
    setStep('confirm');
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next, details) => {
        if (!next && submittingRef.current) {
          details.cancel();
          return;
        }
        if (!next) {
          reset();
          onClose();
        }
      }}
    >
      <SheetContent
        className='flex w-full flex-col gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[780px]'
        data-testid='available-models-drawer'
        aria-busy={bulkCreate.isPending}
        showCloseButton={!bulkCreate.isPending}
      >
        {step === 'confirm' ? (
          <ConfirmStep
            selected={selected}
            drafts={drafts}
            onDraftChange={(key, value) =>
              setDrafts((current) => new Map(current).set(key, value))
            }
            pending={bulkCreate.isPending}
            rowErrors={rowErrors}
            onSubmit={submit}
            onBack={() => setStep('select')}
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
                placeholder={t('agents.display.search')}
                aria-label={t('agents.display.search')}
                data-testid='available-models-search'
              />
              <div className='flex flex-wrap gap-2'>
                {STATUS_FILTERS.map((option) => (
                  <Button
                    key={option}
                    type='button'
                    size='sm'
                    variant={statuses.has(option) ? 'default' : 'outline'}
                    aria-pressed={statuses.has(option)}
                    onClick={() =>
                      setStatuses((current) => {
                        const next = new Set(current);
                        if (next.has(option)) next.delete(option);
                        else next.add(option);
                        return next;
                      })
                    }
                    data-testid={`available-models-filter-${option}`}
                  >
                    {statuses.has(option) ? <CheckIcon aria-hidden /> : null}
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
                    filters={filters}
                    groupQuery={groupSearches.get(group.tool) ?? ''}
                    onGroupQueryChange={(value) =>
                      setGroupSearches((current) =>
                        new Map(current).set(group.tool, value),
                      )
                    }
                    expanded={
                      toggled.has(group.tool) !==
                      group.modelCount <= DEFAULT_EXPAND_THRESHOLD
                    }
                    forceExpand={forceExpand}
                    onToggle={() => toggle(group.tool)}
                    selected={selected}
                    onSelect={setRowSelected}
                    onAddOne={(model) => {
                      setRowSelected(model, true);
                      goToConfirm(model);
                    }}
                  />
                ))
              )}
            </div>
            <SheetFooter
              data-fixed-sheet-footer
              className='shrink-0 flex-row items-center justify-between border-t'
            >
              <div className='text-sm text-muted-foreground'>
                {selected.size > 0
                  ? t('agents.available.selectedCount', {
                      count: selected.size,
                    })
                  : null}
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  onClick={() => {
                    reset();
                    onClose();
                  }}
                >
                  {t('actions.close')}
                </Button>
                <Button
                  disabled={selected.size === 0}
                  onClick={() => goToConfirm()}
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
  filters,
  groupQuery,
  onGroupQueryChange,
  expanded,
  forceExpand,
  onToggle,
  selected,
  onSelect,
  onAddOne,
}: {
  readonly group: AvailableModelGroup;
  readonly q: string;
  readonly filters: readonly (ModelAvailabilityStatus | undefined)[];
  readonly groupQuery: string;
  readonly onGroupQueryChange: (value: string) => void;
  readonly expanded: boolean;
  readonly forceExpand: boolean;
  readonly onToggle: () => void;
  readonly selected: ReadonlyMap<string, AvailableModel>;
  readonly onSelect: (model: AvailableModel, checked: boolean) => void;
  readonly onAddOne: (model: AvailableModel) => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const open = forceExpand || expanded;
  const effectiveQuery = groupQuery.trim() || q;
  const rows = useInfiniteQuery({
    queryKey: agentsKeys.availableModelRows(
      group.tool,
      effectiveQuery,
      filters.join(','),
    ),
    queryFn: async ({ pageParam }) => {
      const pages = await Promise.all(
        filters.map((status) =>
          api.availableModelRows(group.tool, {
            q: effectiveQuery || undefined,
            status,
            page: pageParam,
            pageSize: PAGE_SIZE,
          }),
        ),
      );
      return {
        data: pages.flatMap((page) => page.data),
        total: pages.reduce((total, page) => total + page.meta.total, 0),
        page: pageParam,
        hasMore: pages.some(
          (page) => page.meta.page * page.meta.pageSize < page.meta.total,
        ),
      };
    },
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    enabled: open && group.modelCount > 0,
  });
  const loaded = useMemo(
    () =>
      (rows.data?.pages.flatMap((page) => page.data) ?? []).sort((a, b) =>
        (a.displayModel ?? a.model).localeCompare(b.displayModel ?? b.model),
      ),
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
              count: rows.data?.pages[0].total ?? group.modelCount,
              tool: TOOL_LABELS[group.tool],
              runners: t('agents.available.runners', {
                count: group.runnerCount,
              }),
            })}
          </span>
          <AgTag tone={STATUS_TONE[group.status]} dot>
            {t(`agents.available.status.${group.status}`)}
          </AgTag>
        </CollapsibleTrigger>
        <CollapsibleContent className='border-t px-3 pb-3'>
          {/* Shown independently of modelCount: a tool that already has models with an agent (so this group is not
              empty) can still need setup or be failing now, and that guidance must not disappear behind its rows. */}
          {group.status !== 'available' ? (
            <SetupGuidance group={group} />
          ) : null}
          {group.modelCount === 0 ? null : (
            <>
              {group.modelCount > DEFAULT_EXPAND_THRESHOLD ||
              groupQuery !== '' ? (
                <Input
                  value={groupQuery}
                  onChange={(event) => onGroupQueryChange(event.target.value)}
                  placeholder={t('agents.available.groupSearchPlaceholder')}
                  aria-label={t('agents.available.groupSearchPlaceholder')}
                  className='mt-3'
                  data-testid={`available-models-group-search-${group.tool}`}
                />
              ) : null}
              {rows.isError && !rows.data ? (
                <AgLoadError
                  title={t('agents.loadFailed')}
                  error={rows.error}
                  onRetry={() => void rows.refetch()}
                />
              ) : !rows.data ? (
                <p role='status' className='pt-3 text-sm text-muted-foreground'>
                  {t('common.loading')}
                </p>
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
                      computeItemKey={(_, model) =>
                        rowKey(model.tool, model.model)
                      }
                      endReached={() => {
                        if (rows.hasNextPage && !rows.isFetchingNextPage)
                          void rows.fetchNextPage();
                      }}
                      itemContent={(_, model) => (
                        <div className='py-1'>
                          <ModelRow
                            model={model}
                            groupStatus={group.status}
                            checked={selected.has(
                              rowKey(model.tool, model.model),
                            )}
                            onSelect={onSelect}
                            onAddOne={onAddOne}
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
                          groupStatus={group.status}
                          checked={selected.has(
                            rowKey(model.tool, model.model),
                          )}
                          onSelect={onSelect}
                          onAddOne={onAddOne}
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
            </>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function ModelRow({
  model,
  groupStatus,
  checked,
  onSelect,
  onAddOne,
}: {
  readonly model: AvailableModel;
  readonly groupStatus: ModelAvailabilityStatus;
  readonly checked: boolean;
  readonly onSelect: (model: AvailableModel, checked: boolean) => void;
  readonly onAddOne: (model: AvailableModel) => void;
}): ReactElement {
  const { t } = useTranslation();
  const added = model.agentId !== null;
  return (
    <div
      data-testid={`available-model-${model.tool}-${model.model}`}
      className='flex items-center gap-3 rounded-md p-2 hover:bg-muted/50'
    >
      <Checkbox
        aria-label={t('agents.display.select', {
          name: modelName(model),
        })}
        checked={checked}
        disabled={added || model.availability !== 'available'}
        onCheckedChange={(next) => onSelect(model, next === true)}
      />
      <div className='min-w-0 flex-1'>
        <div className='font-medium'>{modelName(model)}</div>
        <div className='flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground'>
          <span>{model.model}</span>
          {model.recommended ? (
            <span>{t('agents.available.recommended')}</span>
          ) : null}
          <span>
            {t('agents.available.runners', { count: model.runners.ready })}
          </span>
        </div>
      </div>
      {model.availability !== groupStatus ? (
        <AgTag tone={STATUS_TONE[model.availability]}>
          {t(`agents.available.status.${model.availability}`)}
        </AgTag>
      ) : null}
      {added ? (
        <AgTag tone='grey'>{t('agents.available.added')}</AgTag>
      ) : (
        <Button
          type='button'
          size='sm'
          variant='outline'
          disabled={model.availability !== 'available'}
          onClick={() => onAddOne(model)}
          data-testid={`available-model-create-${model.tool}-${model.model}`}
        >
          {t('agents.available.add')}
        </Button>
      )}
    </div>
  );
}

function ConfirmStep({
  selected,
  drafts,
  onDraftChange,
  pending,
  rowErrors,
  onSubmit,
  onBack,
}: {
  readonly selected: ReadonlyMap<string, AvailableModel>;
  readonly drafts: ReadonlyMap<string, string>;
  readonly onDraftChange: (key: string, value: string) => void;
  readonly pending: boolean;
  readonly rowErrors: ReadonlyMap<string, string>;
  readonly onSubmit: () => void;
  readonly onBack: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const entries = [...selected.values()];
  const invalid = entries.filter(
    (model) =>
      (drafts.get(rowKey(model.tool, model.model)) ?? '').trim() === '',
  );
  return (
    <>
      <SheetHeader className='shrink-0'>
        <SheetTitle>
          {t('agents.available.confirmTitle', { count: entries.length })}
        </SheetTitle>
        <SheetDescription>{t('agents.enable.goodAtHint')}</SheetDescription>
      </SheetHeader>
      <form
        id='available-models-confirm-form'
        className='min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-1 sm:px-6'
        onSubmit={(event) => {
          event.preventDefault();
          if (pending) return;
          if (invalid.length > 0) return;
          onSubmit();
        }}
      >
        {entries.map((model) => {
          const key = rowKey(model.tool, model.model);
          const goodAt = drafts.get(key) ?? '';
          const missing = goodAt.trim() === '';
          const rowError = rowErrors.get(key);
          return (
            <Field key={key} data-invalid={missing ? true : undefined}>
              <p className='text-sm font-medium'>{modelName(model)}</p>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <FieldLabel htmlFor={`confirm-good-at-${key}`}>
                  {t('agents.columns.goodAt')}
                </FieldLabel>
                <GoodAtTemplates
                  value={goodAt}
                  onChange={(value) => onDraftChange(key, value)}
                  disabled={pending}
                />
              </div>
              <Textarea
                id={`confirm-good-at-${key}`}
                rows={3}
                disabled={pending}
                value={goodAt}
                onChange={(event) => onDraftChange(key, event.target.value)}
                aria-invalid={missing ? true : undefined}
                placeholder={
                  goodAt === '' ? t('agents.available.goodAtNeeded') : undefined
                }
                data-testid={`available-model-good-at-${model.tool}-${model.model}`}
              />
              {rowError ? (
                <FieldError
                  data-testid={`available-model-error-${model.tool}-${model.model}`}
                >
                  {rowError}
                </FieldError>
              ) : null}
              {missing ? (
                <FieldError>{t('agents.enable.goodAtRequired')}</FieldError>
              ) : null}
            </Field>
          );
        })}
      </form>
      <SheetFooter
        data-fixed-sheet-footer
        className='shrink-0 flex-row justify-end border-t'
      >
        <Button
          variant='outline'
          type='button'
          onClick={onBack}
          disabled={pending}
        >
          {t('actions.back')}
        </Button>
        <Button
          type='submit'
          form='available-models-confirm-form'
          disabled={pending || invalid.length > 0}
          data-testid='available-models-confirm-submit'
        >
          {t('agents.available.confirmAction', { count: entries.length })}
        </Button>
      </SheetFooter>
    </>
  );
}
