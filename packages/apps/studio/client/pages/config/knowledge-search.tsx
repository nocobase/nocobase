/**
 * `/config/knowledge-search` ("Knowledge search"): how the knowledge base is searched (`studio.knowledgeSearch` `read`;
 * changing it takes `manage`). From the top: the search status (keyword search always; semantic search with why it is
 * unavailable and how to fix it), the vector store `config.yml` configures (type, location, its indexes' progress),
 * then one section per setting, each saved on its own: the embedding model, the rerank model, ranking (the result
 * count, the minimum relevance, the keyword weight and the rerank model's candidates), the default chunking (a space may
 * set its own), adding context to sections (a switch, its model and the spaces it is on for) and the token threshold
 * under which an online agent gets its knowledge whole. The models come from the agents plugin's model services, by kind; each picker links to them.
 */
import {
  SectionHeading,
  SettingsPageHeader,
} from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CircleAlert,
  CircleCheck,
  CircleDashed,
  ExternalLink,
  LoaderCircle,
} from 'lucide-react';
import { useState, type ReactElement, type ReactNode } from 'react';
import { Link } from 'react-router';

import { chunkingOf } from '@nocobase/app-plugin-knowledge/shared/knowledge';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';

import {
  SYSTEM_SCOPE,
  WHOLE_TOKENS_MAX,
  type KnowledgeIndexModel,
  type KnowledgeIndexStatus,
  type KnowledgeModelOption,
  type KnowledgeModelRef,
  type KnowledgeRecallSettings,
  type KnowledgeSearchConfig,
  type KnowledgeSearchSettings,
} from '../../../shared/knowledge.js';
import { useStudioApi } from '../../access/api.js';
import { useNotify } from '../../access/notify.js';

const NONE = '__none__';
const SEPARATOR = '\u0000';
/** Where the agents plugin's model services are managed (Agent team › Models). */
const MODELS_PATH = '/models';
/** Studio's documentation of the vector store. */
const VECTOR_STORE_DOCS =
  'https://github.com/nocobase/nocobase/blob/v3-develop/packages/apps/studio/docs/knowledge.md#vector-store';
/** How often the page asks again while an index is being built. */
const BUILDING_POLL_MS = 5_000;

const CONFIG_SNIPPET = `agents:
  vectors:
    store: sqlite-vec # sqlite-vec | pgvector | false
    path: storage/vectors.sqlite
    # store: pgvector
    # url: postgres://user:password@host:5432/vectors`;

const knowledgeSearchKey = ['studio', 'knowledge', 'search'] as const;

const valueOf = (ref: KnowledgeModelRef | null) =>
  ref ? `${ref.modelService}${SEPARATOR}${ref.model}` : NONE;

function refOf(value: string | null): KnowledgeModelRef | null {
  if (!value || value === NONE) return null;
  const [modelService, model] = value.split(SEPARATOR);
  return modelService && model ? { modelService, model } : null;
}

/** Semantic search as the status card states it. */
type SemanticState = 'available' | 'unavailable' | 'off' | 'building';

function semanticStateOf(
  index: KnowledgeIndexStatus,
  settings: KnowledgeSearchSettings,
): SemanticState {
  if (!index.available) return 'unavailable';
  if (!settings.embedding) return 'off';
  return index.active ? 'available' : 'building';
}

/** A token count as people read it: "150K", "15万". */
function approxTokens(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

/** Saves a part of the settings over the latest ones the page has. */
function useSaveSettings() {
  const { t } = useTranslation();
  const api = useStudioApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<KnowledgeSearchSettings>) => {
      const latest =
        queryClient.getQueryData<KnowledgeSearchConfig>(knowledgeSearchKey);
      if (!latest)
        throw new Error('The knowledge search settings are not loaded.');
      return api.updateKnowledgeSearch({ ...latest.settings, ...patch });
    },
    onSuccess: (next) => {
      queryClient.setQueryData(knowledgeSearchKey, next);
      notify.success(t('knowledge.searchSettings.saved'));
    },
    onError: (error) => notify.error(error),
  });
}

