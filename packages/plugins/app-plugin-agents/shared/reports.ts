/**
 * What runs used and cost, as the reporting service answers it (`agents.reporting`), and the model prices costs are
 * estimated from. Costs are never stored: they are worked out from the prices whenever a report is read, so changing
 * a price changes every report. This plugin serves the prices and the usage report over HTTP (`USAGE_ROUTE`, for its
 * usage page); the application builds its other reports on the reporting service.
 */

/**
 * `GET`: `from`, `to`, `groupBy`, `groupId`, `agentId`, `userId`, `series` → `{ data: UsageReport }`. Needs the usage
 * page's grant.
 */
export const USAGE_ROUTE = 'agents/usage';

/**
 * How the usage report groups runs; `person` is who woke the agent (the run's actor), `group` the group a run's subject
 * belongs to (`SubjectFacts.group`), `subject` the subject itself, `type` the agent's type (`online` or `runner`; an online
 * run's `tool` is `online`).
 */
export const USAGE_GROUP_BYS = [
  'agent',
  'person',
  'group',
  'subject',
  'day',
  'model',
  'tool',
  'type',
] as const;

export type UsageGroupBy = (typeof USAGE_GROUP_BYS)[number];

/** A report covers at most this many days; without a range, the last `DEFAULT_REPORT_DAYS`. */
export const MAX_REPORT_DAYS = 366;
export const DEFAULT_REPORT_DAYS = 30;

/** The currency of a price that names none. */
export const DEFAULT_CURRENCY = 'USD';

/** The `tool` of an online run's usage: its model calls go through a model service, which is the price's source. */
export const ONLINE_TOOL = 'online';

/**
 * What a model costs per million tokens at one source. A price belongs to a source and a model together, since the same
 * model costs differently at different providers and through different coding tools:
 *
 * - Online (`tool` `online`): the model service the run called (`modelService`); `model` is the model id, matched exactly.
 * - Runner (`tool` a coding tool such as `claude` or `codex`, `modelService` null): `model` is an id or a glob (`*` for any
 *   run of characters, case-insensitive); the most specific match wins (an exact id, then the pattern with the most
 *   literal characters). A model reported as `provider/id` or with a `[…]` suffix (`claude-opus-5-5[1m]`) is matched
 *   without them as well.
 *
 * A price never applies to another source.
 */
export interface ModelPrice {
  readonly id: string;
  readonly tool: string;
  readonly modelService: string | null;
  readonly model: string;
  readonly inputPerM: number;
  readonly outputPerM: number;
  readonly cacheReadPerM: number;
  readonly cacheWritePerM: number;
  /** ISO 4217, such as `USD`. */
  readonly currency: string;
  readonly note: string | null;
  readonly updatedAt: string;
}

/** A row of `PUT /prices`, which replaces the whole table. */
export interface ModelPriceInput {
  readonly tool: string;
  /** The model service of a chat price; absent or null for a coding tool's. */
  readonly modelService?: string | null;
  readonly model: string;
  readonly inputPerM: number;
  readonly outputPerM: number;
  readonly cacheReadPerM?: number;
  readonly cacheWritePerM?: number;
  readonly currency?: string;
  readonly note?: string | null;
}

/** What costs are worked out from: the prices, and the coding tools paid by subscription, whose runs cost nothing. */
export interface PriceBook {
  readonly prices: readonly ModelPrice[];
  readonly subscriptions: readonly string[];
}

/** A coding tool's model that runs reported, so it can be priced. */
export interface SeenModel {
  readonly tool: string;
  readonly model: string;
}

/** `GET /prices` and the answer of `PUT /prices`. */
export interface PricesAnswer {
  readonly items: ModelPrice[];
  /** The coding tools paid by subscription. */
  readonly subscriptions: string[];
  /** The models coding tools reported in runs, each once. */
  readonly seen: SeenModel[];
}

/** `PUT agents/prices`: the whole table and the coding tools paid by subscription. */
export interface PricesInput {
  readonly prices: readonly ModelPriceInput[];
  readonly subscriptions: readonly string[];
}

/** What a usage record is priced by. */
export interface PricedSource {
  readonly tool: string;
  readonly modelService: string | null;
  readonly model: string | null;
}

/** Whether `price` belongs to the source of `usage` (the tool, and for chat the model service). */
export function sameSource(
  price: Pick<ModelPrice, 'tool' | 'modelService'>,
  usage: Pick<PricedSource, 'tool' | 'modelService'>,
): boolean {
  if (price.tool !== usage.tool) return false;
  return usage.tool === ONLINE_TOOL
    ? price.modelService !== null && price.modelService === usage.modelService
    : price.modelService === null;
}

function globToRegExp(glob: string): RegExp {
  const escaped = glob
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/gu, '\\$&'))
    .join('.*');
  return new RegExp(`^${escaped}$`, 'iu');
}

