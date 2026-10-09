import { useTranslation } from '@nocobase/i18n/client';
import { ChevronDown, ShieldCheck } from 'lucide-react';
import { useEffect, useState, type ReactElement, type ReactNode } from 'react';

import { Button } from '#components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#components/ui/dropdown-menu';
import { cn } from 'cn';

import type { ApprovalTone } from './types.js';

/** The values an action's form collects. */
export type ApprovalActionValues = Record<string, unknown>;

/** What an action's form is rendered with. */
export interface ApprovalActionFormProps {
  readonly values: ApprovalActionValues;
  readonly setValues: (values: ApprovalActionValues) => void;
  /** The fields `validate` reported on the last attempt to submit. */
  readonly invalid: readonly string[];
  /** What `load` resolved with, or undefined while it loads or when there is none. */
  readonly loaded: unknown;
  readonly busy: boolean;
}

/** The inputs an action asks for, drawn by the application with its own fields. */
export interface ApprovalActionForm {
  readonly initialValues?: ApprovalActionValues;
  /**
   * Loads what the fields need once the form opens, such as the people a
   * task may be handed over to. The signal aborts when the form closes or
   * another action's form replaces it, so a late answer is dropped.
   */
  readonly load?: (signal: AbortSignal) => Promise<unknown>;
  /** What the form says when `load` fails, such as which list could not be loaded; defaults to a general message. */
  readonly loadError?: string;
  /** The names of the fields that are not valid yet, given what `load` resolved with; the form does not submit while there are any. */
  readonly validate?: (
    values: ApprovalActionValues,
    loaded: unknown,
  ) => readonly string[];
  /** What the action does, under the form's title, such as where a return sends the request and which opinions it keeps. */
  readonly description?: ReactNode;
  /** The submit button's wording when it should differ from the action's label. */
  readonly submitLabel?: string;
  readonly render: (props: ApprovalActionFormProps) => ReactNode;
}

/** One thing the person can do here, as a control and, when it asks for input, a form. */
export interface ApprovalBarAction {
  readonly key: string;
  readonly label: string;
  /** `task` and `record` actions sit under "More" unless primary; `admin` actions get a group of their own. Defaults to `task`. */
  readonly group?: 'task' | 'record' | 'admin';
  readonly tone?: ApprovalTone;
  /** Whether it is one of the buttons rather than a menu entry. */
  readonly primary?: boolean;
  /** Opens a form above the bar before it runs. */
  readonly form?: ApprovalActionForm;
  /** Asks for a confirmation before it runs, when it has no form. */
  readonly confirm?: boolean;
  /** Runs the action; resolving `false` keeps its form open, as after a refusal the page reported. */
  readonly run: (values: ApprovalActionValues) => Promise<boolean | void>;
}

const VARIANTS: Readonly<
  Record<ApprovalTone, 'default' | 'destructive' | 'outline'>
> = {
  primary: 'default',
  danger: 'destructive',
  default: 'outline',
};