function ModelSelect({
  id,
  label,
  options,
  value,
  disabled,
  empty,
  onChange,
}: {
  readonly id: string;
  readonly label: string;
  readonly options: readonly KnowledgeModelOption[];
  readonly value: KnowledgeModelRef | null;
  readonly disabled: boolean;
  /** Said when the model services offer no model of this kind. */
  readonly empty: string;
  readonly onChange: (next: KnowledgeModelRef | null) => void;
}): ReactElement {
  const { t } = useTranslation();
  const items = [
    { value: NONE, label: t('knowledge.searchSettings.none') },
    ...options.map((option) => ({
      value: valueOf(option),
      label: `${option.serviceTitle} · ${option.label}`,
    })),
  ];
  const current = valueOf(value);
  if (!items.some((item) => item.value === current) && value)
    items.push({
      value: current,
      label: `${value.modelService} · ${value.model}`,
    });
  return (
    <div className='flex flex-col gap-2'>
      <Select
        items={items}
        value={current}
        disabled={disabled}
        onValueChange={(next: string | null) => {
          if (next !== null && next !== current) onChange(refOf(next));
        }}
      >
        <SelectTrigger id={id} className='w-80 max-w-full' aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className='text-xs text-muted-foreground'>
        {options.length === 0 ? `${empty} ` : null}
        {t('knowledge.searchSettings.fromModels')} ·{' '}
        <Link
          to={MODELS_PATH}
          className='text-primary underline-offset-4 hover:underline'
        >
          {t('knowledge.searchSettings.manageModels')}
        </Link>
      </p>
    </div>
  );
}

function StatusRow({
  icon,
  label,
  state,
  children,
}: {
  readonly icon: ReactNode;
  readonly label: string;
  readonly state: ReactNode;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className='flex gap-3'>
      <span className='mt-0.5 shrink-0 text-muted-foreground'>{icon}</span>
      <div className='flex min-w-0 flex-col gap-1'>
        <div className='flex flex-wrap items-center gap-2 text-sm font-medium'>
          {label}
          {state}
        </div>
        <div className='flex flex-col gap-1 text-sm text-muted-foreground'>
          {children}
        </div>
      </div>
    </div>
  );
}

function StatusCard({
  config,
}: {
  readonly config: KnowledgeSearchConfig;
}): ReactElement {
  const { t } = useTranslation();
  const { index, settings } = config;
  const state = semanticStateOf(index, settings);
  const reason = index.reason ?? 'VECTOR_STORE_FAILED';
  const progress = index.building ?? index.active;
  const icon = {
    available: <CircleCheck className='size-4' />,
    unavailable: <CircleAlert className='size-4 text-destructive' />,
    off: <CircleDashed className='size-4' />,
    building: <LoaderCircle className='size-4' />,
  }[state];
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('knowledge.searchSettings.status.title')}</CardTitle>
        <CardDescription>
          {t('knowledge.searchSettings.status.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        <StatusRow
          icon={<CircleCheck className='size-4' />}
          label={t('knowledge.searchSettings.status.keyword')}
          state={
            <Badge variant='secondary'>
              {t('knowledge.searchSettings.status.available')}
            </Badge>
          }
        >
          {t('knowledge.searchSettings.status.keywordHint')}
        </StatusRow>
        <StatusRow
          icon={icon}
          label={t('knowledge.searchSettings.status.semantic')}
          state={
            <Badge
              variant={
                state === 'available'
                  ? 'secondary'
                  : state === 'unavailable'
                    ? 'destructive'
                    : 'outline'
              }
            >
              {t(`knowledge.searchSettings.status.${state}`)}
            </Badge>
          }
        >
          {state === 'unavailable' ? (
            <>
              <span>
                {t(`knowledge.searchSettings.reasons.${reason}.title`)}{' '}
                {t(`knowledge.searchSettings.reasons.${reason}.fix`)}
              </span>
              <a
                href={VECTOR_STORE_DOCS}
                target='_blank'
                rel='noreferrer'
                className='inline-flex w-fit items-center gap-1 text-primary underline-offset-4 hover:underline'
              >
                {t('knowledge.searchSettings.status.docs')}
                <ExternalLink className='size-3' />
              </a>
            </>
          ) : state === 'off' ? (
            t('knowledge.searchSettings.status.noModel')
          ) : state === 'building' ? (
            t('knowledge.searchSettings.status.buildingHint', {
              indexed: progress?.indexed ?? 0,
              total: progress?.total ?? 0,
            })
          ) : (
            t('knowledge.searchSettings.status.ready')
          )}
        </StatusRow>
      </CardContent>
    </Card>
  );
}

