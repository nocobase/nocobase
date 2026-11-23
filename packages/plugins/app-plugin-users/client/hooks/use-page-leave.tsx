import { useNavigationGuard } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useLayoutEffect, useState, type ReactElement } from 'react';
import { useLocation } from 'react-router';

import { USERS_NAMESPACE } from '../namespace.js';
import { ConfirmAction } from '../pages/users/shared.js';

type Decision = boolean | Promise<boolean>;

class LeaveController {
  private dirty = false;
  private busy = false;
  private allowed = false;
  private onDiscard?: () => void;
  private pending?: {
    readonly promise: Promise<boolean>;
    readonly resolve: (value: boolean) => void;
  };

  public constructor(private readonly show: (open: boolean) => void) {}

  public update(
    dirty: boolean,
    busy: boolean,
    onDiscard: (() => void) | undefined,
  ): void {
    this.dirty = dirty;
    this.busy = busy;
    this.onDiscard = onDiscard;
  }

  public guard = (): Decision => {
    if (this.allowed) return true;
    if (this.busy) return false;
    if (!this.dirty) return true;
    if (!this.pending) {
      let resolve!: (value: boolean) => void;
      const promise = new Promise<boolean>((done) => {
        resolve = done;
      });
      this.pending = { promise, resolve };
      this.show(true);
    }
    return this.pending.promise;
  };

  public decide(value: boolean): void {
    if (value) this.onDiscard?.();
    this.allowed = value;
    this.pending?.resolve(value);
    this.pending = undefined;
    this.show(false);
  }

  /** Lets the next navigation through, such as closing the form after a successful save. */
  public allow = (): void => {
    this.allowed = true;
  };

  public reset(): void {
    this.allowed = false;
  }

  public cancel(): void {
    if (this.pending) this.decide(false);
  }
}

/**
 * Asks "Discard changes?" before a form with unsaved input is left by any way out: the overlay's close, browser back
 * and forward, and links. Reloading or closing the tab gets the browser's own warning.
 */
export function usePageLeave(
  dirty: boolean,
  busy: boolean,
  onDiscard?: () => void,
): {
  readonly guard: () => Decision;
  readonly allow: () => void;
  readonly dialog: ReactElement | null;
} {
  const { t } = useTranslation(USERS_NAMESPACE);
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [controller] = useState(() => new LeaveController(setOpen));
  useNavigationGuard(controller.guard);
  useLayoutEffect(() => {
    controller.update(dirty, busy, onDiscard);
  }, [controller, dirty, busy, onDiscard]);
  useLayoutEffect(() => {
    controller.reset();
  }, [controller, location.key]);
  useLayoutEffect(() => () => controller.cancel(), [controller]);
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  return {
    guard: controller.guard,
    allow: controller.allow,
    dialog: open ? (
      <ConfirmAction
        open
        title={t('management.discardTitle')}
        description={t('management.discardHint')}
        busy={false}
        onCancel={() => controller.decide(false)}
        onConfirm={() => controller.decide(true)}
      />
    ) : null,
  };
}
