import { useEffect, useRef, useState, type ReactElement } from 'react';
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
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
import type {
  NotificationTemplatePreview,
  NotificationTemplateView,
} from '../../shared/templates.js';

const namespace = '@nocobase/app-plugin-notification';

/** Read-only administration block. The host owns routing, page framing and permission grants. */
export function NotificationTemplates({
  selectedId,
  onSelect,
}: {
  readonly selectedId: string | null;
  readonly onSelect: (id: string | null) => void;
}): ReactElement {
  const api = useApiClient();
  const { t } = useTranslation(namespace);
  const [items, setItems] = useState<readonly NotificationTemplateView[]>();
  const [error, setError] = useState<'forbidden' | 'failed' | null>(null);
  const [revision, setRevision] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [channel, setChannel] = useState('all');
  useEffect(() => {
    let current = true;
    void api
      .request<{ data: NotificationTemplateView[] }>({
        path: 'notifications/templates',
      })
      .then(({ data }) => {
        if (current) setItems(data);
      })
      .catch((cause: unknown) => {
        if (current)
          setError(
            cause instanceof ApiClientError &&
              cause.reason === 'NOTIFICATION_TEMPLATES_FORBIDDEN'
              ? 'forbidden'
              : 'failed',
          );
      });
    return () => {
      current = false;
    };
  }, [api, revision]);
  const categories = [...new Set(items?.map((item) => item.category) ?? [])];
  const channels = [
    ...new Set(
      items?.flatMap((item) => item.channels.map((entry) => entry.type)) ?? [],
    ),
  ];
  const visible = items?.filter(
    (item) =>
      (category === 'all' || item.category === category) &&
      (channel === 'all' ||
        item.channels.some((entry) => entry.type === channel)) &&
      [
        item.name,
        item.id,
        item.category,
        item.trigger,
        item.recipients,
        item.contributor,
      ]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <div className='space-y-6 min-w-0'>
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
          <div className='grid gap-3 sm:grid-cols-3'>
            <label className='space-y-2 text-sm'>
              <span>{t('templates.search')}</span>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <div className='space-y-2 text-sm'>
              <span id='notification-category'>{t('templates.category')}</span>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value ?? 'all')}
              >
                <SelectTrigger
                  className='w-full'
                  aria-labelledby='notification-category'
                >
                  <SelectValue>
                    {category === 'all' ? t('templates.all') : category}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>{t('templates.all')}</SelectItem>
                  {categories.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2 text-sm'>
              <span id='notification-channel'>{t('templates.channel')}</span>
              <Select
                value={channel}
                onValueChange={(value) => setChannel(value ?? 'all')}
              >
                <SelectTrigger
                  className='w-full'
                  aria-labelledby='notification-channel'
                >
                  <SelectValue>
                    {channel === 'all' ? t('templates.all') : channel}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>{t('templates.all')}</SelectItem>
                  {channels.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {visible?.length ? (
            <ul className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
              {visible.map((item) => (
                <li
                  key={item.id}
                  className='rounded-lg border bg-card p-4 space-y-3 min-w-0'
                >
                  <div className='flex flex-wrap items-center gap-2'>
                    <Badge variant='secondary'>{item.category}</Badge>
                    {item.channels.map((entry) => (
                      <Badge variant='outline' key={entry.name}>
                        {entry.type}
                      </Badge>
                    ))}
                  </div>
                  <h2 className='font-medium'>{item.name}</h2>
                  <p className='text-sm text-muted-foreground'>
                    {item.trigger}
                  </p>
                  <Button
                    variant={selectedId === item.id ? 'secondary' : 'outline'}
                    onClick={() => onSelect(item.id)}
                  >
                    {t('templates.details')}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p
              role='status'
              className='rounded-lg border p-8 text-center text-muted-foreground'
            >
              {t(items.length ? 'templates.noResults' : 'templates.empty')}
            </p>
          )}
          {selectedId ? (
            <TemplateDetail
              key={selectedId}
              id={selectedId}
              onClose={() => onSelect(null)}
            />
          ) : null}
        </>
      )}
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
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    sectionRef.current?.focus();
  }, []);
  const api = useApiClient();
  const { t } = useTranslation(namespace);
  const [detail, setDetail] = useState<NotificationTemplateView>();
  const [locale, setLocale] = useState('');
  const [preview, setPreview] = useState<NotificationTemplatePreview>();
  const [error, setError] = useState<
    'forbidden' | 'notFound' | 'failed' | null
  >(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let current = true;
    void api
      .request<{ data: NotificationTemplateView }>({
        path: `notifications/templates/${encodeURIComponent(id)}`,
      })
      .then(({ data }) => {
        if (current) {
          setDetail(data);
          setLocale(data.locales[0] ?? 'en-US');
        }
      })
      .catch((cause: unknown) => {
        if (current)
          setError(
            cause instanceof ApiClientError && cause.status === 403
              ? 'forbidden'
              : cause instanceof ApiClientError && cause.status === 404
                ? 'notFound'
                : 'failed',
          );
      });
    return () => {
      current = false;
    };
  }, [api, id, revision]);
  useEffect(() => {
    if (!locale) return;
    let current = true;
    void api
      .request<{ data: NotificationTemplatePreview }>({
        path: `notifications/templates/${encodeURIComponent(id)}/preview`,
        method: 'POST',
        json: { locale },
      })
      .then(({ data }) => {
        if (current) setPreview(data);
      })
      .catch((cause: unknown) => {
        if (current)
          setError(
            cause instanceof ApiClientError && cause.status === 403
              ? 'forbidden'
              : cause instanceof ApiClientError && cause.status === 404
                ? 'notFound'
                : 'failed',
          );
      });
    return () => {
      current = false;
    };
  }, [api, id, locale, revision]);
  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      aria-label={t('templates.details')}
      className='rounded-lg border bg-card p-4 sm:p-6 space-y-5 min-w-0'
    >
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <h2 className='text-lg font-semibold'>
          {detail?.name ?? t('templates.details')}
        </h2>
        <Button variant='ghost' onClick={onClose}>
          {t('templates.close')}
        </Button>
      </div>
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
          <dl className='grid gap-4 text-sm sm:grid-cols-2'>
            {(
              [
                ['trigger', detail.trigger],
                ['recipients', detail.recipients],
                ['businessRule', detail.businessRule],
                ['contributor', `${detail.contributor} · ${detail.id}`],
                ['languagePolicy', detail.languagePolicy],
              ] as const
            ).map(([key, value]) => (
              <div key={key}>
                <dt className='text-muted-foreground'>
                  {t(`templates.${key}`)}
                </dt>
                <dd className='mt-1 break-words'>{value}</dd>
              </div>
            ))}
          </dl>
          <div className='space-y-2'>
            <h3 className='font-medium'>{t('templates.status')}</h3>
            <p className='text-sm text-muted-foreground'>
              {t('templates.statusHelp')}
            </p>
            {detail.channels.map((entry) => (
              <p className='text-sm break-words' key={entry.name}>
                {entry.name} · {entry.type} ·{' '}
                {t(
                  entry.configured
                    ? 'templates.configured'
                    : 'templates.unconfigured',
                )}{' '}
                ·{' '}
                {t(
                  entry.enabled === null
                    ? 'templates.unknown'
                    : entry.enabled
                      ? 'templates.enabled'
                      : 'templates.disabled',
                )}
              </p>
            ))}
          </div>
          <div className='space-y-2'>
            <h3 className='font-medium'>{t('templates.variables')}</h3>
            <dl className='grid gap-2 sm:grid-cols-2'>
              {detail.variables.map((variable) => (
                <div key={variable.name} className='text-sm'>
                  <dt className='font-mono'>{`{{${variable.name}}}`}</dt>
                  <dd className='text-muted-foreground'>
                    {variable.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className='space-y-2 text-sm'>
            <span id='notification-language'>{t('templates.language')}</span>
            <Select
              value={locale}
              onValueChange={(value) => {
                if (value) {
                  setPreview(undefined);
                  setError(null);
                  setLocale(value);
                }
              }}
            >
              <SelectTrigger aria-labelledby='notification-language'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {detail.locales.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className='text-sm text-muted-foreground'>
            {t('templates.synthetic')}
          </p>
          {preview ? (
            <div className='grid gap-4 lg:grid-cols-2'>
              {(['definition', 'content'] as const).map((key) => (
                <div className='space-y-3 min-w-0' key={key}>
                  <h3 className='font-medium'>
                    {t(
                      key === 'definition'
                        ? 'templates.definition'
                        : 'templates.preview',
                    )}
                  </h3>
                  <p className='text-sm font-medium break-words'>
                    {preview[key].title}
                  </p>
                  <pre className='rounded-lg bg-muted p-4 text-sm whitespace-pre-wrap break-words max-h-96 overflow-auto'>
                    {preview[key].body}
                  </pre>
                  {preview[key].html ? (
                    <pre
                      className='rounded-lg bg-muted p-4 text-xs whitespace-pre-wrap break-all max-h-64 overflow-auto'
                      aria-label={t('templates.html')}
                    >
                      {preview[key].html}
                    </pre>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p role='status'>{t('templates.loading')}</p>
          )}
        </>
      ) : !error ? (
        <p role='status'>{t('templates.loading')}</p>
      ) : null}
    </section>
  );
}
