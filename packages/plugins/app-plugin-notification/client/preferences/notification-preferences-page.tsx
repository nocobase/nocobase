import { LockIcon } from 'lucide-react';
import { Fragment, useState, type ReactElement } from 'react';

import type {
  NotificationPreferenceKind,
  NotificationPreferencesView,
} from '../../shared/preferences.js';
import { Switch } from '../components/ui/switch.js';
import { useNotificationPreferenceSections } from '../extensions.js';
import { useLoaded, useSettingsApi } from '../settings/hooks.js';
import { LoadState } from '../settings/shared.js';
import { failureMessage, useNotificationText } from '../text.js';

const textKey = (value: NotificationPreferenceKind['category']): string =>
  typeof value === 'string' ? value : `${value.ns}:${value.key}`;

/**
 * Personal settings › Messages › Notifications: for each notification kind, which channel types the signed-in person
 * receives it on, then the sections channel plugins add, such as their browser push devices.
 */
export function NotificationPreferencesPage(): ReactElement {
  const api = useSettingsApi();
  const { t, text } = useNotificationText();
  const sections = useNotificationPreferenceSections().list();
  const [loaded, reload] = useLoaded(() => api.preferences(), 'preferences');
  const [saved, setSaved] = useState<NotificationPreferencesView>();
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<{ id: string; message: string } | null>(
    null,
  );
  const view = saved ?? (loaded.state === 'ready' ? loaded.data : undefined);
  const toggle = (kind: string, channelType: string, enabled: boolean) => {
    const id = `${kind}:${channelType}`;
    setSaving(id);
    setError(null);
    api.savePreferences([{ kind, channelType, enabled }]).then(
      (next) => {
        setSaved(next);
        setSaving(null);
      },
      (cause: unknown) => {
        setSaving(null);
        setError({
          id,
          message: failureMessage(cause, t('preferences.saveFailed')),
        });
      },
    );
  };
  const columns = view
    ? [
        ...view.channelTypes.filter((type) => type === 'in-app'),
        ...view.channelTypes.filter((type) => type !== 'in-app'),
      ]
    : [];
  const groups = view
    ? [
        ...new Map(
          view.kinds.map((kind) => [textKey(kind.category), kind.category]),
        ),
      ].map(([key, category]) => ({
        key,
        label: text(category),
        kinds: view.kinds.filter((kind) => textKey(kind.category) === key),
      }))
    : [];
  const columnName = (type: string) =>
    t(`channelTypes.${type}`, { defaultValue: type });
  return (
    <div className='mx-auto w-full max-w-4xl min-w-0 space-y-6 p-4 sm:p-6'>
      <header className='space-y-1'>
        <h1 className='text-xl font-semibold'>{t('preferences.title')}</h1>
        <p className='text-sm text-muted-foreground'>
          {t('preferences.description')}
        </p>
      </header>
      {!view ? (
        <LoadState
          loaded={loaded as Exclude<typeof loaded, { state: 'ready' }>}
          onRetry={reload}
        />
      ) : view.kinds.length ? (
        <section className='space-y-2'>
          <div className='overflow-x-auto rounded-lg border'>
            <table className='w-full text-sm'>
              <thead className='text-xs text-muted-foreground'>
                <tr className='border-b'>
                  <th className='px-3 py-2 text-left font-medium'>
                    {t('preferences.notification')}
                  </th>
                  {columns.map((type) => (
                    <th
                      key={type}
                      className='px-3 py-2 text-center font-medium'
                    >
                      {columnName(type)}
                      {type === 'email' && view.email && (
                        <small className='block font-normal'>
                          {view.email}
                        </small>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <Fragment key={group.key}>
                    <tr className='border-b bg-muted/40'>
                      <th
                        scope='rowgroup'
                        colSpan={columns.length + 1}
                        className='px-3 py-1.5 text-left text-xs font-medium text-muted-foreground'
                      >
                        {group.label}
                      </th>
                    </tr>
                    {group.kinds.map((kind) => (
                      <tr key={kind.id} className='border-b last:border-b-0'>
                        <th
                          scope='row'
                          className='px-3 py-2 text-left font-normal'
                        >
                          <span className='font-medium'>{text(kind.name)}</span>
                          {kind.trigger && (
                            <p className='mt-0.5 text-xs text-muted-foreground'>
                              {text(kind.trigger)}
                            </p>
                          )}
                        </th>
                        {columns.map((type) => {
                          const channel = kind.channels.find(
                            (item) => item.type === type,
                          );
                          const label = `${text(kind.name)} · ${columnName(type)}`;
                          return (
                            <td key={type} className='px-3 py-2 text-center'>
                              {!channel ? (
                                <span className='text-muted-foreground'>—</span>
                              ) : channel.adjustable ? (
                                <Switch
                                  aria-label={label}
                                  checked={channel.enabled}
                                  disabled={saving !== null}
                                  onCheckedChange={(checked) =>
                                    toggle(kind.id, type, checked)
                                  }
                                />
                              ) : (
                                <span
                                  className='inline-flex items-center gap-1 text-xs text-muted-foreground'
                                  title={t('preferences.required')}
                                >
                                  <LockIcon aria-hidden className='size-3' />
                                  <span>{t('preferences.required')}</span>
                                </span>
                              )}
                              {error?.id === `${kind.id}:${type}` && (
                                <p
                                  role='alert'
                                  className='mt-1 text-xs text-destructive'
                                >
                                  {error.message}
                                </p>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <p className='text-xs text-muted-foreground'>
            {[
              t('preferences.requiredHint'),
              columns.includes('email') ? t('preferences.emailHint') : null,
              columns.includes('web-push') ? t('preferences.pushHint') : null,
            ]
              .filter(Boolean)
              .join(' ')}
          </p>
        </section>
      ) : (
        <p
          role='status'
          className='rounded-lg border p-8 text-center text-sm text-muted-foreground'
        >
          {t('preferences.empty')}
        </p>
      )}
      {sections.map((section) => (
        <section.component key={section.key} />
      ))}
    </div>
  );
}

export default NotificationPreferencesPage;
