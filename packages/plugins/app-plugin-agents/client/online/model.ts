/**
 * The model services UI without React: the services in list order, a new service's title, a service's models as one
 * list, and the base URL as it is checked, saved and shown.
 */
import {
  guessModelKind,
  MODEL_KINDS,
  MODEL_PROVIDERS,
  providerOf,
  type ModelKind,
  type ModelOption,
  type ModelProviderOption,
  type ModelServiceView,
  type ProviderModel,
} from '../../shared/models.js';

/** The services grouped by provider type in the order `MODEL_PROVIDERS` lists them, each provider's as added. */
export function sortServices(
  services: readonly ModelServiceView[],
): ModelServiceView[] {
  const rank = (service: ModelServiceView) =>
    MODEL_PROVIDERS.findIndex((provider) => provider.name === service.provider);
  return services
    .map((service, index) => ({ service, index }))
    .sort((a, b) => rank(a.service) - rank(b.service) || a.index - b.index)
    .map(({ service }) => service);
}

/** The title a new service of `provider` is given: the provider's, numbered when a service has it already. */
export function newServiceTitle(
  provider: ModelProviderOption,
  services: readonly ModelServiceView[],
): string {
  const taken = new Set(services.map((service) => service.title));
  if (!taken.has(provider.title)) return provider.title;
  for (let n = 2; ; n += 1) {
    const title = `${provider.title} ${n}`;
    if (!taken.has(title)) return title;
  }
}

/** One row of a service's model list: its id, whether the service offers it, and its kind (as set, or as guessed). */
export interface ModelRow {
  readonly id: string;
  readonly on: boolean;
  readonly kind: ModelKind;
}

/**
 * A service's models as one list: those it offers (on, with their kind), in order, then those the provider lists that
 * it does not (with the kind their id suggests).
 */
export function modelRows(
  offered: readonly ModelOption[],
  listed: readonly ProviderModel[],
): ModelRow[] {
  const rows: ModelRow[] = offered.map((model) => ({
    id: model.value,
    on: true,
    kind: model.kind,
  }));
  const seen = new Set(rows.map((row) => row.id));
  for (const model of listed)
    if (!seen.has(model.id)) {
      seen.add(model.id);
      rows.push({ id: model.id, on: false, kind: model.kind });
    }
  return rows;
}

/** The kind a model id suggests, among those the provider serves (`guessModelKind`). */
export function guessKind(
  id: string,
  provider: ModelProviderOption | null,
): ModelKind {
  return guessModelKind(id, provider?.kinds ?? ['chat']);
}

/** The models with `id` turned on (at the end, of `kind` or the kind its id suggests) or off. */
export function toggleModel(
  models: readonly ModelOption[],
  id: string,
  on: boolean,
  provider: ModelProviderOption | null = null,
  kind?: ModelKind,
): ModelOption[] {
  const value = id.trim();
  if (!value) return [...models];
  const without = models.filter((model) => model.value !== value);
  return on
    ? [
        ...without,
        {
          value,
          label: value,
          kind:
            kind && (provider?.kinds ?? ['chat']).includes(kind)
              ? kind
              : guessKind(value, provider),
          dimensions: null,
        },
      ]
    : without;
}

/** The models with `id` made a model of `kind`; only an embedding model keeps its dimensions. */
export function setModelKind(
  models: readonly ModelOption[],
  id: string,
  kind: ModelKind,
): ModelOption[] {
  return models.map((model) =>
    model.value === id
      ? {
          ...model,
          kind,
          dimensions: kind === 'embedding' ? model.dimensions : null,
        }
      : model,
  );
}

/** The models with the embedding model `id` asking for vectors of `text` dimensions (empty: the model's own). */
export function setModelDimensions(
  models: readonly ModelOption[],
  id: string,
  text: string,
): ModelOption[] {
  const parsed = Number.parseInt(text.trim(), 10);
  const dimensions =
    Number.isInteger(parsed) && parsed >= 1 && parsed <= 8192 ? parsed : null;
  return models.map((model) =>
    model.value === id && model.kind === 'embedding'
      ? { ...model, dimensions }
      : model,
  );
}

/** How many models of each kind a service offers, in `MODEL_KINDS` order, the kinds it has none of left out. */
export function kindCounts(
  models: readonly ModelOption[],
): { readonly kind: ModelKind; readonly count: number }[] {
  return MODEL_KINDS.map((kind) => ({
    kind,
    count: models.filter((model) => model.kind === kind).length,
  })).filter((entry) => entry.count > 0);
}

/** The model the connection test tries: the first chat model, else the first model of any kind. */
export function testModelOf(
  models: readonly ModelOption[],
): ModelOption | null {
  return models.find((model) => model.kind === 'chat') ?? models[0] ?? null;
}

/** Whether a base URL can be saved: empty (the provider's default) or an http(s) address. */
export function validBaseUrl(value: string): boolean {
  const url = value.trim();
  return !url || /^https?:\/\/\S+$/iu.test(url);
}

/** The base URL to send: null when it is empty or the provider's default. */
export function baseUrlOf(
  value: string,
  provider: ModelProviderOption | null,
): string | null {
  const url = value.trim();
  return !url || url === provider?.defaultBaseUrl ? null : url;
}

/** The host a service calls, as the list shows it: its own base URL's, else its provider's default's; null for none. */
export function hostOf(service: ModelServiceView): string | null {
  const provider = providerOf(service.provider);
  const url = service.baseUrl ?? provider?.defaultBaseUrl ?? null;
  if (!url) return null;
  try {
    return new URL(url).host || url;
  } catch {
    return url;
  }
}

/** A service's state in the list: off, missing what it needs to answer, or on. */
export type ServiceStatus = 'off' | 'noKey' | 'noModels' | 'on';

export function serviceStatus(service: ModelServiceView): ServiceStatus {
  if (!service.enabled) return 'off';
  if (!service.apiKeySet && providerOf(service.provider)?.keyRequired)
    return 'noKey';
  if (service.models.length === 0) return 'noModels';
  return 'on';
}
