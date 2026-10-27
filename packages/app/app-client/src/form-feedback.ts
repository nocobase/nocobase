import { ApiClientError } from '@nocobase/api-client';

export interface FormFeedbackMessages {
  readonly invalid: string;
  readonly field?: string;
  readonly failed: string;
  readonly network: string;
  readonly denied: string;
}

/** Keep this descriptor mounted even when a tab's editor is unmounted. */
export interface FormFeedbackField {
  /** Stable across row reordering; never use an array index as identity. */
  readonly id: string;
  readonly path: () => string;
  readonly label?: () => string;
  readonly anchor: () => HTMLElement | null;
  readonly control: () => HTMLElement | null;
  readonly value: () => unknown;
  /** Permissions and business visibility, independently of collapsed layout. */
  readonly accessible: () => boolean;
  readonly editable: () => boolean;
  /** Open enclosing regions, outermost first; resolve after controls mount. */
  readonly reveal?: () => void | Promise<void>;
}

export interface FormFeedbackError {
  readonly id: string;
  readonly message: string;
}

export interface FormFeedbackState {
  readonly fields: readonly FormFeedbackError[];
  readonly message: string | undefined;
}

interface SubmittedField {
  readonly field: FormFeedbackField;
  readonly path: string;
  readonly value: unknown;
}

export interface FormFeedbackAttempt {
  readonly sequence: number;
  readonly fields: readonly SubmittedField[];
}

export interface FormFeedbackViolation {
  readonly field: string;
  readonly reason?: string;
}

export interface FormFeedbackOptions {
  readonly messages: FormFeedbackMessages;
  /** Return trusted application copy, never the server's developer description. */
  readonly fieldMessage?: (
    violation: FormFeedbackViolation,
    error: ApiClientError,
  ) => string | undefined;
}

const emptyState: FormFeedbackState = { fields: [], message: undefined };

export function normalizeFormFieldPath(path: string): string {
  return path.replace(/\[(\d+)\]/g, '.$1');
}

function object(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : undefined;
}

function visible(control: HTMLElement): boolean {
  if (
    !control.isConnected ||
    control.closest('[hidden], [inert], [aria-hidden="true"]')
  )
    return false;
  for (
    let element: HTMLElement | null = control;
    element;
    element = element.parentElement
  ) {
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
  }
  return true;
}

const fileIds = new WeakMap<Blob, number>();
let nextFileId = 0;

function fingerprint(value: unknown): unknown {
  // File identity matters; serializing a File would reduce every file to {}.
  if (typeof File !== 'undefined' && value instanceof File) return value;
  if (typeof value === 'object' && value !== null) {
    try {
      return JSON.stringify(value, (_key, entry: unknown) => {
        if (typeof Blob !== 'undefined' && entry instanceof Blob) {
          if (!fileIds.has(entry)) fileIds.set(entry, ++nextFileId);
          return { fileIdentity: fileIds.get(entry) };
        }
        return entry;
      });
    } catch {
      return value;
    }
  }
  return value;
}

/** One instance per mounted form. It owns errors only, never input or uploads. */
export class FormFeedback {
  private readonly fields = new Map<string, FormFeedbackField>();
  private readonly listeners = new Set<() => void>();
  private state: FormFeedbackState = emptyState;
  private sequence = 0;
  private focusSequence = 0;
  public constructor(private options: FormFeedbackOptions) {}

  public configure(options: FormFeedbackOptions): void {
    const previous = this.options.messages;
    this.options = { ...this.options, ...options };
    const translate = (text: string | undefined): string | undefined => {
      const key = (
        Object.keys(previous) as (keyof FormFeedbackMessages)[]
      ).find((key) => previous[key] === text);
      return key ? options.messages[key] : text;
    };
    const message = translate(this.state.message);
    const fields = this.state.fields.map((error) => ({
      ...error,
      message: translate(error.message)!,
    }));
    if (
      message !== this.state.message ||
      fields.some(
        (error, index) => error.message !== this.state.fields[index]?.message,
      )
    )
      this.publish({ fields, message });
  }
  public readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  public readonly getSnapshot = (): FormFeedbackState => this.state;

  private publish(state: FormFeedbackState): void {
    this.state = state;
    for (const listener of this.listeners) listener();
  }

  public register(field: FormFeedbackField): () => void {
    this.fields.set(field.id, field);
    return () => {
      if (this.fields.get(field.id) !== field) return;
      this.fields.delete(field.id);
      this.clear(field.id);
    };
  }

  public hasPath(path: string): boolean {
    return [...this.fields.values()].some(
      (field) =>
        normalizeFormFieldPath(field.path()) === normalizeFormFieldPath(path),
    );
  }

  public clearControl(control: HTMLElement): void {
    for (const field of this.fields.values())
      if (field.control() === control || field.control()?.contains(control))
        this.clear(field.id);
  }

  public field(id: string): FormFeedbackField | undefined {
    return this.fields.get(id);
  }

  public getAttemptSequence(): number {
    return this.sequence;
  }

  public begin(): FormFeedbackAttempt {
    this.focusSequence++;
    this.sequence++;
    this.publish({ ...emptyState });
    return {
      sequence: this.sequence,
      fields: [...this.fields.values()]
        .filter((field) => field.accessible())
        .map((field) => ({
          field,
          path: normalizeFormFieldPath(field.path()),
          value: fingerprint(field.value()),
        })),
    };
  }

