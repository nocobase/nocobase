import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { SearchIcon, XIcon } from 'lucide-react';
import { Button } from './ui/button.js';
import { Input } from './ui/input.js';
import { Badge } from './ui/badge.js';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './ui/select.js';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet.js';
import type {
  NotificationTemplateChannel,
  NotificationTemplatePreview,
  NotificationTemplateText,
  NotificationTemplateView,
} from '../../shared/templates.js';
import {
  languageName,
  listLanguages,
  pickPreviewLocale,
} from '../template-language.js';

const namespace = '@nocobase/app-plugin-notification';

/** A kind as the directory lists it, with its sends in the last seven days. */
type KindListItem = NotificationTemplateView & {
  readonly sentLast7Days?: number;
};

type ResolveText = (text: NotificationTemplateText) => string;

/** Resolves registrant text in the interface language; a translation key falls back to its default text. */
function useTemplateText(): {
  readonly text: ResolveText;
  readonly t: (key: string, options?: Record<string, unknown>) => string;
  readonly language: string;
} {
  const { t, i18n } = useTranslation(namespace);
  const translate = t as unknown as (
    key: string,
    options?: Record<string, unknown>,
  ) => string;
  const text = (value: NotificationTemplateText): string =>
    typeof value === 'string'
      ? value
      : translate(value.key, {
          ns: value.ns,
          defaultValue: value.defaultValue,
        });
  return { text, t: translate, language: i18n.language };
}

const channelTypeLabel = (type: string): NotificationTemplateText => ({
  ns: namespace,
  key: `channelTypes.${type}`,
  defaultValue: type,
});

const textKey = (value: NotificationTemplateText): string =>
  typeof value === 'string' ? value : `${value.ns}:${value.key}`;

const channelTypeText = (
  text: ResolveText,
  channel: NotificationTemplateChannel,
): string => (channel.typeLabel ? text(channel.typeLabel) : channel.type);

const channelText = (
  text: ResolveText,
  channel: NotificationTemplateChannel,
): string => (channel.label ? text(channel.label) : channel.name);

/**
 * The notification kinds plugins registered, read-only: grouped by category, with their channel policies, and the
 * details and a preview in a drawer. The host owns routing, page framing and permission grants.
 */
