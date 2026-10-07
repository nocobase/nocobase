/**
 * Model prices (`agModelPrices`, each of one source: a model service for chat, a coding tool for work), the coding tools
 * paid by subscription (`agToolSubscriptions`), and the arithmetic of cost: what a usage record costs at its price. Prices are per million tokens; a usage record's tokens are disjoint (input excludes
 * cached input, output includes reasoning), so each is charged at its own rate.
 */
import type { DatabaseConnection } from '@nocobase/db';
import { z } from 'zod';

import { AGENT_TOOLS } from '@nocobase/agent-protocol';

import {
  ONLINE_TOOL,
  DEFAULT_CURRENCY,
  type ModelPrice,
  type ModelPriceInput,
  type PriceBook,
  type PricesAnswer,
  type PricesInput,
  type SeenModel,
} from '../../../shared/reports.js';
import type { Clock } from '../../kernel/clock.js';
import { invalid } from '../../kernel/errors.js';
import type { IdSource } from '../../kernel/ids.js';
import type { TxRunner } from '../../kernel/tx.js';

const PRICES = 'agModelPrices';
const SUBSCRIPTIONS = 'agToolSubscriptions';

interface PriceRecord {
  readonly id: string;
  readonly tool: string;
  readonly modelService: string | null;
  readonly model: string;
  readonly inputPerM: number | string;
  readonly outputPerM: number | string;
  readonly cacheReadPerM: number | string;
  readonly cacheWritePerM: number | string;
  readonly currency: string;
  readonly note: string | null;
  readonly createdAt: Date | string;
  readonly updatedAt: Date | string;
}

/** The tokens of one usage record that cost money. */
export interface PricedTokens {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheReadTokens: number;
  readonly cacheWriteTokens: number;
}

const amount = z.number().finite().min(0).max(1_000_000);

const TOOLS = [ONLINE_TOOL, ...AGENT_TOOLS] as const;

export const ModelPriceInputSchema: z.ZodType<ModelPriceInput> = z
  .strictObject({
    tool: z.enum(TOOLS),
    modelService: z.string().trim().min(1).max(64).nullable().optional(),
    model: z.string().trim().min(1).max(200),
    inputPerM: amount,
    outputPerM: amount,
    cacheReadPerM: amount.optional(),
    cacheWritePerM: amount.optional(),
    currency: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{3}$/u)
      .optional(),
    note: z.string().trim().max(500).nullable().optional(),
  })
  .refine(
    (input) => (input.tool === ONLINE_TOOL) === Boolean(input.modelService),
    {
      message:
        'A chat price names its model service; a coding tool’s names none.',
    },
  );

export const ModelPricesSchema: z.ZodType<PricesInput> = z.strictObject({
  prices: z.array(ModelPriceInputSchema).max(2000),
  subscriptions: z.array(z.enum(AGENT_TOOLS)).max(AGENT_TOOLS.length),
});