/** How specific a pattern is: an exact id beats any glob, then the more literal characters the better. */
function specificity(pattern: string): number {
  return pattern.includes('*')
    ? pattern.replaceAll('*', '').length
    : Number.MAX_SAFE_INTEGER;
}

/**
 * The names a reported model is matched by: as reported, without a `provider/` prefix (OpenCode reports
 * `anthropic/claude-sonnet-4-5`), and without a bracketed suffix (Claude Code reports `claude-opus-5-5[1m]`).
 */
export function modelNames(model: string): string[] {
  const names = [model.trim()];
  const slash = names[0].lastIndexOf('/');
  if (slash >= 0) names.push(names[0].slice(slash + 1));
  for (const name of [...names]) {
    const bare = name.replace(/\[[^\]]*\]$/u, '').trim();
    if (bare !== name) names.push(bare);
  }
  return [...new Set(names.filter(Boolean))];
}

/** The price of a coding tool paid by subscription: nothing. */
function subscriptionPrice(tool: string): ModelPrice {
  return {
    id: `subscription:${tool}`,
    tool,
    modelService: null,
    model: '*',
    inputPerM: 0,
    outputPerM: 0,
    cacheReadPerM: 0,
    cacheWritePerM: 0,
    currency: DEFAULT_CURRENCY,
    note: null,
    updatedAt: '',
  };
}

/**
 * The price that applies to what `usage` used, or null. Only prices of its source count. An online model matches its id
 * exactly (case-insensitive); a coding tool's model is matched by the most specific pattern matching any of its names,
 * and costs nothing when the tool is paid by subscription.
 */
export function priceFor(
  book: PriceBook,
  usage: PricedSource,
): ModelPrice | null {
  if (!usage.model) return null;
  if (usage.tool !== ONLINE_TOOL && book.subscriptions.includes(usage.tool))
    return subscriptionPrice(usage.tool);
  const candidates = book.prices.filter((price) => sameSource(price, usage));
  if (usage.tool === ONLINE_TOOL) {
    const model = usage.model.trim().toLowerCase();
    return (
      candidates.find((price) => price.model.trim().toLowerCase() === model) ??
      null
    );
  }
  const names = modelNames(usage.model);
  let best: ModelPrice | null = null;
  let bestScore = -1;
  for (const price of candidates) {
    const pattern = globToRegExp(price.model);
    if (!names.some((name) => pattern.test(name))) continue;
    const score = specificity(price.model);
    if (score > bestScore) {
      best = price;
      bestScore = score;
    }
  }
  return best;
}

/** How a source and model read in a report: `model (source)`, the source being the model service or the coding tool. */
export function sourceLabel(usage: PricedSource): string {
  const source =
    usage.tool === ONLINE_TOOL
      ? (usage.modelService ?? ONLINE_TOOL)
      : usage.tool;
  return `${usage.model ?? ''} (${source})`;
}

/** An amount per currency; a report adds amounts of one currency only. */
export type Costs = Readonly<Record<string, number>>;

/** Usage of a group of runs: tokens of every model, the runs' working time, and their cost where a price matched. */
export interface UsageRow {
  readonly key: string;
  /** What a person reads for the key (an agent's or a person's name, a subject's label); null when unknown. */
  readonly name: string | null;
  readonly runs: number;
  /** The runs' time from start to finish, added up. */
  readonly durationMs: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheReadTokens: number;
  readonly cacheWriteTokens: number;
  /** Of the output tokens, those spent reasoning (already in `outputTokens`). */
  readonly reasoningTokens: number;
  /** Null when no model of the group has a price. */
  readonly cost: Costs | null;
  /** Runs whose every model had a price. */
  readonly pricedRuns: number;
}

/** What one group (a row's `key`) used on one day. */
export interface UsageSeriesPoint {
  readonly key: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheReadTokens: number;
  readonly cacheWriteTokens: number;
  readonly cost: Costs | null;
}

/** One day of the usage chart. */
export interface UsagePoint {
  readonly day: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheReadTokens: number;
  readonly cacheWriteTokens: number;
  readonly cost: Costs | null;
  /** The day by `groupBy` key, when the query asked for `series`. */
  readonly series?: readonly UsageSeriesPoint[];
}

/** `reporting.usage`. */
export interface UsageReport {
  /** `YYYY-MM-DD`, both inclusive (UTC). */
  readonly from: string;
  readonly to: string;
  readonly groupBy: UsageGroupBy;
  readonly rows: readonly UsageRow[];
  readonly totals: UsageRow;
  readonly daily: readonly UsagePoint[];
  /** Models that ran without a matching price at their source (`sourceLabel`), so their tokens add no cost. */
  readonly unpricedModels: readonly string[];
}