export function NotificationKinds({
  selectedId,
  onSelect,
}: {
  /** The template whose details are open in the drawer; the host keeps it in its URL. */
  readonly selectedId: string | null;
  readonly onSelect: (id: string | null) => void;
}): ReactElement {
  const api = useApiClient();
  const { t, text } = useTemplateText();
  const [items, setItems] = useState<readonly KindListItem[]>();
  const [error, setError] = useState<'forbidden' | 'failed' | null>(null);
  const [revision, setRevision] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [channel, setChannel] = useState('all');
  useEffect(() => {
    let current = true;
    void api
      .request<{ data: KindListItem[] }>({
        path: 'notifications/kinds',
      })
      .then(({ data }) => {
        if (current) setItems(data);
      })
      .catch((cause: unknown) => {
        if (current)
          setError(
            cause instanceof ApiClientError && cause.status === 403
              ? 'forbidden'
              : 'failed',
          );
      });
    return () => {
      current = false;
    };
  }, [api, revision]);
  const categories = useMemo(() => {
    const entries = new Map<string, NotificationTemplateText>();
    for (const item of items ?? [])
      entries.set(textKey(item.category), item.category);
    return [...entries];
  }, [items]);
  const channels = useMemo(() => {
    const entries = new Map<string, NotificationTemplateChannel>();
    for (const entry of items?.flatMap((item) => item.channels) ?? [])
      if (!entries.has(entry.type)) entries.set(entry.type, entry);
    // A kind sent with `notify()` names channel types even where no channel of the type is configured.
    for (const policy of items?.flatMap((item) => item.policies ?? []) ?? [])
      if (!entries.has(policy.type))
        entries.set(policy.type, {
          name: policy.type,
          type: policy.type,
          typeLabel: channelTypeLabel(policy.type),
          configured: false,
          enabled: null,
        });
    return [...entries];
  }, [items]);
  const query = search.trim().toLowerCase();
  const visible = items?.filter(
    (item) =>
      (category === 'all' || textKey(item.category) === category) &&
      (channel === 'all' ||
        item.channels.some((entry) => entry.type === channel) ||
        Boolean(item.policies?.some((policy) => policy.type === channel))) &&
      [
        text(item.name),
        text(item.category),
        text(item.trigger),
        text(item.recipients),
        item.contributorLabel ? text(item.contributorLabel) : '',
        item.id,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
  );
  const groups = categories
    .map(([key, label]) => ({
      key,
      label: text(label),
      items: visible?.filter((item) => textKey(item.category) === key) ?? [],
    }))
    .filter((group) => group.items.length);
  const categoryLabel = categories.find(([key]) => key === category)?.[1];
  const channelEntry = channels.find(([key]) => key === channel)?.[1];
  return (
    <div className='space-y-5 min-w-0'>
      <p className='text-sm text-muted-foreground'>{t('templates.coverage')}</p>
      {error ? (
        <div role='alert' className='rounded-lg border p-6 space-y-3'>
          <p>{t(`templates.${error}`)}</p>
          {error !== 'forbidden' ? (
            <Button
              variant='outline'
              onClick={() => {
                setError(null);
                setRevision((value) => value + 1);
              }}
            >
              {t('templates.retry')}
            </Button>
          ) : null}
        </div>
      ) : !items ? (
        <p role='status'>{t('templates.loading')}</p>
      ) : (
        <>
          <div
            role='toolbar'
            aria-label={t('templates.filters')}
            className='flex flex-wrap items-center gap-2'
          >
            <div className='relative w-full sm:w-64'>
              <SearchIcon
                aria-hidden
                className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground'
              />
              <Input
                type='search'
                className='pl-8'
                aria-label={t('templates.search')}
                placeholder={t('templates.search')}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value ?? 'all')}
            >
              <SelectTrigger aria-label={t('templates.category')}>
                <span className='text-muted-foreground'>
                  {t('templates.category')}
                </span>
                <SelectValue>
                  {categoryLabel ? text(categoryLabel) : t('templates.all')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>{t('templates.all')}</SelectItem>
                {categories.map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {text(label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={channel}
              onValueChange={(value) => setChannel(value ?? 'all')}
            >
              <SelectTrigger aria-label={t('templates.channel')}>
                <span className='text-muted-foreground'>
                  {t('templates.channel')}
                </span>
                <SelectValue>
                  {channelEntry
                    ? channelTypeText(text, channelEntry)
                    : t('templates.all')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>{t('templates.all')}</SelectItem>
                {channels.map(([key, entry]) => (
                  <SelectItem key={key} value={key}>
                    {channelTypeText(text, entry)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {groups.length ? (
            <div className='space-y-6'>
              {groups.map((group, index) => (
                <section
                  key={group.key}
                  aria-labelledby={`notification-template-group-${index}`}
                  className='space-y-3'
                >
                  <h2
                    id={`notification-template-group-${index}`}
                    className='text-sm font-medium text-muted-foreground'
                  >
                    {group.label}
                  </h2>
                  <div className='overflow-x-auto rounded-lg border'>
                    <table className='w-full text-left text-sm'>
                      <thead className='border-b bg-muted/40 text-xs text-muted-foreground'>
                        <tr>
                          <th className='p-3'>
                            {t('preferences.notification')}
                          </th>
                          {channels.map(([type, entry]) => (
                            <th key={type} className='p-3'>
                              {t(`channelTypes.${type}`, {
                                defaultValue: channelTypeText(text, entry),
                              })}
                            </th>
                          ))}
                          <th className='p-3'>{t('deliveries.ranges.7d')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((item) => (
                          <tr key={item.id} className='border-b last:border-0'>
                            <th
                              scope='row'
                              className='min-w-44 p-3 font-normal'
                            >
                              <Button
                                variant='link'
                                className='h-auto p-0 text-left font-medium'
                                onClick={() => onSelect(item.id)}
                              >
                                {text(item.name)}
                              </Button>
                              <p className='text-xs text-muted-foreground'>
                                {text(item.trigger)}
                              </p>
                            </th>
                            {channels.map(([type]) => {
                              const policy = item.policies?.find(
                                (entry) => entry.type === type,
                              );
                              const direct =
                                !item.policies &&
                                item.channels.some(
                                  (entry) => entry.type === type,
                                );
                              return (
                                <td key={type} className='p-3'>
                                  {policy ? (
                                    <Badge
                                      variant={
                                        policy.policy === 'required'
                                          ? 'secondary'
                                          : 'outline'
                                      }
                                    >
                                      {t(`kinds.policies.${policy.policy}`)}
                                    </Badge>
                                  ) : direct ? (
                                    t('kinds.sentDirectly')
                                  ) : (
                                    '—'
                                  )}
                                </td>
                              );
                            })}
                            <td className='p-3 tabular-nums'>
                              {item.sentLast7Days ?? '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <p
              role='status'
              className='rounded-lg border p-8 text-center text-muted-foreground'
            >
              {t(items.length ? 'templates.noResults' : 'templates.empty')}
            </p>
          )}
        </>
      )}
      <Sheet
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) onSelect(null);
        }}
      >
        <SheetContent
          showCloseButton={false}
          className='w-full gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl'
        >
          {selectedId ? (
            <TemplateDetail
              key={selectedId}
              id={selectedId}
              onClose={() => onSelect(null)}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function TemplateDetail({
  id,
  onClose,
}: {
  readonly id: string;
  readonly onClose: () => void;
}): ReactElement {
  const api = useApiClient();
  const { t, text, language } = useTemplateText();
  const [detail, setDetail] = useState<NotificationTemplateView>();
  const [chosenLocale, setChosenLocale] = useState('');
  const [preview, setPreview] = useState<NotificationTemplatePreview>();
  const [error, setError] = useState<
    'forbidden' | 'notFound' | 'failed' | null
  >(null);
  const [revision, setRevision] = useState(0);
  const failure = (cause: unknown): 'forbidden' | 'notFound' | 'failed' =>
    cause instanceof ApiClientError && cause.status === 403
      ? 'forbidden'
      : cause instanceof ApiClientError && cause.status === 404
        ? 'notFound'
        : 'failed';
  useEffect(() => {
    let current = true;
    void api
      .request<{ data: NotificationTemplateView }>({
        path: `notifications/kinds/${encodeURIComponent(id)}`,
      })
      .then(({ data }) => {
        if (current) setDetail(data);
      })
      .catch((cause: unknown) => {
        if (current) setError(failure(cause));
      });
    return () => {
      current = false;
    };
  }, [api, id, revision]);
  // Until the administrator picks a language, the preview follows the interface language.
  const locale = !detail
    ? ''
    : detail.localeMode === 'combined'
      ? (detail.locales[0] ?? 'en-US')
      : chosenLocale || pickPreviewLocale(detail.locales, language);
  useEffect(() => {
    if (!locale) return;
    let current = true;
    void api
      .request<{ data: NotificationTemplatePreview }>({
        path: `notifications/kinds/${encodeURIComponent(id)}/preview`,
        method: 'POST',
        json: { locale },
      })
      .then(({ data }) => {
        if (current) setPreview(data);
      })
      .catch((cause: unknown) => {
        if (current) setError(failure(cause));
      });
    return () => {
      current = false;
    };
  }, [api, id, locale, revision]);
  const names = detail?.locales.map((code) => languageName(code, language));
  return (
    <>
      <SheetHeader className='border-b pr-12'>
        <SheetTitle className='text-lg'>
          {detail ? text(detail.name) : t('templates.details')}
        </SheetTitle>
        <SheetDescription>
          {detail
            ? [
                text(detail.category),
                detail.contributorLabel
                  ? t('templates.providedBy', {
                      name: text(detail.contributorLabel),
                    })
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')
            : t('templates.loading')}
        </SheetDescription>
        <Button
          variant='ghost'
          size='icon-sm'
          className='absolute top-3 right-3'
          aria-label={t('templates.close')}
          onClick={onClose}
        >
          <XIcon />
        </Button>
      </SheetHeader>
      <div className='flex-1 space-y-6 overflow-y-auto p-4 sm:p-6'>
        {error ? (
          <div role='alert' className='space-y-3'>
            <p>{t(`templates.${error}`)}</p>
            {error === 'failed' ? (
              <Button
                variant='outline'
                onClick={() => {
                  setError(null);
                  setRevision((value) => value + 1);
                }}
              >
                {t('templates.retry')}
              </Button>
            ) : null}
          </div>
        ) : null}
        {detail && !error ? (
          <>
            <dl className='grid gap-4 text-sm'>
              {(
                [
                  ['trigger', detail.trigger],
                  ['recipients', detail.recipients],
                  ['businessRule', detail.businessRule],
                ] as const
              ).map(([key, value]) => (
                <div key={key}>
                  <dt className='font-medium'>{t(`templates.${key}`)}</dt>
                  <dd className='mt-1 break-words text-muted-foreground'>
                    {text(value)}
                  </dd>
                </div>
              ))}
            </dl>
            {detail.policies ? (
              <section className='space-y-2'>
                <h3 className='text-sm font-medium'>
                  {t('kinds.policyTitle')}
                </h3>
                <ul className='space-y-1.5 text-sm'>
                  {detail.policies.map((policy) => (
                    <li
                      key={policy.type}
                      className='flex flex-wrap items-center justify-between gap-2'
                    >
                      <span>
                        {t(`channelTypes.${policy.type}`, {
                          defaultValue: policy.type,
                        })}
                      </span>
                      <span className='text-muted-foreground'>
                        {t(`kinds.policies.${policy.policy}`)}
                        {policy.adjustable
                          ? ` · ${t('kinds.personCanChange')}`
                          : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            <section className='space-y-2'>
              <h3 className='text-sm font-medium'>{t('templates.status')}</h3>
              <ul className='space-y-2'>
                {detail.channels.map((entry) => (
                  <li
                    className='flex flex-wrap items-center gap-2 text-sm'
                    key={entry.name}
                  >
                    <span className='break-words'>
                      {channelText(text, entry)}
                    </span>
                    <Badge variant='outline'>
                      {channelTypeText(text, entry)}
                    </Badge>
                    <Badge variant={entry.configured ? 'secondary' : 'outline'}>
                      {t(
                        entry.configured
                          ? 'templates.configured'
                          : 'templates.unconfigured',
                      )}
                    </Badge>
                    {entry.enabled === null ? null : (
                      <Badge variant={entry.enabled ? 'secondary' : 'outline'}>
                        {t(
                          entry.enabled
                            ? 'templates.enabled'
                            : 'templates.disabled',
                        )}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
              <p className='text-xs text-muted-foreground'>
                {t('templates.statusHelp')}
              </p>
            </section>
            <section className='space-y-2'>
              <h3 className='text-sm font-medium'>
                {t('templates.languagePolicy')}
              </h3>
              {detail.localeMode === 'combined' ||
              detail.locales.length === 1 ? (
                <p className='text-sm'>
                  {detail.localeMode === 'combined'
                    ? t('templates.combined', {
                        languages: names ? listLanguages(names, language) : '',
                      })
                    : t('templates.singleLocale', { language: names?.[0] })}
                </p>
              ) : null}
              <p className='text-sm text-muted-foreground'>
                {text(detail.languagePolicy)}
              </p>
            </section>
            <section className='space-y-3'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <h3 className='text-sm font-medium'>
                  {t('templates.preview')}
                </h3>
                {detail.localeMode === 'separate' &&
                detail.locales.length > 1 ? (
                  <Select
                    value={locale}
                    onValueChange={(value) => {
                      if (value) {
                        setPreview(undefined);
                        setError(null);
                        setChosenLocale(value);
                      }
                    }}
                  >
                    <SelectTrigger
                      size='sm'
                      aria-label={t('templates.language')}
                    >
                      <span className='text-muted-foreground'>
                        {t('templates.language')}
                      </span>
                      <SelectValue>
                        {languageName(locale, language)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {detail.locales.map((value) => (
                        <SelectItem key={value} value={value}>
                          {languageName(value, language)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
              </div>
              <p className='text-xs text-muted-foreground'>
                {t('templates.synthetic')}
              </p>
              {preview ? (
                <>
                  <PreviewContent
                    label={t('templates.preview')}
                    content={preview.content}
                  />
                  <details className='rounded-lg border p-3'>
                    <summary className='cursor-pointer text-sm font-medium'>
                      {t('templates.definition')}
                    </summary>
                    <div className='mt-3'>
                      <PreviewContent
                        label={t('templates.definition')}
                        content={preview.definition}
                      />
                    </div>
                  </details>
                </>
              ) : (
                <p role='status' className='text-sm'>
                  {t('templates.loading')}
                </p>
              )}
            </section>
            {detail.variables.length ? (
              <section className='space-y-2'>
                <h3 className='text-sm font-medium'>
                  {t('templates.variables')}
                </h3>
                <p className='text-xs text-muted-foreground'>
                  {t('templates.variablesHelp')}
                </p>
                <dl className='grid gap-2 sm:grid-cols-2'>
                  {detail.variables.map((variable) => (
                    <div key={variable.name} className='text-sm'>
                      <dt className='font-mono text-xs'>{`{{${variable.name}}}`}</dt>
                      <dd className='text-muted-foreground'>
                        {text(variable.description)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}
            <details className='rounded-lg border p-3 text-sm'>
              <summary className='cursor-pointer font-medium'>
                {t('templates.technical')}
              </summary>
              <dl className='mt-3 grid gap-2 text-muted-foreground'>
                <div>
                  <dt>{t('templates.templateId')}</dt>
                  <dd className='font-mono text-xs break-all'>{detail.id}</dd>
                </div>
                <div>
                  <dt>{t('templates.package')}</dt>
                  <dd className='font-mono text-xs break-all'>
                    {detail.contributor}
                  </dd>
                </div>
                <div>
                  <dt>{t('templates.channelNames')}</dt>
                  <dd className='font-mono text-xs break-all'>
                    {detail.channels
                      .map((entry) => `${entry.name} (${entry.type})`)
                      .join(', ')}
                  </dd>
                </div>
              </dl>
            </details>
          </>
        ) : !error ? (
          <p role='status'>{t('templates.loading')}</p>
        ) : null}
      </div>
    </>
  );
}

function PreviewContent({
  label,
  content,
}: {
  readonly label: string;
  readonly content: NotificationTemplatePreview['content'];
}): ReactElement {
  const { t } = useTemplateText();
  return (
    <div className='space-y-2 min-w-0' role='group' aria-label={label}>
      <p className='text-sm font-medium break-words'>{content.title}</p>
      <pre className='rounded-lg bg-muted p-4 text-sm whitespace-pre-wrap break-words max-h-96 overflow-auto font-sans'>
        {content.body}
      </pre>
      {content.html ? (
        <details>
          <summary className='cursor-pointer text-xs text-muted-foreground'>
            {t('templates.html')}
          </summary>
          <pre
            className='mt-2 rounded-lg bg-muted p-4 text-xs whitespace-pre-wrap break-all max-h-64 overflow-auto'
            aria-label={t('templates.html')}
          >
            {content.html}
          </pre>
        </details>
      ) : null}
    </div>
  );
}

/** @deprecated The directory lists notification kinds now; use `NotificationKinds`. */
export const NotificationTemplates: typeof NotificationKinds =
  NotificationKinds;
