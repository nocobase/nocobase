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
import { TOOL_LABELS, TOOL_SIGN_IN } from '../../../shared/model-catalog.js';
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

/** The group header's reason line: the tool's own setup command when the catalog has one, its own words when it
 * gave any, and an honest gap instead of a guess when neither is available. */
function setupGuidance(
  group: Pick<AvailableModelGroup, 'tool' | 'status' | 'statusDetail'>,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const command = TOOL_SIGN_IN[group.tool];
  if (group.status === 'needsSetup') {
    const instruction = command
      ? t('agents.available.setupCommand', { command })
      : t('agents.available.setupUnknown');
    return group.statusDetail
      ? `${instruction} ${group.statusDetail}`
      : instruction;
  }
  return group.statusDetail ?? t('agents.available.noDetail');
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
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ModelAvailabilityStatus>('available');
  const [toggled, setToggled] = useState<ReadonlySet<AgentTool>>(
    () => new Set(),
  );
  const [selected, setSelected] = useState<ReadonlyMap<string, AvailableModel>>(
    () => new Map(),
  );
  const [step, setStep] = useState<'select' | 'confirm'>('select');
  const [drafts, setDrafts] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );
  const q = search.trim();
  const forceExpand = q !== '';

  const reset = (): void => {
    setSearch('');
    setStatus('available');
    setToggled(new Set());
    setSelected(new Map());
    setDrafts(new Map());
    setStep('select');
  };

  const groups = useQuery({
    queryKey: agentsKeys.availableModelGroups(q, status),
    queryFn: () => api.availableModelGroups({ q: q || undefined, status }),
    enabled: open && step === 'select',
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
        {step === 'confirm' ? (
          <ConfirmStep
            selected={selected}
            drafts={drafts}
            onDraftChange={(key, value) =>
              setDrafts((current) => new Map(current).set(key, value))
            }
            onRemoveSucceeded={(keys) => {
              setSelected((current) => {
                const next = new Map(current);
                for (const key of keys) next.delete(key);
                return next;
              });
              setDrafts((current) => {
                const next = new Map(current);
                for (const key of keys) next.delete(key);
                return next;
              });
            }}
            onBack={() => setStep('select')}
            onDone={() => {
              reset();
              onClose();
            }}
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
                    onAddOne={(model) => {
                      setRowSelected(model, true);
                      goToConfirm(model);
                    }}
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
  status,
  expanded,
  forceExpand,
  onToggle,
  selected,
  onSelect,
  onAddOne,
}: {
  readonly group: AvailableModelGroup;
  readonly q: string;
  readonly status: ModelAvailabilityStatus;
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
  const [groupQuery, setGroupQuery] = useState('');
  const effectiveQuery = groupQuery.trim() || q;
  const rows = useInfiniteQuery({
    queryKey: agentsKeys.availableModelRows(group.tool, effectiveQuery, status),
    queryFn: ({ pageParam }) =>
      api.availableModelRows(group.tool, {
        q: effectiveQuery || undefined,
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
            {t(`agents.available.status.${group.status}`)}
          </AgTag>
        </CollapsibleTrigger>
        <CollapsibleContent className='border-t px-3 pb-3'>
          {/* Shown independently of modelCount: a tool that already has models with an agent (so this group is not
              empty) can still need setup or be failing now, and that guidance must not disappear behind its rows. */}
          {group.status !== 'available' ? (
            <ExpandableText text={setupGuidance(group, t)} />
          ) : null}
          {group.modelCount === 0 ? null : (
            <>
              {group.modelCount > DEFAULT_EXPAND_THRESHOLD ? (
                <Input
                  value={groupQuery}
                  onChange={(event) => setGroupQuery(event.target.value)}
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
  checked,
  onSelect,
  onAddOne,
}: {
  readonly model: AvailableModel;
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
        aria-label={t('agents.cleanup.select', {
          name: model.displayModel ?? model.model,
        })}
        checked={checked}
        disabled={added || model.availability !== 'available'}
        onCheckedChange={(next) => onSelect(model, next === true)}
      />
      <div className='min-w-0 flex-1'>
        <div className='font-medium'>
          {model.displayModel ?? (model.model || TOOL_LABELS[model.tool])}
        </div>
        <div className='flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground'>
          {model.recommended ? (
            <span>{t('agents.available.recommended')}</span>
          ) : null}
          <span>
            {t('agents.available.runners', { count: model.runners.ready })}
          </span>
        </div>
      </div>
      <AgTag tone={STATUS_TONE[model.availability]}>
        {t(`agents.available.status.${model.availability}`)}
      </AgTag>
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
  onRemoveSucceeded,
  onBack,
  onDone,
}: {
  readonly selected: ReadonlyMap<string, AvailableModel>;
  readonly drafts: ReadonlyMap<string, string>;
  readonly onDraftChange: (key: string, value: string) => void;
  readonly onRemoveSucceeded: (keys: ReadonlySet<string>) => void;
  readonly onBack: () => void;
  readonly onDone: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState(false);
  const [rowErrors, setRowErrors] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );
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
        onDone();
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
      onRemoveSucceeded(succeeded);
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
  });
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
          if (bulkCreate.isPending) return;
          setSubmitted(true);
          if (invalid.length > 0) return;
          bulkCreate.mutate();
        }}
      >
        {entries.map((model) => {
          const key = rowKey(model.tool, model.model);
          const goodAt = drafts.get(key) ?? '';
          const missing = submitted && goodAt.trim() === '';
          const rowError = rowErrors.get(key);
          return (
            <Field key={key} data-invalid={missing ? true : undefined}>
              <FieldLabel htmlFor={`confirm-good-at-${key}`}>
                {model.displayModel ?? model.model} · {TOOL_LABELS[model.tool]}
              </FieldLabel>
              <Textarea
                id={`confirm-good-at-${key}`}
                rows={3}
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
      <SheetFooter className='shrink-0 flex-row justify-end border-t'>
        <Button variant='outline' type='button' onClick={onBack}>
          {t('actions.back')}
        </Button>
        <Button
          type='submit'
          form='available-models-confirm-form'
          disabled={bulkCreate.isPending}
          data-testid='available-models-confirm-submit'
        >
          {t('agents.available.confirmAction', { count: entries.length })}
        </Button>
      </SheetFooter>
    </>
  );
}
