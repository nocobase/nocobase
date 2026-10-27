import type { PageUIItem } from '../../shared/conversations.js';
import {
  clonePageUIContext,
  PAGE_UI_CONTEXT_LIMITS,
} from '../../shared/page-ui-context.js';
import type { AppUIJson } from '../../shared/ui-message.js';
import { createClientId } from './client-id.js';

export type AIFormValues = Record<string, AppUIJson>;
export type AIFormFieldType = 'string' | 'number' | 'boolean' | 'json';

/** Flat names only. Nested objects may be a declared JSON field, never a path. */
export interface AIFormField {
  readonly name: string;
  readonly title?: string;
  readonly type: AIFormFieldType;
  readonly editable: boolean;
  readonly enum?: readonly AppUIJson[];
}

/** Async adapters must check isCurrent immediately before committing synchronously. */
export interface AIFormOperationContext {
  readonly signal: AbortSignal;
  readonly isCurrent: () => boolean;
}

export interface AIFormSetResult {
  readonly status: 'applied' | 'partial';
  readonly message?: string;
}

export interface AIFormRegistration {
  readonly id: string;
  readonly title: string;
  /** Include the authenticated identity and record identity, not just the form id. */
  readonly identity: string;
  readonly fields: readonly AIFormField[];
  /** Change synchronously on every draft mutation; never reuse a revision within this instance. */
  readonly getRevision: () => string;
  /** Return only declared, explicitly safe fields. */
  readonly getValues: (
    context: AIFormOperationContext,
  ) => AIFormValues | Promise<AIFormValues>;
  /** Patch the browser draft only. Never submit or persist a business record. */
  readonly setValues: (
    values: AIFormValues,
    context: AIFormOperationContext,
  ) => void | AIFormSetResult | Promise<void | AIFormSetResult>;
  readonly validate?: (
    values: AIFormValues,
    context: AIFormOperationContext,
  ) => string | undefined | Promise<string | undefined>;
}

export interface AIFormDescriptor {
  readonly id: string;
  readonly title: string;
  readonly identity: string;
  readonly instance: string;
  readonly fields: readonly AIFormField[];
}

/** JSON descriptor suitable for explicitly selecting a UI context source. */
export interface AIFormSnapshot extends PageUIItem {
  kind: 'form';
  id: string;
  title: string;
  identity: string;
  instance: string;
  revision: string;
  fields: AppUIJson[];
  values: AIFormValues;
}

export interface AIFormRegistrationHandle {
  readonly instance: string;
  update: (registration: AIFormRegistration) => void;
  unregister: () => void;
}

export type AIFormApplyStatus =
  'applied' | 'rejected' | 'cancelled' | 'failed' | 'partial';

export interface AIFormApplyResult {
  readonly status: AIFormApplyStatus;
  readonly code: string;
  readonly message: string;
}

export interface AIFormApplyRequest {
  /** Trusted selected snapshot from this card's originating user message, not model output. */
  readonly source: PageUIItem;
  /** Stable per local card action, including conversation/message/tool identity. */
  readonly operationId: string;
  /** The user's final edited patch, not the original tool output. */
  readonly values: AIFormValues;
  readonly signal?: AbortSignal;
}

interface Entry {
  registration: AIFormRegistration;
  fields: AIFormField[];
  fieldKey: string;
  instance: string;
  controllers: Set<AbortController>;
  writing: boolean;
  writeEpoch: number;
}

interface Operation {
  fingerprint: string;
  promise: Promise<AIFormApplyResult>;
}

/** Local failures have stable codes; adapters may still have non-transactional effects. */
export class AIFormRegistryError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'AIFormRegistryError';
    this.code = code;
  }
}

const FORBIDDEN_KEYS: ReadonlySet<string> = new Set([
  '__proto__',
  'constructor',
  'prototype',
]);
const FIELDS_MAX = 100;
const ID_LENGTH_MAX = 500;

function fail(code: string, message: string): never {
  throw new AIFormRegistryError(code, message);
}

function identifier(value: string, label: string): void {
  if (!value.trim() || value.length > ID_LENGTH_MAX)
    fail(
      'invalid-registration',
      `${label} must be a nonempty, bounded string.`,
    );
}

function flatName(name: string): void {
  if (
    !name ||
    name.length > PAGE_UI_CONTEXT_LIMITS.key ||
    /[.[\]\\/]/u.test(name) ||
    FORBIDDEN_KEYS.has(name)
  )
    fail('invalid-field', 'Fields must use safe, declared flat names.');
}

