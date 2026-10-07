/**
 * Between an environment's stored settings and a driver form's inputs: `decodeDriverForm` fills the inputs (stored
 * values, else the field's default), `encodeDriverForm` writes them back. Encoding starts from a copy of the stored
 * settings, so keys the form does not know survive; a value equal to its default, an empty input and a field that is
 * not shown are left out, so the stored settings stay what someone chose rather than every default. Credentials are
 * never read: the form knows only which are set (`secretKeys`) and sends the ones replaced or cleared.
 *
 * Pure and React-free, so a driver package can test its form against its own settings parser.
 */
import type {
  DriverFormCondition,
  DriverFormDescription,
  DriverFormField,
  DriverFormGroup,
  DriverFormValues,
} from './types.js';

/** A write-only credential's input: kept as stored, replaced by `value`, or removed. */
export interface SecretInput {
  readonly mode: 'keep' | 'replace' | 'clear';
  readonly value: string;
}

export interface DriverFormState {
  /** Inputs of every field but credentials and facts, by field ID. */
  readonly values: DriverFormValues;
  /** Optional groups switched on, by group ID. */
  readonly toggles: Readonly<Record<string, boolean>>;
  /** Credential inputs, by field ID. */
  readonly secrets: Readonly<Record<string, SecretInput>>;
}

export interface DriverFormSource {
  readonly config: Readonly<Record<string, unknown>>;
  /** Names of the stored credentials. */
  readonly secretKeys?: readonly string[];
  readonly publicUrl?: string | null;
}

export interface DriverFormOutput {
  readonly config: Record<string, unknown>;
  /** Credentials to replace (a value) or remove (null); the others are kept. */
  readonly secretChanges: Record<string, unknown>;
  /** The public URL pattern, when the form has that field; undefined leaves it alone. */
  readonly publicUrl: string | null | undefined;
  /** Why an input cannot be saved, as `ui.driverForm.errors.*` keys of the releases namespace, by field ID. */
  readonly errors: Readonly<Record<string, string>>;
}

const ENV_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const SAFE_SHELL_WORD = /^[A-Za-z0-9_/.:=@%+,-]+$/;

/** Where a path points: settings, a credential, the environment record, or a fact. */
export function pathTarget(path: string): {
  readonly area: 'config' | 'secret' | 'environment' | 'facts';
  readonly key: string;
} {
  const dot = path.indexOf('.');
  const area = path.slice(0, dot);
  if (
    dot < 1 ||
    (area !== 'config' &&
      area !== 'secret' &&
      area !== 'environment' &&
      area !== 'facts')
  )
    throw new TypeError(`Invalid driver form path "${path}".`);
  return { area, key: path.slice(dot + 1) };
}

export function getPath(
  value: Readonly<Record<string, unknown>>,
  path: string,
): unknown {
  let current: unknown = value;
  for (const part of path.split('.')) {
    if (!isRecord(current)) return undefined;
    current = current[part];
  }
  return current;
}

function setPath(
  value: Record<string, unknown>,
  path: string,
  next: unknown,
): void {
  const parts = path.split('.');
  let current = value;
  for (const part of parts.slice(0, -1)) {
    if (!isRecord(current[part])) current[part] = {};
    current = current[part] as Record<string, unknown>;
  }
  current[parts.at(-1)!] = next;
}

function deletePath(value: Record<string, unknown>, path: string): void {
  const parts = path.split('.');
  let current: unknown = value;
  for (const part of parts.slice(0, -1)) {
    if (!isRecord(current)) return;
    current = current[part];
  }
  if (isRecord(current)) delete current[parts.at(-1)!];
}

/** Removes objects left empty, deepest first. */
function pruneEmpty(value: Record<string, unknown>): void {
  for (const [key, child] of Object.entries(value))
    if (isRecord(child)) {
      pruneEmpty(child);
      if (Object.keys(child).length === 0) delete value[key];
    }
}

export function matches(
  condition: DriverFormCondition | undefined,
  values: DriverFormValues,
): boolean {
  if (!condition) return true;
  const expected: readonly (string | boolean)[] = Array.isArray(
    condition.equals,
  )
    ? condition.equals
    : [condition.equals as string | boolean];
  const actual = values[condition.field];
  return actual !== undefined && expected.includes(actual);
}

