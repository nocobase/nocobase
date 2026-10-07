/**
 * Agent team › Usage › Prices without React: what is priced, and the price table as it is edited one row at a time. A
 * price belongs to a source and a model (`@nocobase/app-plugin-agents/shared/reports`): an online model's to its model
 * service, so (service, model); a coding tool's to the tool, so (tool, model).
 */
import { AGENT_TOOLS, type AgentTool } from '@nocobase/agent-protocol';
import {
  ONLINE_TOOL,
  type ModelPrice,
  type ModelPriceInput,
  type PricesAnswer,
  type PricesInput,
} from '../../../../shared/reports.js';
import type { ModelServiceView } from '../../../../shared/models.js';

export { AGENT_TOOLS, type AgentTool };

/** A price's source and model. */
export interface PriceKey {
  readonly tool: string;
  readonly modelService: string | null;
  readonly model: string;
}

export const onlineKey = (modelService: string, model: string): PriceKey => ({
  tool: ONLINE_TOOL,
  modelService,
  model,
});

export const toolKey = (tool: AgentTool, model: string): PriceKey => ({
  tool,
  modelService: null,
  model,
});

function sameKey(price: PriceKey, key: PriceKey): boolean {
  return (
    price.tool === key.tool &&
    (price.modelService ?? null) === key.modelService &&
    price.model.trim().toLowerCase() === key.model.trim().toLowerCase()
  );
}

/** The price saved for exactly this source and model, or null. */
export function exactPrice(
  prices: readonly ModelPrice[],
  key: PriceKey,
): ModelPrice | null {
  return prices.find((price) => sameKey(price, key)) ?? null;
}

function inputOf(price: ModelPrice): ModelPriceInput {
  return {
    tool: price.tool,
    modelService: price.modelService,
    model: price.model,
    inputPerM: price.inputPerM,
    outputPerM: price.outputPerM,
    cacheReadPerM: price.cacheReadPerM,
    cacheWritePerM: price.cacheWritePerM,
    currency: price.currency,
    note: price.note,
  };
}

/**
 * The table with one row set: its input and output prices replaced (what else the row had is kept), or the row added.
 * The other rows and the subscriptions stay as they are.
 */
export function withPrice(
  answer: PricesAnswer,
  key: PriceKey,
  amounts: { readonly inputPerM: number; readonly outputPerM: number },
): PricesInput {
  let found = false;
  const prices = answer.items.map((price) => {
    if (!sameKey(price, key)) return inputOf(price);
    found = true;
    return { ...inputOf(price), ...amounts };
  });
  if (!found)
    prices.push({
      tool: key.tool,
      modelService: key.modelService,
      model: key.model.trim(),
      ...amounts,
    });
  return { prices, subscriptions: answer.subscriptions };
}

/** The table without one row. */
export function withoutPrice(answer: PricesAnswer, key: PriceKey): PricesInput {
  return {
    prices: answer.items.filter((price) => !sameKey(price, key)).map(inputOf),
    subscriptions: answer.subscriptions,
  };
}

/** The table with `tool` paid by subscription, or not. */
export function withSubscription(
  answer: PricesAnswer,
  tool: AgentTool,
  on: boolean,
): PricesInput {
  const rest = answer.subscriptions.filter((item) => item !== tool);
  return {
    prices: answer.items.map(inputOf),
    subscriptions: on ? [...rest, tool] : rest,
  };
}

/** A coding tool's own prices, its patterns among them. */
export function toolPrices(
  prices: readonly ModelPrice[],
  tool: AgentTool,
): ModelPrice[] {
  return prices.filter(
    (price) => price.tool === tool && price.modelService === null,
  );
}

/** A typed amount: empty counts as 0; null when it is not a number of 0 or more. */
export function parseAmount(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const number = Number(trimmed);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

/** An amount as an input shows it: `3`, `0.075`. */
export function amountText(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : String(Number(value.toFixed(6)));
}

/** The (service, model) pairs online agents may use, so the ones priced: each enabled service's models, in order. */
export function onlinePairs(
  services: readonly ModelServiceView[],
): { readonly service: ModelServiceView; readonly models: string[] }[] {
  return services
    .filter((service) => service.enabled && service.models.length > 0)
    .map((service) => ({
      service,
      models: service.models.map((model) => model.value),
    }));
}