/** Clone without evaluating accessors or invoking toJSON; reject pollution keys at every depth. */
function cloneJson(value: unknown): AppUIJson {
  let nodes = 0;
  const ancestors = new Set<object>();
  function visit(item: unknown, depth: number): AppUIJson {
    if (
      ++nodes > PAGE_UI_CONTEXT_LIMITS.nodes ||
      depth > PAGE_UI_CONTEXT_LIMITS.depth
    )
      return fail('invalid-json', 'Form JSON exceeds the structural budget.');
    if (typeof item === 'string' && item.length > PAGE_UI_CONTEXT_LIMITS.string)
      return fail(
        'invalid-json',
        'Form JSON string exceeds the string budget.',
      );
    if (item === null || typeof item === 'string' || typeof item === 'boolean')
      return item;
    if (typeof item === 'number' && Number.isFinite(item)) return item;
    if (typeof item !== 'object' || ancestors.has(item))
      return fail('invalid-json', 'Form data must be lossless, acyclic JSON.');
    const array = Array.isArray(item);
    const prototype: unknown = Object.getPrototypeOf(item);
    if (
      array
        ? prototype !== Array.prototype
        : prototype !== Object.prototype && prototype !== null
    )
      return fail('invalid-json', 'Form data must contain only plain objects.');
    ancestors.add(item);
    const result: AppUIJson[] | Record<string, AppUIJson> = array ? [] : {};
    const keys = Reflect.ownKeys(item);
    if (array && keys.length !== item.length + 1)
      return fail(
        'invalid-json',
        'Sparse or extended arrays are not JSON data.',
      );
    for (const key of keys) {
      if (array && key === 'length') continue;
      if (
        typeof key !== 'string' ||
        key.length > PAGE_UI_CONTEXT_LIMITS.key ||
        FORBIDDEN_KEYS.has(key) ||
        (array &&
          (!/^(0|[1-9][0-9]*)$/u.test(key) || Number(key) >= item.length))
      )
        return fail('invalid-json', 'Form JSON contains an unsafe property.');
      const descriptor = Object.getOwnPropertyDescriptor(item, key);
      if (!descriptor?.enumerable || !('value' in descriptor))
        return fail(
          'invalid-json',
          'Form JSON cannot contain accessors or hidden properties.',
        );
      const cloned = visit(descriptor.value, depth + 1);
      Object.defineProperty(result, key, {
        value: cloned,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
    ancestors.delete(item);
    return result;
  }
  const cloned = visit(value, 0);
  if (
    new TextEncoder().encode(JSON.stringify(cloned)).length >
    PAGE_UI_CONTEXT_LIMITS.bytes
  )
    fail('invalid-json', 'Form JSON exceeds the byte budget.');
  return cloned;
}

function objectJson(value: unknown): AIFormValues {
  const cloned = cloneJson(value);
  if (cloned === null || typeof cloned !== 'object' || Array.isArray(cloned))
    return fail('invalid-values', 'Expected a flat form values object.');
  return cloned;
}

function serializeFields(fields: readonly AIFormField[]): AppUIJson[] {
  return fields.map((field) => ({
    name: field.name,
    type: field.type,
    editable: field.editable,
    ...(field.title === undefined ? {} : { title: field.title }),
    ...(field.enum === undefined ? {} : { enum: field.enum.map(cloneJson) }),
  }));
}

function validateFields(fields: readonly AIFormField[]): AIFormField[] {
  if (fields.length > FIELDS_MAX)
    fail('invalid-field', 'Too many declared form fields.');
  const names = new Set<string>();
  const cloned = fields.map((field) => {
    flatName(field.name);
    if (names.has(field.name))
      fail('invalid-field', 'Duplicate form field name.');
    names.add(field.name);
    if (!['string', 'number', 'boolean', 'json'].includes(field.type))
      fail('invalid-field', 'Unknown form field type.');
    if (typeof field.editable !== 'boolean')
      fail('invalid-field', 'Each field must declare its edit capability.');
    return {
      name: field.name,
      type: field.type,
      editable: field.editable,
      ...(field.title === undefined ? {} : { title: field.title }),
      ...(field.enum === undefined ? {} : { enum: field.enum.map(cloneJson) }),
    };
  });
  cloneJson(serializeFields(cloned));
  return cloned;
}

function jsonKey(value: AppUIJson): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(jsonKey).join(',')}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${jsonKey(value[key])}`)
    .join(',')}}`;
}

function checkValues(
  values: AIFormValues,
  fields: readonly AIFormField[],
  edit: boolean,
): void {
  for (const [name, value] of Object.entries(values)) {
    flatName(name);
    const field = fields.find((candidate) => candidate.name === name);
    if (!field) fail('undeclared-field', `Field "${name}" was not declared.`);
    if (edit && !field.editable)
      fail('readonly-field', `Field "${name}" is read-only.`);
    if (field.type !== 'json' && typeof value !== field.type)
      fail('invalid-value', `Field "${name}" has the wrong type.`);
    if (
      field.enum &&
      !field.enum.some((option) => jsonKey(option) === jsonKey(value))
    )
      fail('invalid-value', `Field "${name}" is not an allowed option.`);
  }
}

function revisionOf(entry: Entry): string {
  const revision = entry.registration.getRevision();
  identifier(revision, 'Draft revision');
  return `${entry.writeEpoch}:${revision}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'The form adapter failed.';
}

function result(
  status: AIFormApplyStatus,
  code: string,
  message: string,
): AIFormApplyResult {
  return { status, code, message };
}

/** Per identity-bound browser provider; registration neither selects context nor authorizes execution. */
export class AIFormRegistry {
  private readonly entries: Map<string, Entry> = new Map();
  private readonly operations: Map<string, Operation> = new Map();

  register(registration: AIFormRegistration): AIFormRegistrationHandle {
    identifier(registration.id, 'Form id');
    if (registration.id.length > PAGE_UI_CONTEXT_LIMITS.id)
      fail('invalid-registration', 'Form id exceeds the UI context id budget.');
    identifier(registration.identity, 'Form identity');
    identifier(registration.title, 'Form title');
    if (this.entries.has(registration.id))
      fail('duplicate-form', `Form "${registration.id}" is already mounted.`);
    const id = registration.id;
    const identity = registration.identity;
    const fields = validateFields(registration.fields);
    const entry: Entry = {
      registration: { ...registration, fields },
      fields,
      fieldKey: JSON.stringify(serializeFields(fields)),
      instance: createClientId(),
      controllers: new Set(),
      writing: false,
      writeEpoch: 0,
    };
    revisionOf(entry);
    this.entries.set(id, entry);
    return {
      instance: entry.instance,
      update: (next) => {
        if (this.entries.get(id) !== entry) return;
        if (next.id !== id || next.identity !== identity)
          fail(
            'identity-changed',
            'Changing form identity requires a new registration.',
          );
        identifier(next.title, 'Form title');
        const nextFields = validateFields(next.fields);
        const key = JSON.stringify(serializeFields(nextFields));
        if (key !== entry.fieldKey) {
          entry.writeEpoch += 1;
          for (const controller of entry.controllers) controller.abort();
        }
        entry.registration = { ...next, fields: nextFields };
        entry.fields = nextFields;
        entry.fieldKey = key;
      },
      unregister: () => {
        if (this.entries.get(id) !== entry) return;
        this.entries.delete(id);
        for (const controller of entry.controllers) controller.abort();
      },
    };
  }

  /** Read-only capabilities, never live setter handles. */
  list(): readonly AIFormDescriptor[] {
    return [...this.entries.values()].map((entry) => this.describe(entry));
  }

  locate(id: string): AIFormDescriptor | undefined {
    const entry = this.entries.get(id);
    return entry ? this.describe(entry) : undefined;
  }

  /** Call at send time, only for an explicitly selected context source. */
  async snapshot(id: string): Promise<AIFormSnapshot> {
    const entry = this.entries.get(id);
    if (!entry) return fail('missing-form', 'The form is no longer mounted.');
    if (entry.writing)
      return fail('form-busy', 'A draft update is in progress.');
    const revision = revisionOf(entry);
    const fieldKey = entry.fieldKey;
    const title = entry.registration.title;
    const controller = new AbortController();
    entry.controllers.add(controller);
    const isCurrent = (): boolean =>
      !controller.signal.aborted &&
      this.current(entry, revision, fieldKey) &&
      !entry.writing;
    try {
      const values = objectJson(
        await entry.registration.getValues({
          signal: controller.signal,
          isCurrent,
        }),
      );
      if (!isCurrent())
        return fail('stale-form', 'The form changed while reading its draft.');
      checkValues(values, entry.fields, false);
      const snapshot: AIFormSnapshot = {
        kind: 'form',
        id,
        title,
        identity: entry.registration.identity,
        instance: entry.instance,
        revision,
        fields: serializeFields(entry.fields),
        values,
      };
      // Admit the complete envelope under the same budgets as chat transport and history.
      clonePageUIContext({ version: 1, items: [snapshot] });
      return snapshot;
    } finally {
      entry.controllers.delete(controller);
    }
  }

  /** No implicit source lookup. Missing originating-message context must disable the card action. */
  apply(request: AIFormApplyRequest): Promise<AIFormApplyResult> {
    let source: AIFormValues;
    let values: AIFormValues;
    let fingerprint: string;
    try {
      identifier(request.operationId, 'Operation id');
      source = objectJson(request.source);
      values = objectJson(request.values);
      fingerprint = jsonKey({ source, values });
    } catch (error) {
      return Promise.resolve(
        result(
          'rejected',
          error instanceof AIFormRegistryError ? error.code : 'invalid-request',
          errorMessage(error),
        ),
      );
    }
    const previous = this.operations.get(request.operationId);
    if (previous) {
      return previous.fingerprint === fingerprint
        ? previous.promise
        : Promise.resolve(
            result(
              'rejected',
              'operation-conflict',
              'This operation id was already used with a different proposal.',
            ),
          );
    }
    const signal = request.signal;
    // Defer adapter execution until the operation is recorded, including reentrant calls.
    const promise = Promise.resolve().then(() =>
      this.execute(source, values, signal),
    );
    this.operations.set(request.operationId, { fingerprint, promise });
    return promise;
  }

  private describe(entry: Entry): AIFormDescriptor {
    return {
      id: entry.registration.id,
      title: entry.registration.title,
      identity: entry.registration.identity,
      instance: entry.instance,
      fields: validateFields(entry.fields),
    };
  }

  private current(entry: Entry, revision: string, fieldKey: string): boolean {
    return (
      this.entries.get(entry.registration.id) === entry &&
      entry.fieldKey === fieldKey &&
      revisionOf(entry) === revision
    );
  }

  private async execute(
    source: AIFormValues,
    values: AIFormValues,
    signal?: AbortSignal,
  ): Promise<AIFormApplyResult> {
    let entry: Entry | undefined;
    let controller: AbortController | undefined;
    let beganWrite = false;
    const abort = (): void => controller?.abort();
    try {
      if (signal?.aborted)
        return result(
          'cancelled',
          'cancelled',
          'The draft update was cancelled.',
        );
      if (source.kind !== 'form' || typeof source.id !== 'string')
        return result(
          'rejected',
          'missing-source',
          'A selected form snapshot from the originating message is required.',
        );
      entry = this.entries.get(source.id);
      if (!entry)
        return result(
          'rejected',
          'missing-form',
          'The form is no longer mounted.',
        );
      if (
        source.instance !== entry.instance ||
        source.identity !== entry.registration.identity
      )
        return result(
          'rejected',
          'stale-form',
          'This proposal belongs to a different form instance or identity.',
        );
      const revision = revisionOf(entry);
      const fieldKey = entry.fieldKey;
      if (
        source.revision !== revision ||
        JSON.stringify(source.fields) !== fieldKey
      )
        return result(
          'rejected',
          'revision-conflict',
          'The draft or its capabilities changed. Generate a new proposal.',
        );
      const sourceValues = objectJson(source.values);
      checkValues(sourceValues, entry.fields, false);
      checkValues(values, entry.fields, true);
      if (!Object.keys(values).length)
        return result(
          'rejected',
          'empty-patch',
          'The proposal contains no editable values.',
        );
      if (entry.writing)
        return result(
          'rejected',
          'form-busy',
          'Another draft update is in progress.',
        );
      entry.writing = true;
      controller = new AbortController();
      entry.controllers.add(controller);
      signal?.addEventListener('abort', abort, { once: true });
      const target = entry;
      const activeController = controller;
      const isCurrent = (): boolean =>
        !activeController.signal.aborted &&
        this.current(target, revision, fieldKey);
      const context: AIFormOperationContext = {
        signal: controller.signal,
        isCurrent,
      };
      const invalid = await entry.registration.validate?.(
        objectJson(values),
        context,
      );
      if (signal?.aborted)
        return result(
          'cancelled',
          'cancelled',
          'The draft update was cancelled.',
        );
      if (!isCurrent())
        return result(
          'rejected',
          'stale-form',
          'The form changed during validation.',
        );
      if (invalid !== undefined)
        return result('rejected', 'validation-failed', invalid);
      beganWrite = true;
      const outcome = await entry.registration.setValues(
        objectJson(values),
        context,
      );
      if (outcome?.status === 'partial')
        return result(
          'partial',
          'partial-update',
          outcome.message ??
            'The adapter reported a partial draft update. Review the draft.',
        );
      // A successful setter normally advances revision; check instance/cancellation, not the old revision.
      if (controller.signal.aborted || this.entries.get(source.id) !== entry)
        return result(
          'failed',
          'stale-after-write',
          'The target changed or the update was cancelled while the adapter was running. Its outcome is not confirmed.',
        );
      return result(
        'applied',
        'applied',
        outcome?.message ??
          'Applied to the browser draft only; nothing was saved.',
      );
    } catch (error) {
      return result(
        beganWrite ? 'failed' : 'rejected',
        error instanceof AIFormRegistryError
          ? error.code
          : beganWrite
            ? 'adapter-failed'
            : 'validation-failed',
        errorMessage(error),
      );
    } finally {
      signal?.removeEventListener('abort', abort);
      if (entry && controller) {
        // Even a failed non-transactional setter may have changed the draft.
        if (beganWrite) entry.writeEpoch += 1;
        entry.controllers.delete(controller);
        entry.writing = false;
      }
    }
  }
}
