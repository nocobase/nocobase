/**
 * System settings › API keys › Rules: whether "same as me" personal keys are allowed, how long a personal key may live
 * and starts with, and after how many idle days keys are disabled. They act on keys made or rotated afterwards. Who
 * may do what is a role permission, not a rule, which the page says.
 */
import { useToaster } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { InfoIcon } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Link } from 'react-router';

import { Alert, AlertDescription } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import { Checkbox } from '#components/ui/checkbox';
import { Skeleton } from '#components/ui/skeleton';
import { ErrorAlert } from '../components/key-parts.js';
import { SystemFrame } from '../components/system-frame.js';
import { useApiKeysAdminApi, type KeyRules } from '../lib/admin-api.js';
import { API_KEYS_NAMESPACE } from '../namespace.js';

const API_KEYS = { type: 'settings', id: 'apiKeys' } as const;
const MAX_CHOICES = [30, 90, 180, 365] as const;
const DEFAULT_CHOICES = [7, 30, 90, 180, 365] as const;
const IDLE_CHOICES = [30, 60, 90, 180] as const;
type Draft = Omit<KeyRules, 'idleSince' | 'saved'>;

export default function KeyRulesPage(): ReactElement {
  const { t } = useTranslation(API_KEYS_NAMESPACE);
  const admin = useApiKeysAdminApi();
  const toaster = useToaster();
  const { can: mayManage } = useCan({ resource: API_KEYS, action: 'manage' });
  const [rules, setRules] = useState<KeyRules>();
  const [draft, setDraft] = useState<Draft>();
  const [error, setError] = useState<unknown>();
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => {
    setError(undefined);
    setRevision((value) => value + 1);
  }, []);
  useEffect(() => {
    let active = true;
    admin.rules().then(
      (found) => {
        if (!active) return;
        setRules(found);
        setDraft({
          allowSameAsMe: found.allowSameAsMe,
          personalMaxDays: found.personalMaxDays,
          personalDefaultDays: found.personalDefaultDays,
          idleDisableDays: found.idleDisableDays,
        });
      },
      (failure: unknown) => {
        if (active) setError(failure);
      },
    );
    return () => {
      active = false;
    };
  }, [admin, revision]);
  const dirty =
    rules !== undefined &&
    draft !== undefined &&
    (draft.allowSameAsMe !== rules.allowSameAsMe ||
      draft.personalMaxDays !== rules.personalMaxDays ||
      draft.personalDefaultDays !== rules.personalDefaultDays ||
      draft.idleDisableDays !== rules.idleDisableDays);
  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const saved = await admin.saveRules(draft);
      setRules(saved);
      toaster.show({ type: 'success', title: t('rules.saved') });
    } catch {
      toaster.show({ type: 'error', title: t('rules.failed') });
    } finally {
      setSaving(false);
    }
  };
  const update = (patch: Partial<Draft>) =>
    setDraft((current) => {
      if (!current) return current;
      const next = { ...current, ...patch };
      // The default cannot outlive the longest allowed.
      if (
        next.personalMaxDays !== null &&
        next.personalDefaultDays > next.personalMaxDays
      )
        return { ...next, personalDefaultDays: next.personalMaxDays };
      return next;
    });
  const readOnly = !mayManage;
  return (
    <SystemFrame tab='rules'>
      {error ? (
        <ErrorAlert error={error} onRetry={reload} />
      ) : !draft ? (
        <Skeleton className='h-80 w-full' />
      ) : (
        <section className='grid min-w-0 gap-5 rounded-xl border bg-card p-4 text-card-foreground sm:p-6'>
          <Alert>
            <InfoIcon aria-hidden />
            <AlertDescription>
              {t('rules.newKeysOnly')}{' '}
              <Link to='/settings/roles' className='underline'>
                {t('rules.whoMay')}
              </Link>
            </AlertDescription>
          </Alert>
          <Rule
            title={t('rules.sameAsMe.title')}
            description={t('rules.sameAsMe.description')}
          >
            <label className='inline-flex items-center gap-2 text-sm'>
              <Checkbox
                checked={draft.allowSameAsMe}
                disabled={readOnly}
                onCheckedChange={(checked: boolean) =>
                  update({ allowSameAsMe: checked })
                }
              />
              {t('rules.sameAsMe.allow')}
            </label>
          </Rule>
          <Rule
            title={t('rules.maxDays.title')}
            description={t('rules.maxDays.description')}
          >
            <Choices
              label={t('rules.maxDays.title')}
              value={draft.personalMaxDays}
              choices={[...MAX_CHOICES, null]}
              disabled={readOnly}
              format={(value) =>
                value === null
                  ? t('rules.noLimit')
                  : t('create.days', { count: value })
              }
              onChange={(value) => update({ personalMaxDays: value })}
            />
          </Rule>
          <Rule
            title={t('rules.defaultDays.title')}
            description={t('rules.defaultDays.description')}
          >
            <Choices
              label={t('rules.defaultDays.title')}
              value={draft.personalDefaultDays}
              choices={DEFAULT_CHOICES.filter(
                (value) =>
                  draft.personalMaxDays === null ||
                  value <= draft.personalMaxDays,
              )}
              disabled={readOnly}
              format={(value) => t('create.days', { count: value })}
              onChange={(value) => update({ personalDefaultDays: value })}
            />
          </Rule>
          <Rule
            title={t('rules.idle.title')}
            description={t('rules.idle.description')}
          >
            <Choices
              label={t('rules.idle.title')}
              value={draft.idleDisableDays}
              choices={[null, ...IDLE_CHOICES]}
              disabled={readOnly}
              format={(value) =>
                value === null
                  ? t('rules.idle.off')
                  : t('create.days', { count: value })
              }
              onChange={(value) => update({ idleDisableDays: value })}
            />
          </Rule>
          {mayManage ? (
            <div className='flex flex-wrap justify-end gap-2 border-t pt-4'>
              {dirty && rules ? (
                <Button
                  type='button'
                  variant='outline'
                  onClick={() =>
                    setDraft({
                      allowSameAsMe: rules.allowSameAsMe,
                      personalMaxDays: rules.personalMaxDays,
                      personalDefaultDays: rules.personalDefaultDays,
                      idleDisableDays: rules.idleDisableDays,
                    })
                  }
                >
                  {t('system.detail.discard')}
                </Button>
              ) : null}
              <Button
                type='button'
                disabled={!dirty || saving}
                onClick={() => void save()}
              >
                {t('system.detail.save')}
              </Button>
            </div>
          ) : (
            <p className='text-xs text-muted-foreground'>
              {t('rules.readOnly')}
            </p>
          )}
        </section>
      )}
    </SystemFrame>
  );
}