function IndexLine({
  label,
  index,
}: {
  readonly label: string;
  readonly index: KnowledgeIndexModel;
}): ReactElement {
  const percent =
    index.total > 0 ? Math.round((index.indexed / index.total) * 100) : 100;
  return (
    <div className='flex flex-col gap-1'>
      <span>{label}</span>
      <Progress
        value={percent}
        aria-label={label}
        className='w-64 max-w-full'
      />
    </div>
  );
}

function StoreSection({
  index,
}: {
  readonly index: KnowledgeIndexStatus;
}): ReactElement {
  const { t } = useTranslation();
  const type = index.store?.type;
  const typeLabel = !index.store
    ? t('knowledge.searchSettings.store.none')
    : type === 'sqlite-vec' || type === 'pgvector'
      ? t(`knowledge.searchSettings.store.types.${type}`)
      : index.store.type;
  const model = (entry: KnowledgeIndexModel) =>
    `${entry.modelService} · ${entry.model}`;
  return (
    <section className='flex flex-col gap-4' aria-labelledby='kb-search-store'>
      <SectionHeading
        id='kb-search-store'
        title={t('knowledge.searchSettings.store.title')}
        description={t('knowledge.searchSettings.store.description')}
      />
      <dl className='grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm'>
        <dt className='text-muted-foreground'>
          {t('knowledge.searchSettings.store.type')}
        </dt>
        <dd>{typeLabel}</dd>
        <dt className='text-muted-foreground'>
          {t('knowledge.searchSettings.store.state')}
        </dt>
        <dd>
          {index.available
            ? t('knowledge.searchSettings.status.available')
            : `${t('knowledge.searchSettings.status.unavailable')} · ${t(
                `knowledge.searchSettings.reasons.${index.reason ?? 'VECTOR_STORE_FAILED'}.title`,
              )}`}
        </dd>
        <dt className='text-muted-foreground'>
          {t('knowledge.searchSettings.store.index')}
        </dt>
        <dd className='flex flex-col gap-2'>
          {index.active ? (
            <IndexLine
              index={index.active}
              label={t('knowledge.searchSettings.store.ready', {
                indexed: index.active.indexed,
                total: index.active.total,
                model: model(index.active),
              })}
            />
          ) : null}
          {index.building ? (
            <IndexLine
              index={index.building}
              label={t('knowledge.searchSettings.store.buildingIndex', {
                indexed: index.building.indexed,
                total: index.building.total,
                model: model(index.building),
              })}
            />
          ) : null}
          {!index.active && !index.building ? (
            <span>{t('knowledge.searchSettings.store.noIndex')}</span>
          ) : null}
          {index.pending > 0 ? (
            <span className='text-muted-foreground'>
              {t('knowledge.searchSettings.store.pending', {
                count: index.pending,
              })}
            </span>
          ) : null}
          {index.failed > 0 ? (
            <span className='text-destructive'>
              {t('knowledge.searchSettings.store.failed', {
                count: index.failed,
              })}
            </span>
          ) : null}
        </dd>
      </dl>
      <p className='text-sm text-muted-foreground'>
        {t('knowledge.searchSettings.store.configNote')}{' '}
        {t('knowledge.searchSettings.store.restart')}
      </p>
      <pre className='overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs'>
        {CONFIG_SNIPPET}
      </pre>
    </section>
  );
}

function ModelSection({
  kind,
  config,
  options,
}: {
  readonly kind: 'embedding' | 'rerank';
  readonly config: KnowledgeSearchConfig;
  readonly options: readonly KnowledgeModelOption[];
}): ReactElement {
  const { t } = useTranslation();
  const save = useSaveSettings();
  return (
    <section
      className='flex flex-col gap-4'
      aria-labelledby={`kb-search-${kind}`}
    >
      <SectionHeading
        id={`kb-search-${kind}`}
        title={t(`knowledge.searchSettings.${kind}.title`)}
        description={t(`knowledge.searchSettings.${kind}.description`)}
      />
      <ModelSelect
        id={`kb-search-${kind}-model`}
        label={t(`knowledge.searchSettings.${kind}.title`)}
        options={options}
        value={config.settings[kind]}
        empty={t(`knowledge.searchSettings.${kind}.empty`)}
        disabled={!config.canManage || save.isPending}
        onChange={(next) => save.mutate({ [kind]: next })}
      />
    </section>
  );
}

