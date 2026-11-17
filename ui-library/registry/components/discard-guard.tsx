import {
  NavigationGuardContext,
  useNavigationGuard,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';

import { UnsavedValuesContext } from '#components/feedback-form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#components/ui/alert-dialog';

/* eslint-disable react-refresh/only-export-components -- the scope, its guard and the form snapshot share one module */

/**
 * What a user can see of a form's values: every field, named or not (React Hook Form's `register`, controlled inputs,
 * hidden inputs of pickers), plus the state of widgets that keep theirs outside a field, such as a Select's trigger text and a checkbox's or
 * switch's checked state.
 */
export function formSnapshot(form: HTMLFormElement): string {
  const fields = [...form.elements].map((field) =>
    field instanceof HTMLInputElement
      ? field.type === 'checkbox' || field.type === 'radio'
        ? String(field.checked)
        : field.type === 'file'
          ? [...(field.files ?? [])].map((file) => `${file.name}:${file.size}`)
          : field.value
      : field instanceof HTMLTextAreaElement ||
          field instanceof HTMLSelectElement
        ? field.value
        : '',
  );
  const widgets = [
    ...form.querySelectorAll(
      '[role="combobox"], [role="checkbox"], [role="switch"], [role="radio"], [aria-pressed]',
    ),
  ].map((widget) => [
    widget.getAttribute('aria-checked') ??
      widget.getAttribute('aria-pressed') ??
      '',
    widget instanceof HTMLInputElement ? '' : (widget.textContent ?? ''),
  ]);
  return JSON.stringify([fields, widgets]);
}

/** Dispatched by `FeedbackForm` on its form, with `detail.phase` `'start'` or `'end'`, around its `onSubmit`. */
/** The elements of every mounted discard scope, so a form belongs to the innermost one around it. */
const scopes = new WeakSet<Element>();

function nearestScope(form: Element): Element | null {
  for (let node = form.parentElement; node; node = node.parentElement)
    if (scopes.has(node)) return node;
  return null;
}

export const FORM_SUBMIT_EVENT = 'nocobase:form-submit';

const DiscardOwnerContext = createContext<{
  readonly claim: () => () => void;
} | null>(null);

/**
 * Rendered inside a route overlay by the template's own forms that already ask an unsaved-changes question of their
 * own (the settings forms' `usePageLeave`): the overlay leaves the question to them instead of asking twice.
 * Application forms do not render it; they rely on the overlay's question. A kept draft or working storage is never a
 * reason to: the draft restores input after a reload, while leaving on purpose still asks, and a guard that only blocks
 * while a save runs asks nothing (mobile.md M7.4).
 */
export function OwnDiscardQuestion(): null {
  const owners = useContext(DiscardOwnerContext);
  useLayoutEffect(() => owners?.claim(), [owners]);
  return null;
}

/**
 * Asks "Discard changes?" before leaving a layer with unsaved input. Closing a layer is navigation, so one navigation
 * guard covers every way out; while it waits the application keeps the layer and its input mounted, and restores the
 * URL when the answer is "Keep editing". The confirmation is the one layer allowed above an overlay (mobile.md M7.2).
 */
function DiscardGuard({
  dirty,
  ownersRef,
  formsRef,
  containerRef,
}: {
  readonly dirty: boolean | (() => boolean) | undefined;
  readonly ownersRef: RefObject<number>;
  readonly formsRef: RefObject<Set<() => boolean>>;
  readonly containerRef: RefObject<HTMLElement | null> | null;
}): ReactElement {
  const { t } = useTranslation();
  const dirtyRef = useRef(dirty);
  useLayoutEffect(() => {
    dirtyRef.current = dirty;
  });
  // What the overlay saw itself: each form's fields just before the user first touched it, forms edited before any
  // such moment, and how many of its FeedbackForm submissions are running.
  const baselinesRef = useRef(new Map<HTMLFormElement, string>());
  const editedRef = useRef(new Set<HTMLFormElement>());
  // The forms of this layer whose save is running, by element: one that has left the page (the save navigated away and
  // unmounted it) no longer counts, whether or not its end ever arrives.
  const savingRef = useRef(new Set<Element>());
  useEffect(() => {
    const popup = containerRef?.current;
    if (!popup) return;
    // A layer nested inside this one (a child page of a tab) asks for its own forms.
    scopes.add(popup);
    // Every form inside counts, a plain `<form>` as much as a FeedbackForm, so a page cannot leave the question out by
    // its choice of form. Not counted: a search form (`role='search'`), and a FeedbackForm that reports its values,
    // which is compared with its saved values instead.
    const tracked = (target: EventTarget | null): HTMLFormElement | null => {
      if (!(target instanceof Element)) return null;
      const form = target.closest('form');
      return form &&
        nearestScope(form) === popup &&
        form.getAttribute('role') !== 'search' &&
        form.dataset.tracksValues === undefined
        ? form
        : null;
    };
    // The fields as they are before the user's first touch, so a value changed back again is not unsaved.
    const touch = (event: Event): void => {
      const form = tracked(event.target);
      if (form && !baselinesRef.current.has(form))
        baselinesRef.current.set(form, formSnapshot(form));
    };
    const edit = (event: Event): void => {
      const form = tracked(event.target);
      if (form && !baselinesRef.current.has(form)) editedRef.current.add(form);
    };
    const submit = (event: Event): void => {
      // Only this layer's own forms: a nested layer's save is that layer's business.
      const form = event.target;
      if (!(form instanceof Element) || nearestScope(form) !== popup) return;
      const { phase } = (event as CustomEvent<{ phase?: string }>).detail ?? {};
      if (phase === 'start') savingRef.current.add(form);
      else if (phase === 'end') savingRef.current.delete(form);
    };
    // A key or a pointer, not focus: an overlay focuses its first field by itself while a picker may still be loading
    // its label, and that is not the user's input.
    popup.addEventListener('keydown', touch, true);
    popup.addEventListener('pointerdown', touch, true);
    popup.addEventListener('input', edit, true);
    popup.addEventListener('change', edit, true);
    popup.addEventListener(FORM_SUBMIT_EVENT, submit);
    return () => {
      popup.removeEventListener('keydown', touch, true);
      popup.removeEventListener('pointerdown', touch, true);
      popup.removeEventListener('input', edit, true);
      popup.removeEventListener('change', edit, true);
      popup.removeEventListener(FORM_SUBMIT_EVENT, submit);
    };
  }, [containerRef]);
  const isDirty = useCallback((): boolean => {
    // The save's own navigation — only a FeedbackForm reports one: leaving while its onSubmit runs. A plain `<form>`
    // tells nobody whether its save succeeded, and no way of leaving tells it either, so after a plain form's save it
    // still asks: one question too many rather than input lost after a failed save. Or a form inside asks its own.
    if (
      [...savingRef.current].some((form) => form.isConnected) ||
      ownersRef.current > 0
    )
      return false;
    // A disabled save button, such as while validation fails, never means there is nothing to lose.
    const current = dirtyRef.current;
    return (
      [...baselinesRef.current].some(
        ([form, before]) => form.isConnected && formSnapshot(form) !== before,
      ) ||
      [...editedRef.current].some((form) => form.isConnected) ||
      [...formsRef.current].some((unsaved) => unsaved()) ||
      (typeof current === 'function' ? current() : current === true)
    );
  }, [ownersRef, formsRef]);
  // The pending question, so a second attempt to leave while it is open waits for the same answer.
  const promptRef = useRef<{
    readonly promise: Promise<boolean>;
    readonly resolve: (discard: boolean) => void;
  } | null>(null);
  const [asking, setAsking] = useState(false);
  useNavigationGuard(() => {
    if (!isDirty()) return true;
    if (promptRef.current) return promptRef.current.promise;
    let resolve!: (discard: boolean) => void;
    const promise = new Promise<boolean>((done) => {
      resolve = done;
    });
    promptRef.current = { promise, resolve };
    setAsking(true);
    return promise;
  });
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent): void => {
      if (isDirty()) event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => {
      window.removeEventListener('beforeunload', warn);
      // Unmounted while asking: the navigation it held does not go ahead.
      promptRef.current?.resolve(false);
      promptRef.current = null;
    };
  }, [isDirty]);
  const answer = (discard: boolean): void => {
    promptRef.current?.resolve(discard);
    promptRef.current = null;
    setAsking(false);
  };
  return (
    <AlertDialog
      open={asking}
      onOpenChange={(open) => {
        if (!open) answer(false);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('routeOverlay.discardTitle', {
              defaultValue: 'Discard changes?',
            })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('routeOverlay.discardDescription', {
              defaultValue:
                'Your changes have not been saved and will be lost.',
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t('routeOverlay.keepEditing', { defaultValue: 'Keep editing' })}
          </AlertDialogCancel>
          <AlertDialogAction variant='destructive' onClick={() => answer(true)}>
            {t('routeOverlay.discard', { defaultValue: 'Discard' })}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * The unsaved-changes question of one layer — a `RouteDialog`, a `RouteDrawer` or a `RouteChildPage` — for every form
 * rendered inside `containerRef` (guideline T3.9, mobile.md M7.4): once a form there differs from what is saved, every
 * way out of the layer asks "Discard changes?" first, and reloading or closing the tab gets the browser's warning. A
 * `FeedbackForm` with `values` and `savedValues` is compared with them; any other form with how it was just before the
 * user first touched it. `dirty` only adds. Inside an application only: a test or preview without the application's
 * navigation boundary renders its children alone.
 */
export function DiscardScope({
  containerRef,
  dirty,
  children,
}: {
  readonly containerRef: RefObject<HTMLElement | null> | null;
  readonly dirty?: boolean | (() => boolean);
  readonly children?: ReactNode;
}): ReactNode {
  const guarded = useContext(NavigationGuardContext) !== null;
  // How many forms inside ask their own unsaved-changes question (`OwnDiscardQuestion`).
  const ownersRef = useRef(0);
  const owners = useMemo(
    () => ({
      claim: (): (() => void) => {
        ownersRef.current += 1;
        return () => {
          ownersRef.current -= 1;
        };
      },
    }),
    [],
  );
  // The FeedbackForms inside that compare their values with the saved ones.
  const formsRef = useRef(new Set<() => boolean>());
  const forms = useMemo(
    () => ({
      register: (unsaved: () => boolean): (() => void) => {
        formsRef.current.add(unsaved);
        return () => {
          formsRef.current.delete(unsaved);
        };
      },
    }),
    [],
  );
  if (!guarded) return children;
  return (
    <DiscardOwnerContext.Provider value={owners}>
      <UnsavedValuesContext.Provider value={forms}>
        {children}
        <DiscardGuard
          dirty={dirty}
          ownersRef={ownersRef}
          formsRef={formsRef}
          containerRef={containerRef}
        />
      </UnsavedValuesContext.Provider>
    </DiscardOwnerContext.Provider>
  );
}
