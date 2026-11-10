import { useNavigationGuard } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type PropsWithChildren,
  type ReactElement,
} from 'react';
import { useLocation } from 'react-router';
import { OwnDiscardQuestion } from '../components/route-overlay.js';
import { ConfirmAction } from '../pages/settings/shared.js';

/* eslint-disable react-refresh/only-export-components -- the route boundary and its hook share one context */

type Decision = boolean | Promise<boolean>;
interface Prompt {
  readonly owner: LeaveController;
  readonly title: string;
  readonly description: string;
}

class LeaveController {
  dirty = false;
  busy = false;
  active = false;
  private allowed = false;
  private pending?: {
    promise: Promise<boolean>;
    resolve: (value: boolean) => void;
  };

  constructor(
    readonly origin: string,
    private readonly show: (prompt: Prompt | undefined) => void,
  ) {}

  title = '';
  description = '';
  onDiscard?: () => void;

  update(
    dirty: boolean,
    busy: boolean,
    onDiscard: (() => void) | undefined,
    title: string,
    description: string,
  ): void {
    this.dirty = dirty;
    this.busy = busy;
    this.onDiscard = onDiscard;
    this.title = title;
    this.description = description;
  }

  guard = (): Decision => {
    if (this.allowed) return true;
    if (this.busy) return false;
    if (!this.dirty) return true;
    if (!this.pending) {
      let resolve!: (value: boolean) => void;
      const promise = new Promise<boolean>((done) => {
        resolve = done;
      });
      this.pending = { promise, resolve };
      this.show({
        owner: this,
        title: this.title,
        description: this.description,
      });
    }
    return this.pending.promise;
  };

  decide(value: boolean): void {
    if (value) this.onDiscard?.();
    this.allowed = value;
    this.pending?.resolve(value);
    this.pending = undefined;
    this.show(undefined);
  }

  allow = (): void => {
    this.allowed = true;
  };
  reset(): void {
    this.allowed = false;
  }
  cancel(): void {
    if (this.pending) this.decide(false);
  }
}

class LeaveScope {
  private readonly entries = new Set<LeaveController>();
  private hidden = false;
  private generation = 0;
  constructor(private readonly dirtyChanged: (dirty: boolean) => void) {}

  changed = (): void => {
    this.dirtyChanged([...this.entries].some((entry) => entry.dirty));
  };
  attach(entry: LeaveController): void {
    entry.active = true;
    this.entries.add(entry);
    this.changed();
  }
  detach(entry: LeaveController): void {
    entry.active = false;
    // Activity disconnects Effects before the shell commits its new visibility.
    queueMicrotask(() => {
      if (!entry.active && !this.hidden) this.remove(entry);
    });
  }
  private remove(entry: LeaveController): void {
    this.entries.delete(entry);
    entry.cancel();
    this.changed();
  }
  update(hidden: boolean, pathname: string): void {
    if (this.hidden !== hidden) {
      this.generation += 1;
      this.hidden = hidden;
      // A confirmation started before concealment must not discard or resume its old navigation on recovery.
      if (hidden) for (const entry of this.entries) entry.cancel();
    }
    for (const entry of this.entries) {
      if (pathname !== entry.origin && !pathname.startsWith(`${entry.origin}/`))
        this.remove(entry);
      else entry.reset();
    }
  }
  prune(): void {
    if (!this.hidden)
      for (const entry of this.entries) if (!entry.active) this.remove(entry);
  }
  guard = (): Decision => {
    const generation = this.generation;
    const remaining = [...this.entries];
    const next = (): Decision => {
      if (
        generation !== this.generation ||
        (this.hidden && this.entries.size > 0)
      )
        return false;
      const entry = remaining.shift();
      if (!entry) return true;
      const value = entry.guard();
      return typeof value === 'boolean'
        ? value && next()
        : value.then((allowed) => allowed && next());
    };
    return next();
  };
  dispose(): void {
    for (const entry of this.entries) entry.cancel();
    this.entries.clear();
  }
}

interface BoundaryContext {
  readonly scope: LeaveScope;
  readonly show: (prompt: Prompt | undefined) => void;
}
const Context = createContext<BoundaryContext | undefined>(undefined);

function useBeforeUnload(dirty: boolean): void {
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
}

function promptDialog(prompt: Prompt | undefined): ReactElement | null {
  return prompt ? (
    <ConfirmAction
      open
      title={prompt.title}
      description={prompt.description}
      busy={false}
      onCancel={() => prompt.owner.decide(false)}
      onConfirm={() => prompt.owner.decide(true)}
    />
  ) : null;
}

/** The shell owns leave decisions and their UI, outside every page's Activity and its nested routes. */
export function RouteLeaveBoundary({
  hidden,
  children,
}: PropsWithChildren<{ readonly hidden: boolean }>): ReactElement {
  const location = useLocation();
  const [prompt, setPrompt] = useState<Prompt>();
  const [dirty, setDirty] = useState(false);
  const [context] = useState(() => ({
    scope: new LeaveScope(setDirty),
    show: setPrompt,
  }));
  useNavigationGuard(context.scope.guard);
  useBeforeUnload(dirty);
  useLayoutEffect(
    () => context.scope.update(hidden, location.pathname),
    [context, hidden, location.pathname, location.key],
  );
  useEffect(() => {
    context.scope.prune();
  }, [context, hidden]);
  useEffect(() => () => context.scope.dispose(), [context]);
  return (
    <Context.Provider value={context}>
      {children}
      {promptDialog(prompt)}
    </Context.Provider>
  );
}

/** Compatible with standalone form renders; routed forms keep protection in the shell during permission rechecks. */
export function usePageLeave(
  dirty: boolean,
  busy: boolean,
  onDiscard?: () => void,
) {
  const boundary = useContext(Context);
  const { t } = useTranslation();
  const location = useLocation();
  const [prompt, setPrompt] = useState<Prompt>();
  const [controller] = useState(
    () => new LeaveController(location.pathname, boundary?.show ?? setPrompt),
  );
  useNavigationGuard(boundary ? () => true : controller.guard);
  useBeforeUnload(!boundary && dirty);
  useLayoutEffect(() => {
    controller.update(
      dirty,
      busy,
      onDiscard,
      t('settings.discardTitle'),
      t('settings.discardHint'),
    );
    boundary?.scope.changed();
  }, [controller, dirty, busy, onDiscard, boundary, t]);
  useLayoutEffect(() => {
    controller.reset();
  }, [controller, location.key]);
  useLayoutEffect(() => {
    if (!boundary) return () => controller.cancel();
    boundary.scope.attach(controller);
    return () => boundary.scope.detach(controller);
  }, [boundary, controller]);
  return {
    guard: controller.guard,
    allow: controller.allow,
    // Rendered inside the form's overlay, where it also tells the overlay that this form asks its own question.
    dialog: (
      <>
        <OwnDiscardQuestion />
        {boundary ? null : promptDialog(prompt)}
      </>
    ),
  };
}