function toPrice(row: PriceRecord): ModelPrice {
  return {
    id: row.id,
    tool: row.tool,
    modelService: row.modelService ?? null,
    model: row.model,
    inputPerM: Number(row.inputPerM),
    outputPerM: Number(row.outputPerM),
    cacheReadPerM: Number(row.cacheReadPerM),
    cacheWritePerM: Number(row.cacheWritePerM),
    currency: row.currency,
    note: row.note,
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

/** The prices and the coding tools paid by subscription, as costs are worked out from them. */
export async function listPrices(conn: DatabaseConnection): Promise<PriceBook> {
  const rows = await conn.repository<PriceRecord>(PRICES).findMany({
    sort: (sort) => [sort.field('tool').asc(), sort.field('model').asc()],
  });
  const subscribed = await conn
    .repository<{ readonly tool: string }>(SUBSCRIPTIONS)
    .findMany({ sort: (sort) => [sort.field('tool').asc()] });
  return {
    prices: rows.map(toPrice),
    subscriptions: subscribed.map((row) => row.tool),
  };
}

/** The models coding tools reported in runs, each once, so they can be priced. */
async function seenModels(conn: DatabaseConnection): Promise<SeenModel[]> {
  const rows = await conn
    .repository<{
      readonly id: string;
      readonly tool: string;
      readonly model: string | null;
    }>('agRunUsage')
    .findMany({
      filter: (f) =>
        f.and([f.string('tool').ne(ONLINE_TOOL), f.string('model').notEmpty()]),
      distinct: ['tool', 'model'],
      sort: (sort) => [
        sort.field('tool').asc(),
        sort.field('model').asc(),
        sort.field('id').asc(),
      ],
    });
  return rows.flatMap((row) =>
    row.model ? [{ tool: row.tool, model: row.model }] : [],
  );
}

async function answer(conn: DatabaseConnection): Promise<PricesAnswer> {
  const book = await listPrices(conn);
  return {
    items: [...book.prices],
    subscriptions: [...book.subscriptions],
    seen: await seenModels(conn),
  };
}

/** A price's key: its source and model; the same model may be priced once per source. */
function keyOf(
  price: Pick<ModelPrice, 'tool' | 'modelService' | 'model'>,
): string {
  return [
    price.tool,
    price.modelService ?? '',
    price.model.trim().toLowerCase(),
  ].join('\n');
}

/** What `tokens` cost at `price`, in its currency. */
export function costOf(price: ModelPrice, tokens: PricedTokens): number {
  return (
    (tokens.inputTokens * price.inputPerM +
      tokens.outputTokens * price.outputPerM +
      tokens.cacheReadTokens * price.cacheReadPerM +
      tokens.cacheWriteTokens * price.cacheWritePerM) /
    1_000_000
  );
}

export interface PriceService {
  list(): Promise<PricesAnswer>;
  /** Replaces the whole table and the subscriptions; a model may appear once per source. */
  replace(input: PricesInput): Promise<PricesAnswer>;
}

export function createPriceService(deps: {
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly clock: Clock;
}): PriceService {
  return {
    list: () => answer(deps.tx.read()),
    async replace({ prices: inputs, subscriptions }) {
      const seen = new Set<string>();
      for (const input of inputs) {
        const key = keyOf({
          ...input,
          modelService: input.modelService ?? null,
        });
        if (seen.has(key))
          throw invalid(
            `The model ${input.model.trim()} is priced twice at one source.`,
          );
        seen.add(key);
      }
      return deps.tx.run(async ({ conn }) => {
        const now = deps.clock.now().toISOString();
        const repo = conn.repository<PriceRecord>(PRICES);
        const existing = new Map(
          (await repo.findMany({})).map((row) => [keyOf(row), row]),
        );
        const kept = new Set<string>();
        for (const input of inputs) {
          const model = input.model.trim();
          const modelService =
            input.tool === ONLINE_TOOL
              ? (input.modelService?.trim() ?? null)
              : null;
          const values = {
            inputPerM: input.inputPerM,
            outputPerM: input.outputPerM,
            cacheReadPerM: input.cacheReadPerM ?? 0,
            cacheWritePerM: input.cacheWritePerM ?? 0,
            currency: (input.currency ?? DEFAULT_CURRENCY).toUpperCase(),
            note: input.note?.trim() || null,
          };
          const row = existing.get(
            keyOf({ tool: input.tool, modelService, model }),
          );
          if (row) {
            kept.add(row.id);
            const changed = (
              Object.keys(values) as (keyof typeof values)[]
            ).some((key) =>
              typeof values[key] === 'number'
                ? Number(row[key]) !== values[key]
                : row[key] !== values[key],
            );
            if (changed)
              await repo.updateMany({
                filter: { id: row.id },
                values: { ...values, updatedAt: now },
              });
          } else
            await repo.createOne({
              values: {
                id: deps.ids.next(),
                tool: input.tool,
                modelService,
                model,
                ...values,
                createdAt: now,
                updatedAt: now,
              },
            });
        }
        for (const row of existing.values())
          if (!kept.has(row.id))
            await repo.deleteMany({ filter: { id: row.id } });
        const tools = conn.repository<{
          readonly tool: string;
          readonly createdAt: string;
        }>(SUBSCRIPTIONS);
        const wanted = new Set(subscriptions);
        const had = new Set((await tools.findMany({})).map((row) => row.tool));
        for (const tool of had)
          if (!wanted.has(tool)) await tools.deleteMany({ filter: { tool } });
        for (const tool of wanted)
          if (!had.has(tool))
            await tools.createOne({ values: { tool, createdAt: now } });
        return answer(conn);
      });
    },
  };
}