export interface UsageQuery {
  readonly from?: string;
  readonly to?: string;
  readonly groupBy?: UsageGroupBy;
  /** Only runs on subjects of this group. */
  readonly groupId?: string;
  readonly agentId?: string;
  readonly userId?: string;
  /** Also break each day of `daily` down by the `groupBy` key (`UsagePoint.series`). */
  readonly series?: boolean;
}

/**
 * What the runs started in a range say (`reporting.runFigures`), over the runs the caller counts: how they went, how
 * fast runners took them, what they cost, and when and for whom they ran. The application adds what its subjects say
 * to make its own metrics.
 */
export interface RunFigures {
  readonly runs: number;
  readonly completedRuns: number;
  readonly failedRuns: number;
  readonly failuresByReason: Readonly<Record<string, number>>;
  /** Created → dispatched (time to first claim). */
  readonly claimLatencyP50Ms: number | null;
  readonly claimLatencyP95Ms: number | null;
  /** Started → finished, of runs that completed or failed. */
  readonly runDurationP50Ms: number | null;
  /** Held by a runner with nothing reported for three hours. */
  readonly lostRuns: number;
  /** Of the usage reported in the range. */
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly estimatedCost: Costs | null;
  /** By cost, unpriced last. */
  readonly costByAgent: readonly {
    readonly agentId: string;
    readonly name: string | null;
    readonly cost: Costs | null;
  }[];
  /** The usage reported in the range by the agents' type: `online` and `runner`, each when it has any. */
  readonly usageByType: readonly {
    readonly type: 'online' | 'runner';
    readonly runs: number;
    readonly inputTokens: number;
    readonly outputTokens: number;
    readonly cacheReadTokens: number;
    readonly cost: Costs | null;
  }[];
  /** `YYYY-MM-DD` days a counted run started on. */
  readonly activityDays: readonly string[];
  /**
   * Day by day, oldest first, every day of the range: the counted runs started that day by how they ended so far, and
   * the cost of the usage reported that day by agent type (null where nothing was priced).
   */
  readonly daily: readonly RunDay[];
  /** The people who woke the counted runs. */
  readonly actorIds: readonly string[];
}

/**
 * A run as the application's own reports read it (`reporting.runRecords`): what it worked on, how it ended so far and
 * when each step happened. Only runs the caller counts, on subjects they may see.
 */
export interface ReportRun {
  readonly id: string;
  readonly agentId: string;
  readonly subjectKind: string;
  readonly subjectId: string;
  /** `queued`, `dispatched`, `running`, `completed`, `failed` or `cancelled`. */
  readonly status: string;
  readonly failureReason: string | null;
  /** The run this one retries, when it is a retry. */
  readonly retryOfRunId: string | null;
  /** When it was queued. */
  readonly createdAt: string;
  /** When a runner, or the server, claimed it. */
  readonly dispatchedAt: string | null;
  readonly startedAt: string | null;
  readonly finishedAt: string | null;
}

/** Which runs `reporting.runRecords` reads: started in a range, on some subjects, or both. */
export interface ReportRunQuery {
  /** Queued on or after this time. */
  readonly start?: Date;
  /** Queued before this time. */
  readonly end?: Date;
  /** Only runs on these subjects of one kind; none when `ids` is empty. */
  readonly subjects?: {
    readonly kind: string;
    readonly ids: readonly string[];
  };
  /** Only runs on subjects of this group; null for every group. */
  readonly groupId: string | null;
}

/** One day of `RunFigures.daily`. */
export interface RunDay {
  readonly day: string;
  readonly completed: number;
  readonly failed: number;
  readonly cancelled: number;
  /** Queued, dispatched or running still. */
  readonly open: number;
  readonly onlineCost: Costs | null;
  readonly runnerCost: Costs | null;
}

/**
 * `GET`: `from`, `to` → `{ data: ModelUsageReport }`. Needs the usage page's grant; only a reader of every run
 * (`agents.agents` read) sees rows, since this use belongs to no one's run.
 */
export const MODEL_USAGE_ROUTE = 'agents/usage/models';

/** What a model call outside any run was for. */
export type ModelUsagePurpose = 'embedding' | 'rerank' | 'text';

export const MODEL_USAGE_PURPOSES: readonly ModelUsagePurpose[] = [
  'embedding',
  'rerank',
  'text',
];

/** What model calls outside runs used, for one purpose, caller (`source`) and model, with its cost where priced. */
export interface ModelUsageRow {
  readonly purpose: ModelUsagePurpose;
  /** Who asked, as the application names it (such as `knowledge`). */
  readonly source: string;
  readonly modelService: string;
  readonly model: string;
  readonly calls: number;
  /** Texts embedded, or documents reranked. */
  readonly units: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  /** Null when the model has no price at its service. */
  readonly cost: Costs | null;
}

export interface ModelUsageReport {
  readonly from: string;
  readonly to: string;
  readonly rows: readonly ModelUsageRow[];
}
