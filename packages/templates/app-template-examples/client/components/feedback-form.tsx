import {
  FormFeedback,
  formFeedbackErrors,
  type FormFeedbackAttempt,
  type FormFeedbackField,
  type FormFeedbackOptions,
  type FormFeedbackState,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

export interface FeedbackFormProps extends Omit<
  ComponentProps<'form'>,
  'onSubmit'
> {
  readonly onSubmit?: (
    event: React.FormEvent<HTMLFormElement>,
  ) => void | Promise<void>;
  /** Pass the caught request error; input state continues to belong to the caller. */
  readonly error?: unknown;
  /** Trusted application copy/actions for a request failure; never pass raw server content. */
  readonly errorContent?: ReactNode;
  readonly submitting?: boolean;
  /** For unmounted tabs, repeated rows and extension controls, register stable descriptors. */
  readonly feedback?: FormFeedback;
  readonly fieldMessage?: FormFeedbackOptions['fieldMessage'];
  /** React Hook Form errors. Set shouldFocusError: false so layout order owns focus. */
  readonly validationErrors?: unknown;
  /**
   * The form's current values, read when the user tries to leave: React Hook Form's `form.getValues`. With
   * `savedValues`, an enclosing route overlay asks "Discard changes?" whenever they differ, whatever changed them:
   * typing, a Select, a date or relation picker, an upload, or a restored draft (mobile.md M7.4).
   */
  readonly values?: () => unknown;
  /**
   * What is saved: the record's stored values as the form shows them, or the blank values of a create form. Never the
   * restored draft, which is unsaved input: give the draft to `defaultValues` and the stored record here, so a draft
   * that differs from the record makes leaving ask. After a save that keeps the form open, pass the saved record.
   */
  readonly savedValues?: unknown;
}

/**
 * Provided by a route overlay so a `FeedbackForm` inside can report unsaved values (`values` and `savedValues`). The
 * overlay reads every registered form when the user tries to leave.
 */
// eslint-disable-next-line react-refresh/only-export-components -- the overlay provides what this form reads
export const UnsavedValuesContext = createContext<{
  readonly register: (unsaved: () => boolean) => () => void;
} | null>(null);

/**
 * Whether two form values are the same as far as a user can tell: empty strings, `null` and `undefined` are equal,
 * dates compare by time, files by identity, arrays and plain objects by their entries.
 */
function sameFormValues(left: unknown, right: unknown): boolean {
  const empty = (value: unknown): boolean =>
    value === undefined || value === null || value === '';
  if (empty(left) || empty(right)) return empty(left) && empty(right);
  if (Object.is(left, right)) return true;
  if (left instanceof Date || right instanceof Date)
    return (
      left instanceof Date &&
      right instanceof Date &&
      left.getTime() === right.getTime()
    );
  if (
    typeof left !== 'object' ||
    typeof right !== 'object' ||
    left === null ||
    right === null
  )
    return false;
  if (Array.isArray(left) || Array.isArray(right))
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((item, index) => sameFormValues(item, right[index]))
    );
  const plain = (value: object): boolean => {
    const prototype = Object.getPrototypeOf(value) as unknown;
    return prototype === Object.prototype || prototype === null;
  };
  // Files, blobs and other instances are the same only when they are the same object.
  if (!plain(left) || !plain(right)) return false;
  const a = left as Record<string, unknown>;
  const b = right as Record<string, unknown>;
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].every((key) =>
    sameFormValues(a[key], b[key]),
  );
}