/** Whether a field is shown: its group is, the group's switch is on, and its own condition holds. */
export function isFieldShown(
  group: DriverFormGroup,
  field: DriverFormField,
  state: Pick<DriverFormState, 'values' | 'toggles'>,
): boolean {
  return (
    matches(group.visibleWhen, state.values) &&
    (!group.toggle || state.toggles[group.id] === true) &&
    matches(field.visibleWhen, state.values)
  );
}

/** The inputs for stored settings: each field's stored value as its input shows it, else its default. */
export function decodeDriverForm(
  form: DriverFormDescription,
  source: DriverFormSource,
): DriverFormState {
  const values: DriverFormValues = {
    ...form.codec?.decode(source.config),
  };
  const toggles: Record<string, boolean> = {};
  const secrets: Record<string, SecretInput> = {};
  for (const group of form.groups) {
    if (group.toggle)
      toggles[group.id] =
        getPath(source.config, pathTarget(group.toggle.path).key) != null;
    for (const field of group.fields) {
      if (field.type === 'secret') {
        secrets[field.id] = { mode: 'keep', value: '' };
        continue;
      }
      if (field.type === 'fact' || !field.path) {
        if (!(field.id in values) && field.type !== 'fact')
          values[field.id] = initial(field);
        continue;
      }
      const target = pathTarget(field.path);
      const stored =
        target.area === 'environment'
          ? target.key === 'publicUrl'
            ? source.publicUrl
            : undefined
          : getPath(source.config, target.key);
      values[field.id] =
        stored === undefined || stored === null
          ? initial(field)
          : toInput(field, stored);
    }
  }
  return { values, toggles, secrets };
}

/** An empty input, or the field's default as the input shows it. */
function initial(field: DriverFormField): string | boolean {
  switch (field.type) {
    case 'switch':
      return field.default;
    case 'choice':
      return field.default;
    case 'number':
      return field.default === undefined ? '' : String(field.default);
    case 'text':
      return field.default ?? '';
    default:
      return '';
  }
}

function toInput(field: DriverFormField, stored: unknown): string | boolean {
  switch (field.type) {
    case 'switch':
      return typeof stored === 'boolean' ? stored : field.default;
    case 'list':
      return Array.isArray(stored) ? stored.map(String).join('\n') : '';
    case 'map':
      return isRecord(stored)
        ? Object.entries(stored)
            .map(([name, value]) => `${name}=${String(value)}`)
            .join('\n')
        : '';
    case 'command':
      return Array.isArray(stored) ? commandText(stored.map(String)) : '';
    default:
      return typeof stored === 'string' ||
        typeof stored === 'number' ||
        typeof stored === 'boolean'
        ? String(stored)
        : JSON.stringify(stored);
  }
}