function Rule({
  title,
  description,
  children,
}: {
  readonly title: string;
  readonly description: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className='grid min-w-0 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:gap-6'>
      <div className='grid gap-1'>
        <span className='text-sm font-medium'>{title}</span>
        <span className='text-xs text-muted-foreground'>{description}</span>
      </div>
      <div className='min-w-0'>{children}</div>
    </div>
  );
}

function Choices<T extends number | null>({
  label,
  value,
  choices,
  disabled,
  format,
  onChange,
}: {
  readonly label: string;
  readonly value: T;
  readonly choices: readonly T[];
  readonly disabled: boolean;
  readonly format: (value: T) => string;
  readonly onChange: (value: T) => void;
}): ReactElement {
  return (
    <div
      role='radiogroup'
      aria-label={label}
      className='inline-flex w-fit max-w-full flex-wrap overflow-hidden rounded-lg border'
    >
      {choices.map((choice) => {
        const checked = choice === value;
        return (
          <button
            key={String(choice)}
            type='button'
            role='radio'
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(choice)}
            className={`border-l px-3 py-1.5 text-sm first:border-l-0 disabled:cursor-not-allowed ${checked ? 'bg-primary text-primary-foreground' : 'hover:bg-muted disabled:hover:bg-transparent'}`}
          >
            {format(choice)}
          </button>
        );
      })}
    </div>
  );
}