/** Native fields use name (or data-field-path). Custom controls use a FormFeedback descriptor. */
export function FeedbackForm({
  children,
  onSubmit,
  error,
  errorContent,
  feedback: supplied,
  fieldMessage,
  validationErrors,
  noValidate,
  submitting = false,
  values,
  savedValues,
  ref,
  ...props
}: FeedbackFormProps): ReactElement {
  const { t } = useTranslation();
  const unsavedValues = useContext(UnsavedValuesContext);
  const valuesRef = useRef(values);
  const savedValuesRef = useRef(savedValues);
  useLayoutEffect(() => {
    valuesRef.current = values;
    savedValuesRef.current = savedValues;
  });
  const tracksValues = values !== undefined;
  // The save the enclosing layer is told about (`RouteOverlay`, `RouteChildPage`): it runs from the submit until the
  // `onSubmit` promise settles, or, for an `onSubmit` that starts the request without returning it (`void submit()`),
  // until `submitting` has come and gone. Its navigation away then does not ask to discard the input.
  const submittingRef = useRef(submitting);
  const saveEndRef = useRef<(() => void) | null>(null);
  useLayoutEffect(() => {
    const was = submittingRef.current;
    submittingRef.current = submitting;
    if (!was || submitting || !saveEndRef.current) return;
    const end = saveEndRef.current;
    saveEndRef.current = null;
    // One task later, for a navigation the save started right after the request; at once if the form goes first.
    const timer = setTimeout(end, 0);
    return () => {
      clearTimeout(timer);
      end();
    };
  }, [submitting]);
  useLayoutEffect(() => {
    if (!unsavedValues || !tracksValues) return;
    return unsavedValues.register(() => {
      const read = valuesRef.current;
      return read ? !sameFormValues(read(), savedValuesRef.current) : false;
    });
  }, [unsavedValues, tracksValues]);
  const options = useMemo<FormFeedbackOptions>(
    () => ({
      messages: {
        field: t('formFeedback.field', {
          defaultValue: 'This value was rejected. Check it and try again.',
        }),
        invalid: t('formFeedback.invalid', {
          defaultValue: 'Check the highlighted fields and try again.',
        }),
        failed: t('formFeedback.failed', {
          defaultValue: 'Unable to save. Your input has been kept. Try again.',
        }),
        network: t('formFeedback.network', {
          defaultValue:
            'Unable to connect. Check your connection and try again. Your input has been kept.',
        }),
        denied: t('formFeedback.denied', {
          defaultValue:
            'You cannot submit this form with your current access. Your input has been kept.',
        }),
      },
      ...(fieldMessage ? { fieldMessage } : {}),
    }),
    [t, fieldMessage],
  );
  const [owned] = useState(() => new FormFeedback(options));
  const feedback = supplied ?? owned;
  useLayoutEffect(() => {
    feedback.configure(options);
  }, [feedback, options]);
  const state = useSyncExternalStore(
    feedback.subscribe,
    feedback.getSnapshot,
    feedback.getSnapshot,
  );
  const [unfocusableState, setUnfocusableState] = useState<FormFeedbackState>();
  const formRef = useRef<HTMLFormElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const attemptRef = useRef<FormFeedbackAttempt | undefined>(undefined);
  const prefixId = useId();
  const localValidationRef = useRef(false);
  const focusPendingRef = useRef(false);
  const controlsRef = useRef(
    new Map<
      HTMLElement,
      { field: FormFeedbackField; unregister: () => void }
    >(),
  );
  const generatedRef = useRef(0);
  const [, redraw] = useReducer((value: number) => value + 1, 0);

  useEffect(() => {
    const element = formRef.current;
    if (!element) return;
    const registered = controlsRef.current;
    const collect = () => {
      for (const [control, entry] of registered)
        if (!element.contains(control)) {
          entry.unregister();
          registered.delete(control);
        }
      for (const control of element.querySelectorAll<HTMLElement>(
        'input[name], textarea[name], select[name], [data-field-path]',
      )) {
        if (registered.has(control)) continue;
        // Application descriptors take precedence for custom/virtualized fields.
        const path = () =>
          control.dataset.fieldPath ?? control.getAttribute('name') ?? '';
        if (feedback.hasPath(path())) continue;
        const id = `${prefixId}-field-${++generatedRef.current}`;
        const field: FormFeedbackField = {
          id,
          path,
          label: () => fieldLabel(control),
          anchor: () => control,
          control: () => control,
          value: () => {
            if (control instanceof HTMLInputElement) {
              if (control.type === 'file')
                return Array.from(control.files ?? []);
              if (control.type === 'checkbox' || control.type === 'radio')
                return control.checked;
            }
            return 'value' in control ? control.value : control.textContent;
          },
          accessible: () =>
            element.contains(control) &&
            !control.closest(
              '[data-feedback-hidden], [hidden], [inert], [aria-hidden="true"]',
            ) &&
            ancestors(control).every((element) => {
              const style = getComputedStyle(element);
              return style.display !== 'none' && style.visibility !== 'hidden';
            }) &&
            !(control instanceof HTMLInputElement && control.type === 'hidden'),
          editable: () =>
            !control.matches(':disabled, [aria-disabled="true"], [readonly]'),
          reveal: () => {
            for (const details of ancestors(control))
              if (details instanceof HTMLDetailsElement) details.open = true;
          },
        };
        registered.set(control, {
          field,
          unregister: feedback.register(field),
        });
      }
    };
    collect();
    const observer = new MutationObserver(() => {
      collect();
      redraw();
    });
    observer.observe(element, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'hidden',
        'inert',
        'aria-hidden',
        'disabled',
        'data-feedback-hidden',
      ],
    });
    const change = (event: Event) => {
      const control = event.target;
      if (control instanceof HTMLElement) {
        const entry = registered.get(control);
        if (entry) feedback.clear(entry.field.id);
        else feedback.clearControl(control);
      }
    };
    element.addEventListener('input', change);
    element.addEventListener('change', change);
    return () => {
      observer.disconnect();
      element.removeEventListener('input', change);
      element.removeEventListener('change', change);
      for (const entry of registered.values()) entry.unregister();
      registered.clear();
    };
  }, [feedback, prefixId]);

  useEffect(() => {
    if (!error || !attemptRef.current) return;
    if (feedback.getAttemptSequence() !== attemptRef.current.sequence) return;
    focusPendingRef.current = true;
    feedback.failure(error, attemptRef.current);
  }, [error, feedback]);

  useEffect(() => {
    if (
      (state.message || state.fields.length) &&
      focusPendingRef.current &&
      !submitting
    ) {
      focusPendingRef.current = false;
      void feedback.focus(messageRef.current, undefined, () => {
        if (!state.message && feedback.getSnapshot() === state)
          setUnfocusableState(state);
      });
    }
  }, [state, feedback, submitting]);

  // Existing controlled validators keep their messages and state. Adopt their invalid controls once per submission.
  useEffect(() => {
    if (
      validationErrors !== undefined ||
      !localValidationRef.current ||
      !attemptRef.current
    )
      return;
    if (state.fields.length) {
      localValidationRef.current = false;
      return;
    }
    const invalid = [...controlsRef.current.keys()].filter(
      (control) => control.getAttribute('aria-invalid') === 'true',
    );
    if (!invalid.length) return;
    localValidationRef.current = false;
    focusPendingRef.current = true;
    feedback.invalid(
      invalid.map((control) => {
        return {
          field:
            control.dataset.fieldPath ?? control.getAttribute('name') ?? '',
          message:
            (existingFieldError(control)?.textContent ||
              options.messages.field) ??
            options.messages.invalid,
        };
      }),
      attemptRef.current,
    );
  });

  const validationKey = JSON.stringify(formFeedbackErrors(validationErrors));
  const attemptSequence = feedback.getAttemptSequence();
  useEffect(() => {
    if (
      !localValidationRef.current ||
      submitting ||
      !attemptSequence ||
      !attemptRef.current
    )
      return;
    localValidationRef.current = false;
    if (validationKey === '[]') return;
    const errors = formFeedbackErrors(validationErrors);
    if (errors.length) {
      focusPendingRef.current = true;
      feedback.invalid(errors, attemptRef.current);
    }
  }, [validationErrors, validationKey, feedback, attemptSequence, submitting]);

  const errors = feedback.errors();
  const inaccessible = state.fields.length > 0 && errors.length === 0;
  const formMessage =
    state.message ||
    (inaccessible || unfocusableState === state
      ? options.messages.failed
      : undefined);
  useLayoutEffect(() => {
    if (inaccessible || unfocusableState === state) messageRef.current?.focus();
  }, [state, inaccessible, unfocusableState]);
  useLayoutEffect(() => {
    const restore: (() => void)[] = [];
    for (const entry of errors) {
      const control = feedback.field(entry.id)?.control();
      if (!control) continue;
      const describedBy = control.getAttribute('aria-describedby');
      const invalid = control.getAttribute('aria-invalid');
      const ownsInvalid = invalid !== 'true';
      const existing = existingFieldError(control);
      const previousId = existing?.getAttribute('id');
      const id = existing?.id || `${entry.id}-error`;
      const ownsDescription = !(describedBy?.split(/\s+/) ?? []).includes(id);
      if (existing && !existing.id) existing.id = id;
      control.setAttribute('aria-invalid', 'true');
      control.setAttribute(
        'aria-describedby',
        [...new Set([...(describedBy?.split(/\s+/) ?? []), id])]
          .filter(Boolean)
          .join(' '),
      );
      restore.push(() => {
        if (existing && previousId === null && existing.id === id)
          existing.removeAttribute('id');
        // React may already have committed new caller-owned attributes. Remove only our additions.
        if (ownsDescription) {
          const remaining = (control.getAttribute('aria-describedby') ?? '')
            .split(/\s+/)
            .filter((value) => value && value !== id);
          if (remaining.length)
            control.setAttribute('aria-describedby', remaining.join(' '));
          else control.removeAttribute('aria-describedby');
        }
        if (ownsInvalid && control.getAttribute('aria-invalid') === 'true') {
          if (invalid === null) control.removeAttribute('aria-invalid');
          else control.setAttribute('aria-invalid', invalid);
        }
      });
    }
    return () => {
      for (const reset of restore) reset();
    };
  });

  return (
    <form
      {...props}
      // Lets an enclosing route overlay count typing here as unsaved input (`RouteOverlay`'s discard question).
      data-slot='feedback-form'
      // Compared by value instead (`values`), so an edit that is undone again does not count.
      data-tracks-values={tracksValues ? '' : undefined}
      noValidate
      ref={(element) => {
        formRef.current = element;
        if (typeof ref === 'function') return ref(element);
        if (ref) ref.current = element;
      }}
      onSubmit={(event) => {
        event.preventDefault();
        const current = feedback.begin();
        attemptRef.current = current;
        localValidationRef.current = true;
        const invalid = [...event.currentTarget.elements].filter(
          (
            control,
          ): control is
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =>
            (control instanceof HTMLInputElement ||
              control instanceof HTMLSelectElement ||
              control instanceof HTMLTextAreaElement) &&
            !noValidate &&
            control.willValidate &&
            !control.validity.valid,
        );
        if (invalid.length) {
          event.preventDefault();
          focusPendingRef.current = true;
          feedback.invalid(
            invalid.map((control) => ({
              field: control.dataset.fieldPath ?? control.name,
              message: control.validationMessage,
            })),
            current,
          );
          return;
        }
        // Tells an enclosing route overlay that the save is running, so the navigation it ends with does not ask to
        // discard the input (`RouteOverlay`'s `dirty`). The end waits one task, for a close the save started.
        const form = event.currentTarget;
        const announce = (phase: 'start' | 'end'): void => {
          form.dispatchEvent(
            new CustomEvent('nocobase:form-submit', {
              bubbles: true,
              detail: { phase },
            }),
          );
        };
        announce('start');
        let ended = false;
        const end = (): void => {
          if (ended) return;
          ended = true;
          if (saveEndRef.current === end) saveEndRef.current = null;
          announce('end');
        };
        const settle = (): void => {
          setTimeout(end, 0);
        };
        try {
          const result = onSubmit?.(event);
          if (result) void result.then(settle, settle);
          else {
            // The request runs on its own: wait for `submitting` to end, or end now if it never started.
            saveEndRef.current = end;
            setTimeout(() => {
              if (!submittingRef.current && saveEndRef.current === end) end();
            }, 0);
          }
          if (result)
            void result.catch((next: unknown) => {
              if (feedback.getAttemptSequence() !== current.sequence) return;
              focusPendingRef.current = true;
              feedback.failure(next, current);
            });
        } catch (next) {
          settle();
          if (feedback.getAttemptSequence() !== current.sequence) return;
          focusPendingRef.current = true;
          feedback.failure(next, current);
        }
      }}
    >
      {(formMessage ||
        (!attemptSequence && Boolean(error) && errorContent != null)) && (
        <div
          ref={messageRef}
          role='alert'
          tabIndex={-1}
          className='space-y-2 text-sm text-destructive'
        >
          {error && errors.length === 0 && errorContent != null ? (
            errorContent
          ) : (
            <p>{formMessage}</p>
          )}
        </div>
      )}
      {children}
      {errors.map((entry) => {
        const control = feedback.field(entry.id)?.control();
        return control?.parentElement && !existingFieldError(control)
          ? createPortal(
              <p
                id={`${entry.id}-error`}
                data-form-feedback-error
                className='text-sm text-destructive'
              >
                {entry.message}
              </p>,
              control.parentElement,
              entry.id,
            )
          : null;
      })}
    </form>
  );
}