/** `['sh', '-c', line]` as the line; any other argument list quoted for `sh`. */
export function commandText(args: readonly string[]): string {
  if (args.length === 3 && args[0] === 'sh' && args[1] === '-c') return args[2];
  return args
    .map((arg) =>
      SAFE_SHELL_WORD.test(arg) ? arg : `'${arg.replaceAll("'", `'\\''`)}'`,
    )
    .join(' ');
}

/** The settings, credential changes and public URL the inputs describe, or why they cannot be saved. */
export function encodeDriverForm(
  form: DriverFormDescription,
  state: DriverFormState,
  original: Readonly<Record<string, unknown>>,
): DriverFormOutput {
  const config = structuredClone(original) as Record<string, unknown>;
  const secretChanges: Record<string, unknown> = {};
  const errors: Record<string, string> = {};
  let publicUrl: string | null | undefined;
  form.codec?.encode(state.values, config);

  for (const group of form.groups) {
    if (group.toggle && state.toggles[group.id] !== true) {
      deletePath(config, pathTarget(group.toggle.path).key);
      for (const field of group.fields)
        if (field.type === 'secret' && field.clearWhenHidden)
          secretChanges[pathTarget(field.path).key] = null;
      continue;
    }
    for (const field of group.fields) {
      if (field.type === 'fact') continue;
      const shown = isFieldShown(group, field, state);
      if (!field.path) {
        // Virtual: the codec wrote it; only a required one left empty is refused here.
        if (
          shown &&
          field.required &&
          !String(state.values[field.id] ?? '').trim()
        )
          errors[field.id] = 'required';
        continue;
      }
      const target = pathTarget(field.path);
      if (field.type === 'secret') {
        const input = state.secrets[field.id];
        if (!shown && field.clearWhenHidden) {
          secretChanges[target.key] = null;
          continue;
        }
        if (!shown || !input || input.mode === 'keep') continue;
        if (input.mode === 'clear') {
          secretChanges[target.key] = null;
          continue;
        }
        if (!input.value.trim()) continue;
        if (field.format === 'map') {
          const parsed = parseMap(input.value);
          if (typeof parsed === 'string') errors[field.id] = parsed;
          else secretChanges[target.key] = parsed;
        } else
          secretChanges[target.key] =
            field.format === 'multiline' ? input.value : input.value.trim();
        continue;
      }
      if (target.area === 'environment') {
        if (target.key === 'publicUrl')
          publicUrl = shown
            ? String(state.values[field.id] ?? '').trim() || null
            : null;
        continue;
      }
      if (target.area !== 'config') continue;
      if (!shown) {
        deletePath(config, target.key);
        continue;
      }
      const result = fromInput(field, state.values[field.id]);
      if ('error' in result) errors[field.id] = result.error;
      else if (result.value === undefined) {
        if (field.required) errors[field.id] = 'required';
        deletePath(config, target.key);
      } else setPath(config, target.key, result.value);
    }
  }
  pruneEmpty(config);
  for (const group of form.groups)
    if (group.toggle && state.toggles[group.id] === true) {
      const key = pathTarget(group.toggle.path).key;
      if (getPath(config, key) == null) setPath(config, key, {});
    }
  return { config, secretChanges, publicUrl, errors };
}

/** An input's stored value; undefined leaves the setting out (empty, or the default). */
function fromInput(
  field: Exclude<DriverFormField, { type: 'secret' } | { type: 'fact' }>,
  input: string | boolean | undefined,
): { readonly value: unknown } | { readonly error: string } {
  switch (field.type) {
    case 'switch': {
      const value = typeof input === 'boolean' ? input : field.default;
      return { value: value === field.default ? undefined : value };
    }
    case 'choice': {
      const value = typeof input === 'string' && input ? input : field.default;
      return { value: value === field.default ? undefined : value };
    }
    case 'number': {
      const text = String(input ?? '').trim();
      if (!text) return { value: undefined };
      const value = Number(text);
      if (!Number.isFinite(value)) return { error: 'number' };
      if (field.integer && !Number.isInteger(value))
        return { error: 'integer' };
      if (
        (field.min !== undefined && value < field.min) ||
        (field.max !== undefined && value > field.max)
      )
        return { error: 'range' };
      return { value: value === field.default ? undefined : value };
    }
    case 'list': {
      const items = String(input ?? '')
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean);
      return { value: items.length ? items : undefined };
    }
    case 'map': {
      const parsed = parseMap(String(input ?? ''));
      if (typeof parsed === 'string') return { error: parsed };
      return { value: Object.keys(parsed).length ? parsed : undefined };
    }
    case 'command': {
      const text = String(input ?? '').trim();
      return { value: text ? ['sh', '-c', text] : undefined };
    }
    case 'text': {
      const raw = String(input ?? '');
      const text = field.multiline ? raw : raw.trim();
      if (!text.trim()) return { value: undefined };
      return { value: text === field.default ? undefined : text };
    }
  }
}

/** `NAME=value` lines as an object, or the error key. */
export function parseMap(text: string): Record<string, string> | string {
  const result: Record<string, string> = {};
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const equals = line.indexOf('=');
    if (equals < 1) return 'mapLine';
    const name = line.slice(0, equals).trim();
    if (!ENV_NAME.test(name)) return 'mapName';
    result[name] = line.slice(equals + 1);
  }
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