function ActionForm({
  action,
  busy,
  onRun,
  onClose,
}: {
  readonly action: ApprovalBarAction;
  readonly busy: boolean;
  readonly onRun: (
    action: ApprovalBarAction,
    values: ApprovalActionValues,
  ) => Promise<boolean>;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation();
  // Kept from when the form opened: a page that rebuilds its actions on
  // every render would otherwise load the form's data again each time.
  const [form] = useState(action.form);
  const [values, setValues] = useState<ApprovalActionValues>(
    form?.initialValues ?? {},
  );
  const [invalid, setInvalid] = useState<readonly string[]>([]);
  const [load, setLoad] = useState<{
    readonly state: 'loading' | 'loaded' | 'failed';
    readonly value?: unknown;
  }>({ state: form?.load ? 'loading' : 'loaded' });
  useEffect(() => {
    if (!form?.load) return undefined;
    const controller = new AbortController();
    form.load(controller.signal).then(
      (value) => {
        if (!controller.signal.aborted) setLoad({ state: 'loaded', value });
      },
      () => {
        if (!controller.signal.aborted) setLoad({ state: 'failed' });
      },
    );
    return () => controller.abort();
  }, [form]);
  const blocked = busy || load.state !== 'loaded';
  const tone = action.tone ?? 'default';
  return (
    <form
      aria-label={action.label}
      className='max-h-[50vh] space-y-3 overflow-y-auto rounded-xl border bg-muted/30 p-4'
      onSubmit={(event) => {
        event.preventDefault();
        if (blocked) return;
        const missing = form?.validate?.(values, load.value) ?? [];
        setInvalid(missing);
        if (missing.length) return;
        void onRun(action, values).then((done) => {
          if (done) onClose();
        });
      }}
    >
      <div className='space-y-1'>
        <div className='text-sm font-medium'>{action.label}</div>
        {form?.description ? (
          <div className='text-xs text-muted-foreground'>
            {form.description}
          </div>
        ) : null}
      </div>
      {load.state === 'loading' ? (
        <p role='status' className='text-sm text-muted-foreground'>
          {t('approvalUi.actions.loading', { defaultValue: 'Loading…' })}
        </p>
      ) : null}
      {load.state === 'failed' ? (
        <p role='alert' className='text-sm text-destructive'>
          {form?.loadError ??
            t('approvalUi.actions.loadFailed', {
              defaultValue: 'This could not be loaded. Close it and try again.',
            })}
        </p>
      ) : null}
      {form ? (
        load.state === 'loaded' ? (
          form.render({
            values,
            setValues,
            invalid,
            loaded: load.value,
            busy,
          })
        ) : null
      ) : (
        <p className='text-sm text-muted-foreground'>
          {t('approvalUi.actions.confirm', {
            action: action.label,
            defaultValue: '{{action}}?',
          })}
        </p>
      )}
      <div className='flex gap-2'>
        <Button
          type='submit'
          disabled={blocked}
          variant={tone === 'danger' ? 'destructive' : 'default'}
        >
          {form?.submitLabel ?? action.label}
        </Button>
        <Button type='button' variant='ghost' onClick={onClose}>
          {t('approvalUi.actions.cancel', { defaultValue: 'Cancel' })}
        </Button>
      </div>
    </form>
  );
}

export interface ApprovalActionBarProps {
  readonly actions: readonly ApprovalBarAction[];
  /** While an action runs: every control is disabled. */
  readonly busy?: boolean;
  /** Further controls at the end of the bar, such as a menu of the page's own. */
  readonly children?: ReactNode;
  /**
   * How many actions the bar lays out as buttons before the ones that are
   * not primary move under "More". Defaults to 4: a menu only pays for
   * itself once the bar would otherwise crowd.
   */
  readonly maxButtons?: number;
  readonly className?: string;
}

/**
 * What the person can do now, as the bar along the bottom of a request:
 * every action as a button while there are few, otherwise the primary ones
 * as buttons and the rest under "More", and an administrator's in a group
 * of their own. An action with a form or a confirmation opens it above the
 * bar; any other runs at once.
 */
export function ApprovalActionBar({
  actions,
  busy = false,
  children,
  maxButtons = 4,
  className,
}: ApprovalActionBarProps): ReactElement | null {
  const { t } = useTranslation();
  const [open, setOpen] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  if (!actions.length && !children) return null;
  const disabled = busy || running;
  const run = async (
    action: ApprovalBarAction,
    values: ApprovalActionValues,
  ): Promise<boolean> => {
    setRunning(true);
    try {
      return (await action.run(values)) !== false;
    } finally {
      setRunning(false);
    }
  };
  const chosen = actions.find((action) => action.key === open);
  const press = (action: ApprovalBarAction): void => {
    if (!action.form && !action.confirm) {
      setOpen(null);
      void run(action, {});
      return;
    }
    setOpen(open === action.key ? null : action.key);
  };
  const group = (action: ApprovalBarAction): string => action.group ?? 'task';
  const own = actions.filter((action) => group(action) !== 'admin');
  // Hiding actions behind a menu only helps once there are too many to lay
  // out; a menu of one entry never does.
  const laidOut =
    own.length <= maxButtons ||
    own.filter((action) => !action.primary).length === 1;
  const main = laidOut
    ? [
        ...own.filter((action) => action.primary),
        ...own.filter((action) => !action.primary),
      ]
    : own.filter((action) => action.primary);
  const menus = [
    {
      key: 'more',
      label: null,
      items: laidOut ? [] : own.filter((action) => !action.primary),
    },
    {
      key: 'admin',
      label: t('approvalUi.actions.admin', { defaultValue: 'Administration' }),
      items: actions.filter((action) => group(action) === 'admin'),
    },
  ].filter((menu) => menu.items.length);
  // The administrator's menu alone says what it holds.
  const adminOnly = menus.length === 1 && menus[0].key === 'admin';
  return (
    <div className={cn('space-y-3', className)}>
      {chosen ? (
        <ActionForm
          key={chosen.key}
          action={chosen}
          busy={disabled}
          onRun={run}
          onClose={() => setOpen(null)}
        />
      ) : null}
      <div className='flex flex-wrap items-center gap-2'>
        {main.map((action) => (
          <Button
            key={action.key}
            variant={VARIANTS[action.tone ?? 'default']}
            disabled={disabled}
            aria-expanded={
              action.form || action.confirm ? open === action.key : undefined
            }
            onClick={() => press(action)}
            className={cn(open === action.key && 'ring-3 ring-ring/40')}
          >
            {action.label}
          </Button>
        ))}
        {menus.length ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant='outline' disabled={disabled}>
                  {adminOnly ? (
                    <>
                      <ShieldCheck />
                      {t('approvalUi.actions.admin', {
                        defaultValue: 'Administration',
                      })}
                    </>
                  ) : main.length ? (
                    t('approvalUi.actions.more', { defaultValue: 'More' })
                  ) : (
                    t('approvalUi.actions.all', { defaultValue: 'Actions' })
                  )}
                  <ChevronDown />
                </Button>
              }
            />
            <DropdownMenuContent align={main.length ? 'end' : 'start'}>
              {menus.map((menu, index) => (
                <DropdownMenuGroup key={menu.key}>
                  {index > 0 ? <DropdownMenuSeparator /> : null}
                  {menu.label && !adminOnly ? (
                    <DropdownMenuLabel>
                      <ShieldCheck />
                      {menu.label}
                    </DropdownMenuLabel>
                  ) : null}
                  {menu.items.map((action) => (
                    <DropdownMenuItem
                      key={action.key}
                      variant={
                        action.tone === 'danger' ? 'destructive' : 'default'
                      }
                      onClick={() => press(action)}
                    >
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        {children}
      </div>
    </div>
  );
}