function ContextualSection({
  config,
}: {
  readonly config: KnowledgeSearchConfig;
}): ReactElement {
  const { t } = useTranslation();
  const save = useSaveSettings();
  const saved = config.settings.contextModel;
  // On while a model is saved; switched on without one, the model picker shows until one is chosen.
  const [on, setOn] = useState(saved !== null);
  const enabled = on || saved !== null;
  const disabled = !config.canManage || save.isPending;
  const contextual = config.settings.contextual;
  return (
    <section
      className='flex flex-col gap-4'
      aria-labelledby='kb-search-context'
    >
      <SectionHeading
        id='kb-search-context'
        title={t('knowledge.searchSettings.contextual.title')}
        description={t('knowledge.searchSettings.contextual.description')}
      />
      <div className='flex items-center gap-3'>
        <Switch
          id='kb-search-context-on'
          checked={enabled}
          disabled={disabled}
          onCheckedChange={(next: boolean) => {
            setOn(next);
            if (!next && saved !== null) save.mutate({ contextModel: null });
          }}
        />
        <label htmlFor='kb-search-context-on' className='text-sm'>
          {t('knowledge.searchSettings.contextual.enable')}
        </label>
      </div>
      <p className='text-sm text-muted-foreground'>
        {t('knowledge.searchSettings.contextual.cost')}
      </p>
      {enabled ? (
        <>
          <ModelSelect
            id='kb-search-context-model'
            label={t('knowledge.searchSettings.contextual.model')}
            options={config.models.chat}
            value={saved}
            empty={t('knowledge.searchSettings.contextual.empty')}
            disabled={disabled}
            onChange={(contextModel) => {
              if (!contextModel) setOn(false);
              if (contextModel || saved) save.mutate({ contextModel });
            }}
          />
          <div className='flex flex-col gap-2'>
            <span className='text-sm font-medium'>
              {t('knowledge.searchSettings.contextual.spaces')}
            </span>
            {!saved ? (
              <p className='text-sm text-muted-foreground'>
                {t('knowledge.searchSettings.contextual.chooseModel')}
              </p>
            ) : config.spaces.length > 0 ? (
              <ul className='divide-y rounded-md border'>
                {config.spaces.map((space) => {
                  const title =
                    space.scope === SYSTEM_SCOPE
                      ? t('knowledge.spaces.system')
                      : space.title;
                  return (
                    <li
                      key={space.key}
                      className='flex items-center justify-between gap-3 px-3 py-2 text-sm'
                    >
                      <span className='truncate'>{title}</span>
                      <Switch
                        aria-label={t(
                          'knowledge.searchSettings.contextual.space',
                          { space: title },
                        )}
                        checked={contextual.includes(space.key)}
                        disabled={disabled}
                        onCheckedChange={(next: boolean) =>
                          save.mutate({
                            contextual: next
                              ? [...new Set([...contextual, space.key])]
                              : contextual.filter((key) => key !== space.key),
                          })
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className='text-sm text-muted-foreground'>
                {t('knowledge.searchSettings.contextual.noSpaces')}
              </p>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}

/** A number field of a settings section, with its label and hint. */
function NumberField({
  id,
  label,
  hint,
  value,
  step,
  invalid,
  disabled,
  onChange,
}: {
  readonly id: string;
  readonly label: string;
  readonly hint: string;
  readonly value: string;
  readonly step?: number;
  readonly invalid: boolean;
  readonly disabled: boolean;
  readonly onChange: (value: string) => void;
}): ReactElement {
  return (
    <div className='flex flex-col gap-1.5'>
      <label htmlFor={id} className='text-sm font-medium'>
        {label}
      </label>
      <Input
        id={id}
        className='w-40'
        type='number'
        inputMode='decimal'
        step={step}
        aria-invalid={invalid || undefined}
        aria-describedby={`${id}-hint`}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
      <p id={`${id}-hint`} className='text-xs text-muted-foreground'>
        {hint}
      </p>
    </div>
  );
}

const DEPTHS = ['1', '2', '3'] as const;

function ChunkingSection({
  config,
}: {
  readonly config: KnowledgeSearchConfig;
}): ReactElement {
  const { t } = useTranslation();
  const save = useSaveSettings();
  const saved = config.settings.chunking;
  const [depth, setDepth] = useState(String(saved.headingDepth));
  const [target, setTarget] = useState(String(saved.target));
  const [max, setMax] = useState(String(saved.max));
  const next = chunkingOf({
    headingDepth: Number(depth),
    target: Number(target),
    max: Number(max),
  });
  const changed =
    next !== null && JSON.stringify(next) !== JSON.stringify(saved);
  const disabled = !config.canManage || save.isPending;
  const depthItems = DEPTHS.map((value) => ({
    value,
    label: t(`knowledge.searchSettings.chunking.depths.${value}`),
  }));
  return (
    <section
      className='flex flex-col gap-4'
      aria-labelledby='kb-search-chunking'
    >
      <SectionHeading
        id='kb-search-chunking'
        title={t('knowledge.searchSettings.chunking.title')}
        description={t('knowledge.searchSettings.chunking.description')}
      />
      <form
        className='flex flex-col gap-4'
        onSubmit={(event) => {
          event.preventDefault();
          if (changed && next) save.mutate({ chunking: next });
        }}
      >
        <div className='flex flex-col gap-1.5'>
          <label
            htmlFor='kb-search-chunking-depth'
            className='text-sm font-medium'
          >
            {t('knowledge.searchSettings.chunking.depth')}
          </label>
          <Select
            items={depthItems}
            value={depth}
            disabled={disabled}
            onValueChange={(value: string | null) => value && setDepth(value)}
          >
            <SelectTrigger id='kb-search-chunking-depth' className='w-56'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {depthItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex flex-wrap gap-6'>
          <NumberField
            id='kb-search-chunking-target'
            label={t('knowledge.searchSettings.chunking.target')}
            hint={t('knowledge.searchSettings.chunking.targetHint')}
            value={target}
            invalid={next === null}
            disabled={disabled}
            onChange={setTarget}
          />
          <NumberField
            id='kb-search-chunking-max'
            label={t('knowledge.searchSettings.chunking.max')}
            hint={t('knowledge.searchSettings.chunking.maxHint')}
            value={max}
            invalid={next === null}
            disabled={disabled}
            onChange={setMax}
          />
        </div>
        {next === null ? (
          <p role='alert' className='text-sm text-destructive'>
            {t('knowledge.searchSettings.chunking.invalid')}
          </p>
        ) : null}
        {config.canManage ? (
          <Button
            type='submit'
            className='w-fit'
            disabled={!changed || save.isPending}
          >
            {t('knowledge.searchSettings.save')}
          </Button>
        ) : null}
      </form>
    </section>
  );
}

/** The recall settings as typed, or null when one is out of range. */
function recallOfInput(input: {
  readonly limit: string;
  readonly minScore: string;
  readonly keywordWeight: string;
  readonly rerankCandidates: string;
}): KnowledgeRecallSettings | null {
  const limit = Number(input.limit);
  const minScore = Number(input.minScore);
  const keywordWeight = Number(input.keywordWeight);
  const rerankCandidates = Number(input.rerankCandidates);
  const filled = Object.values(input).every((value) => value.trim() !== '');
  return filled &&
    Number.isInteger(limit) &&
    limit >= 1 &&
    limit <= 100 &&
    minScore >= 0 &&
    minScore <= 1 &&
    keywordWeight >= 0 &&
    keywordWeight <= 1 &&
    Number.isInteger(rerankCandidates) &&
    rerankCandidates >= 1 &&
    rerankCandidates <= 50
    ? { limit, minScore, keywordWeight, rerankCandidates }
    : null;
}

function RecallSection({
  config,
}: {
  readonly config: KnowledgeSearchConfig;
}): ReactElement {
  const { t } = useTranslation();
  const save = useSaveSettings();
  const saved = config.settings.recall;
  const [input, setInput] = useState({
    limit: String(saved.limit),
    minScore: String(saved.minScore),
    keywordWeight: String(saved.keywordWeight),
    rerankCandidates: String(saved.rerankCandidates),
  });
  const next = recallOfInput(input);
  const changed =
    next !== null && JSON.stringify(next) !== JSON.stringify(saved);
  const disabled = !config.canManage || save.isPending;
  const field = (name: keyof typeof input, step?: number): ReactElement => (
    <NumberField
      id={`kb-search-recall-${name}`}
      label={t(`knowledge.searchSettings.recall.${name}`)}
      hint={t(`knowledge.searchSettings.recall.${name}Hint`)}
      value={input[name]}
      step={step}
      invalid={next === null}
      disabled={disabled}
      onChange={(value) => setInput({ ...input, [name]: value })}
    />
  );
  return (
    <section className='flex flex-col gap-4' aria-labelledby='kb-search-recall'>
      <SectionHeading
        id='kb-search-recall'
        title={t('knowledge.searchSettings.recall.title')}
        description={t('knowledge.searchSettings.recall.description')}
      />
      <form
        className='flex flex-col gap-4'
        onSubmit={(event) => {
          event.preventDefault();
          if (changed && next) save.mutate({ recall: next });
        }}
      >
        <div className='grid gap-4 sm:grid-cols-2'>
          {field('limit', 1)}
          {field('minScore', 0.05)}
          {field('keywordWeight', 0.1)}
          {field('rerankCandidates', 1)}
        </div>
        {next === null ? (
          <p role='alert' className='text-sm text-destructive'>
            {t('knowledge.searchSettings.recall.invalid')}
          </p>
        ) : null}
        {config.canManage ? (
          <Button
            type='submit'
            className='w-fit'
            disabled={!changed || save.isPending}
          >
            {t('knowledge.searchSettings.save')}
          </Button>
        ) : null}
      </form>
    </section>
  );
}

function WholeSection({
  config,
}: {
  readonly config: KnowledgeSearchConfig;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const save = useSaveSettings();
  const [whole, setWhole] = useState(String(config.settings.wholeTokens));
  const value = Number(whole.trim());
  const valid =
    whole.trim() !== '' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= WHOLE_TOKENS_MAX;
  const changed = valid && value !== config.settings.wholeTokens;
  return (
    <section className='flex flex-col gap-4' aria-labelledby='kb-search-whole'>
      <SectionHeading
        id='kb-search-whole'
        title={t('knowledge.searchSettings.whole.title')}
        description={t('knowledge.searchSettings.whole.description')}
      />
      <form
        className='flex flex-wrap items-center gap-2'
        onSubmit={(event) => {
          event.preventDefault();
          if (changed) save.mutate({ wholeTokens: value });
        }}
      >
        <Input
          id='kb-search-whole-tokens'
          className='w-40'
          inputMode='numeric'
          aria-label={t('knowledge.searchSettings.whole.title')}
          aria-invalid={!valid}
          aria-describedby='kb-search-whole-hint'
          value={whole}
          disabled={!config.canManage || save.isPending}
          onChange={(event) => setWhole(event.target.value)}
        />
        <span
          id='kb-search-whole-hint'
          className='text-sm text-muted-foreground'
        >
          {!valid
            ? t('knowledge.searchSettings.whole.invalid')
            : value === 0
              ? t('knowledge.searchSettings.whole.off')
              : t('knowledge.searchSettings.whole.approx', {
                  value: approxTokens(value, i18n.language),
                })}
        </span>
        {config.canManage ? (
          <Button type='submit' disabled={!changed || save.isPending}>
            {t('knowledge.searchSettings.save')}
          </Button>
        ) : null}
      </form>
    </section>
  );
}

/** `/config/knowledge-search`. */
export default function KnowledgeSearchSettingsPage(): ReactElement {
  const { t } = useTranslation();
  const api = useStudioApi();
  const config = useQuery({
    queryKey: knowledgeSearchKey,
    queryFn: () => api.knowledgeSearch(),
    // While an index is being built, its progress is read again.
    refetchInterval: (query) =>
      query.state.data?.index.building || query.state.data?.index.pending
        ? BUILDING_POLL_MS
        : false,
  });
  const data = config.data;
  return (
    <section className='space-y-4' aria-labelledby='studio-config-kb-search'>
      <SettingsPageHeader
        id='studio-config-kb-search'
        title={t('config.nav.knowledgeSearch')}
        description={t('config.knowledgeSearch.description')}
        readOnly={data ? !data.canManage : false}
      />
      {data ? (
        <div className='flex flex-col gap-10 pt-2'>
          <StatusCard config={data} />
          <StoreSection index={data.index} />
          <ModelSection
            kind='embedding'
            config={data}
            options={data.models.embedding}
          />
          <ModelSection
            kind='rerank'
            config={data}
            options={data.models.rerank}
          />
          <RecallSection
            key={JSON.stringify(data.settings.recall)}
            config={data}
          />
          <ChunkingSection
            key={JSON.stringify(data.settings.chunking)}
            config={data}
          />
          {/* Each starts again from what the server answered once a change of its own is saved. */}
          <ContextualSection
            key={valueOf(data.settings.contextModel)}
            config={data}
          />
          <WholeSection key={data.settings.wholeTokens} config={data} />
        </div>
      ) : (
        <div
          className='flex flex-col gap-4 pt-2'
          role='status'
          aria-label={t('common.loading')}
        >
          <Skeleton className='h-40 w-full' />
          <Skeleton className='h-24 w-full' />
        </div>
      )}
    </section>
  );
}