function ancestors(control: HTMLElement): HTMLElement[] {
  const result: HTMLElement[] = [];
  for (
    let parent = control.parentElement;
    parent;
    parent = parent.parentElement
  )
    result.unshift(parent);
  return result;
}

/** Only explicitly associated application error nodes are trusted, never arbitrary nearby text. */
function existingFieldError(control: HTMLElement): HTMLElement | undefined {
  const errorIds = (control.getAttribute('aria-errormessage') ?? '').split(
    /\s+/,
  );
  const described = (control.getAttribute('aria-describedby') ?? '')
    .split(/\s+/)
    .map((id) => control.ownerDocument.getElementById(id))
    .filter((node) =>
      node?.matches('[data-slot="field-error"], [data-feedback-field-error]'),
    );
  const slot = control
    .closest('[data-slot="field"]')
    ?.querySelector<HTMLElement>('[data-slot="field-error"]');
  return [
    ...errorIds.map((id) => control.ownerDocument.getElementById(id)),
    ...described,
    slot,
  ].find((node): node is HTMLElement =>
    Boolean(node && !node.hasAttribute('data-form-feedback-error')),
  );
}

/** Resolve explicit accessible names; group entry buttons may use their visible text. */
function fieldLabel(control: HTMLElement): string {
  const labelledBy = (control.getAttribute('aria-labelledby') ?? '')
    .split(/\s+/)
    .map((id) => control.ownerDocument.getElementById(id)?.textContent?.trim())
    .filter(Boolean)
    .join(' ');
  if (labelledBy) return labelledBy;
  const ariaLabel = control.getAttribute('aria-label')?.trim();
  if (ariaLabel) return ariaLabel;
  if ('labels' in control) {
    const labels = Array.from(
      (control as HTMLInputElement).labels ?? [],
      (label) => label.textContent?.trim(),
    )
      .filter(Boolean)
      .join(' ');
    if (labels) return labels;
  }
  return control.matches('button, [role="button"]')
    ? (control.textContent?.trim() ?? '')
    : '';
}