  /** Clear only the changed field; a new attempt clears the form-level error. */
  public clear(id?: string): void {
    if (id === undefined) {
      this.sequence++;
      this.focusSequence++;
      this.publish(emptyState);
    } else if (this.state.fields.some((error) => error.id === id)) {
      this.focusSequence++;
      this.publish({
        ...this.state,
        fields: this.state.fields.filter((error) => error.id !== id),
      });
    }
  }

  public invalid(
    errors: readonly { readonly field: string; readonly message: string }[],
    attempt: FormFeedbackAttempt,
  ): void {
    if (attempt.sequence !== this.sequence) return;
    const fields: FormFeedbackError[] = [];
    for (const error of errors) {
      const submitted = attempt.fields.find(
        (entry) => entry.path === normalizeFormFieldPath(error.field),
      );
      if (
        submitted &&
        this.current(submitted) &&
        !fields.some((error) => error.id === submitted.field.id)
      )
        fields.push({ id: submitted.field.id, message: error.message });
    }
    this.publish({ fields, message: this.options.messages.invalid });
  }

  private current(entry: SubmittedField): boolean {
    return (
      this.fields.get(entry.field.id) === entry.field &&
      entry.field.accessible() &&
      Object.is(entry.value, fingerprint(entry.field.value()))
    );
  }

  public failure(error: unknown, attempt: FormFeedbackAttempt): void {
    if (attempt.sequence !== this.sequence) return;
    const messages = this.options.messages;
    if (!(error instanceof ApiClientError)) {
      this.publish({
        fields: [],
        message:
          error instanceof TypeError ? messages.network : messages.failed,
      });
      return;
    }
    if (error.status === 401 || error.status === 403) {
      this.publish({ fields: [], message: messages.denied });
      return;
    }
    const detail = object(object(error.payload)?.error);
    const violations = detail?.fieldViolations;
    const fields: FormFeedbackError[] = [];
    let unmapped = false;
    if (Array.isArray(violations))
      for (const raw of violations) {
        const violation = object(raw);
        if (typeof violation?.field !== 'string') {
          unmapped = true;
          continue;
        }
        const submitted = attempt.fields.find(
          (entry) =>
            entry.path === normalizeFormFieldPath(violation.field as string),
        );
        if (!submitted || !this.current(submitted)) {
          unmapped = true;
          continue;
        }
        const safeViolation: FormFeedbackViolation = {
          field: violation.field,
          ...(typeof violation.reason === 'string'
            ? { reason: violation.reason }
            : {}),
        };
        if (fields.some((entry) => entry.id === submitted.field.id)) continue;
        fields.push({
          id: submitted.field.id,
          message:
            this.options.fieldMessage?.(safeViolation, error) ??
            messages.field ??
            messages.invalid,
        });
      }
    this.publish({
      fields,
      message: unmapped || !fields.length ? messages.failed : messages.invalid,
    });
  }

  /** Re-read permission before rendering: revoked fields must disappear immediately. */
  public errors(): readonly FormFeedbackError[] {
    return this.state.fields.filter((error) =>
      this.fields.get(error.id)?.accessible(),
    );
  }

  public async focus(summary: HTMLElement | null, id?: string): Promise<void> {
    const sequence = ++this.focusSequence;
    const candidates = this.errors()
      .filter((error) => id === undefined || error.id === id)
      .map((error) => this.fields.get(error.id)!)
      .filter((field) => field.accessible() && field.editable())
      .sort((a, b) => {
        const left = a.anchor();
        const right = b.anchor();
        if (!left || !right || left === right) return 0;
        return left.compareDocumentPosition(right) &
          Node.DOCUMENT_POSITION_FOLLOWING
          ? -1
          : 1;
      });
    for (const field of candidates) {
      if (!field.accessible() || !field.editable()) continue;
      try {
        await field.reveal?.();
      } catch {
        continue;
      }
      if (sequence !== this.focusSequence) return;
      if (!field.accessible() || !field.editable()) continue;
      const control = field.control();
      if (
        !control ||
        !visible(control) ||
        control.matches(':disabled, [aria-disabled="true"], [readonly]')
      )
        continue;
      control.scrollIntoView?.({
        block: 'center',
        inline: 'nearest',
        behavior: 'instant',
      });
      control.focus({ preventScroll: true });
      if (
        control.ownerDocument.activeElement === control ||
        control.contains(control.ownerDocument.activeElement)
      )
        return;
    }
    if (sequence === this.focusSequence)
      summary?.focus({ preventScroll: false });
  }
}

/** Adapter for React Hook Form's nested FieldErrors, without a runtime dependency. */
export function formFeedbackErrors(
  errors: unknown,
  prefix: string = '',
): readonly { readonly field: string; readonly message: string }[] {
  const source = object(errors);
  if (!source) return [];
  if (typeof source.message === 'string')
    return [{ field: prefix, message: source.message }];
  return Object.entries(source)
    .filter(([key]) => !['ref', 'types', 'root'].includes(key))
    .flatMap(([key, value]) =>
      formFeedbackErrors(value, prefix ? `${prefix}.${key}` : key),
    );
}
