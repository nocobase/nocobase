import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import {
  OrderItemsEditor,
  OrderItemsTable,
  type OrderItemDraft,
} from '../components/order-items.js';
import { Link, useNavigate, useParams } from 'react-router';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../components/ui/sheet.js';
import { useApiClient, ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { Button } from '../components/ui/button.js';
import { Input } from '../components/ui/input.js';
import { Badge } from '../components/ui/badge.js';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card.js';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui/select.js';
import {
  detailPath,
  entityPaths,
  detailSelect,
  entities,
  loadChoices,
  mutationValues,
  repository,
  searchFilter,
  type Entity,
  type EntityKey,
  type ExampleRecord,
} from '../model.js';

const NS = '@nocobase/app-plugin-repository-example';
const PAGE_SIZE = 10;
interface Trace {
  readonly id: number;
  readonly action: string;
  readonly input: unknown;
  readonly output: unknown;
}
export interface RepositoryPageProps {
  readonly title: string;
  readonly entityKey: EntityKey;
}
export function RepositoryPage({
  title,
  entityKey,
}: RepositoryPageProps): ReactElement {
  const { t } = useTranslation(NS);
  const { recordId } = useParams();
  return (
    <PageContainer>
      <PageHeader
        description={`${t('subtitle')} ${t('choicesHint')} ${t('moneyHint')}`}
        title={t(title)}
        actions={
          <Badge
            variant='outline'
            className='gap-1.5 px-3 py-1 font-mono text-xs font-medium shadow-2xs'
          >
            Repository API
          </Badge>
        }
      />
      <EntityWorkspace
        key={`${entityKey}:${recordId ?? 'list'}`}
        entity={entities[entityKey]}
        recordId={recordId}
      />
    </PageContainer>
  );
}
function EntityWorkspace({
  entity,
  recordId,
}: {
  readonly entity: Entity;
  readonly recordId?: string;
}): ReactElement {
  const navigate = useNavigate();
  const api = useApiClient();
  const repo = useMemo(() => repository(api, entity.key), [api, entity.key]);
  const { t } = useTranslation(NS);
  const [rows, setRows] = useState<ExampleRecord[]>([]);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [detail, setDetail] = useState<ExampleRecord>();
  const [editing, setEditing] = useState<ExampleRecord | 'new'>();
  const [deleting, setDeleting] = useState<ExampleRecord>();
  const [lookup, setLookup] = useState('');
  const [traces, setTraces] = useState<Trace[]>([]);
  const traceIdRef = useRef(0);
  const refresh = (): void => {
    setLoading(true);
    setError('');
    setRevision((value) => value + 1);
  };
  const recordTrace = useCallback(
    (action: string, input: unknown, output: unknown): void => {
      const id = ++traceIdRef.current;
      setTraces((current) =>
        [{ id, action, input, output }, ...current].slice(0, 7),
      );
    },
    [],
  );
  const message = (value: unknown): string =>
    value instanceof ApiClientError && value.reason === 'VERSION_CONFLICT'
      ? t('conflict')
      : value instanceof Error
        ? value.message
        : t('error');
  useEffect(() => {
    let active = true;
    if (recordId) {
      const input = { filter: { id: recordId }, select: detailSelect(entity) };
      void repo
        .findOne(input)
        .then((record) => {
          if (!active) return;
          setDetail(record);
          recordTrace('findOne', input, record ?? null);
        })
        .catch((value: unknown) => {
          if (active)
            setError(value instanceof Error ? value.message : t('loadError'));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }
    const filter = searchFilter(entity, query);
    const options = {
      filter,
      select: detailSelect(entity, false),
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      sort: {
        kind: 'sort' as const,
        version: 1 as const,
        items: [{ kind: 'field', path: ['id'], direction: 'asc' }],
      } as const,
    };
    void Promise.all([repo.findMany(options), repo.count({ filter })])
      .then(([records, total]) => {
        if (!active) return;
        if (page > 0 && records.length === 0) {
          setPage((value) => value - 1);
          return;
        }
        setRows(records);
        setCount(total);
        recordTrace('count', { filter }, total);
        recordTrace('findMany', options, records);
      })
      .catch((value: unknown) => {
        if (active)
          setError(value instanceof Error ? value.message : t('loadError'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [entity, page, query, recordId, recordTrace, repo, revision, t]);
  async function perform(action: () => Promise<void>): Promise<void> {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
    } catch (value) {
      setError(message(value));
    } finally {
      setBusy(false);
    }
  }
  async function open(id: string, edit: boolean): Promise<void> {
    if (!edit) {
      await navigate(detailPath(entity.key, id));
      return;
    }
    const input = { filter: { id }, select: detailSelect(entity) };
    const value = await repo.findOne(input);
    recordTrace('findOne', input, value ?? null);
    if (!value) {
      setNotice(t('notFound'));
      return;
    }
    setEditing(edit ? value : undefined);
    setDeleting(undefined);
  }
  async function save(
    values: Record<string, string>,
    items: OrderItemDraft[] = [],
  ): Promise<void> {
    const data = mutationValues(entity, values);
    if (editing === 'new') {
      const input = {
        values: {
          id: crypto.randomUUID(),
          ...data,
          ...(entity.key === 'orders' && items.length
            ? {
                items: {
                  create: items.map((item) => ({
                    id: item.id,
                    product: { connect: { id: item.productId } },
                    quantity: Number(item.quantity),
                    unitPriceCents: Number(item.unitPriceCents),
                  })),
                },
              }
            : {}),
        },
        select: detailSelect(entity),
      };
      const result = await repo.createOne(input);
      recordTrace('createOne', input, result);
      if (recordId) setDetail(result.record);
    } else if (editing) {
      const input = {
        filter: { id: editing.id },
        values: data,
        ifVersion: editing.version,
        select: detailSelect(entity),
      };
      const result = await repo.updateOne(input);
      recordTrace('updateOne', input, result);
      if (recordId) setDetail(result.record);
    }
    setEditing(undefined);
    setNotice(t('saved'));
    refresh();
  }
  return (
    <div className='space-y-5'>
      {error && !editing && (
        <p
          role='alert'
          className='rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive'
        >
          {error}
        </p>
      )}
      {notice && (
        <p role='status' className='text-sm text-muted-foreground'>
          {notice}
        </p>
      )}
      {!recordId && (
        <>
          <Card>
            <CardHeader>
              <div className='flex flex-wrap items-center justify-between gap-3'>
                <CardTitle>
                  {t(entity.key)}{' '}
                  <span className='text-sm font-normal text-muted-foreground'>
                    {t('count', { count })}
                  </span>
                </CardTitle>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    disabled={busy || loading}
                    onClick={refresh}
                  >
                    {t('refresh')}
                  </Button>
                  <Button
                    disabled={busy}
                    onClick={() => {
                      setEditing('new');
                      setDetail(undefined);
                      setDeleting(undefined);
                    }}
                  >
                    {t('new')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <form
                className='flex gap-2'
                onSubmit={(event) => {
                  event.preventDefault();
                  setPage(0);
                  setQuery(search);
                  refresh();
                }}
              >
                <Input
                  aria-label={t('search')}
                  placeholder={t('search')}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <Button
                  type='submit'
                  variant='outline'
                  disabled={busy || loading}
                >
                  {t('apply')}
                </Button>
              </form>
              <div
                className='overflow-hidden rounded-lg border'
                aria-busy={loading}
              >
                <table className='w-full text-left text-sm'>
                  <thead>
                    <tr className='border-b bg-muted/40'>
                      {entity.fields.map((field) => (
                        <th
                          key={field.key}
                          className='whitespace-nowrap px-4 py-3 text-xs font-semibold text-foreground uppercase tracking-wider'
                        >
                          {t(field.key)}
                        </th>
                      ))}
                      <th className='px-4 py-3 text-right'>
                        <span className='sr-only'>{t('edit')}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-border/60'>
                    {rows.map((row) => (
                      <tr
                        key={row.id}
                        className='transition-colors hover:bg-muted/30'
                      >
                        {entity.fields.map((field) => (
                          <td
                            key={field.key}
                            className='max-w-56 truncate px-4 py-3 text-sm'
                            title={displayValue(row[field.key] ?? '')}
                          >
                            {field.options ? (
                              <Badge
                                variant='secondary'
                                className='text-xs font-normal'
                              >
                                {t(displayValue(row[field.key]))}
                              </Badge>
                            ) : (
                              displayValue(
                                field.relation &&
                                  row[field.relation.name] &&
                                  typeof row[field.relation.name] === 'object'
                                  ? (
                                      row[field.relation.name] as Record<
                                        string,
                                        unknown
                                      >
                                    )[
                                      entities[field.relation.target].labelField
                                    ]
                                  : (row[field.key] ?? ''),
                              )
                            )}
                          </td>
                        ))}
                        <td className='px-4 py-3 text-right'>
                          <div className='flex items-center justify-end gap-1'>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-7 px-2.5 text-xs'
                              disabled={busy || loading}
                              onClick={() =>
                                void perform(() => open(row.id, false))
                              }
                            >
                              {t('view')}
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-7 px-2.5 text-xs'
                              disabled={busy || loading}
                              onClick={() =>
                                void perform(() => open(row.id, true))
                              }
                            >
                              {t('edit')}
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-7 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive'
                              disabled={busy || loading}
                              onClick={() => {
                                setDeleting(row);
                                setEditing(undefined);
                              }}
                            >
                              {t('delete')}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {loading ? (
                  <p
                    role='status'
                    className='py-8 text-center text-muted-foreground'
                  >
                    {t('loading')}
                  </p>
                ) : (
                  rows.length === 0 && (
                    <p className='py-8 text-center text-muted-foreground'>
                      {t('empty')}
                    </p>
                  )
                )}
              </div>
              <div className='flex items-center justify-end gap-3'>
                <Button
                  size='sm'
                  variant='outline'
                  disabled={loading || busy || page === 0}
                  onClick={() => {
                    setLoading(true);
                    setPage((value) => value - 1);
                  }}
                >
                  {t('previous')}
                </Button>
                <span className='text-sm'>{t('page', { page: page + 1 })}</span>
                <Button
                  size='sm'
                  variant='outline'
                  disabled={loading || busy || (page + 1) * PAGE_SIZE >= count}
                  onClick={() => {
                    setLoading(true);
                    setPage((value) => value + 1);
                  }}
                >
                  {t('next')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
      {deleting && (
        <Card>
          <CardContent className='space-y-3 pt-5'>
            <p>{t('confirmDelete')}</p>
            <code className='block text-xs'>{deleting.id}</code>
            <div className='flex gap-2'>
              <Button
                variant='destructive'
                disabled={busy}
                onClick={() =>
                  void perform(async () => {
                    const input = {
                      filter: { id: deleting.id },
                      ifVersion: deleting.version,
                    };
                    const result = await repo.deleteOne(input);
                    recordTrace('deleteOne', input, result);
                    setDeleting(undefined);
                    setDetail(undefined);
                    setNotice(t('deleted'));
                    refresh();
                  })
                }
              >
                {t('confirm')}
              </Button>
              <Button
                variant='outline'
                disabled={busy}
                onClick={() => setDeleting(undefined)}
              >
                {t('cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      <Sheet
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setEditing(undefined);
            setError('');
          }
        }}
      >
        <SheetContent
          side='right'
          showCloseButton={false}
          className={
            entity.key === 'orders' && editing === 'new'
              ? 'overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-4xl'
              : 'overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-xl'
          }
          aria-describedby={undefined}
        >
          <SheetHeader>
            <SheetTitle>
              {t(editing === 'new' ? 'createTitle' : 'editTitle', {
                entity: t(entity.key),
              })}
            </SheetTitle>
          </SheetHeader>
          {error && (
            <p role='alert' className='px-4 text-sm text-destructive'>
              {error}
            </p>
          )}
          {editing && (
            <RecordEditor
              key={editing === 'new' ? 'new' : editing.id}
              entity={entity}
              record={editing === 'new' ? undefined : editing}
              busy={busy}
              onCancel={() => {
                setEditing(undefined);
                setError('');
              }}
              onSave={(values, items) =>
                void perform(() => save(values, items))
              }
            />
          )}
        </SheetContent>
      </Sheet>
      {recordId && (
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={() => void navigate(entityPaths[entity.key])}
          >
            {t('back')}
          </Button>
          <Button
            variant='outline'
            disabled={loading || busy}
            onClick={refresh}
          >
            {t('refresh')}
          </Button>
          {detail && (
            <Button
              disabled={busy}
              onClick={() => void perform(() => open(detail.id, true))}
            >
              {t('edit')}
            </Button>
          )}
        </div>
      )}
      {recordId && loading && <p role='status'>{t('loading')}</p>}
      {recordId && !loading && !detail && !error && (
        <p role='status'>{t('notFound')}</p>
      )}
      {recordId && detail && (
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle>{t('details')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <dl className='grid gap-3 sm:grid-cols-2'>
              {[
                'id',
                ...entity.fields.map((field) => field.key),
                ...(detail.version ? ['version'] : []),
              ].map((key) => (
                <div key={key}>
                  <dt className='text-xs text-muted-foreground'>{t(key)}</dt>
                  <dd className='break-all text-sm'>
                    {(() => {
                      const relation = entity.fields.find(
                        (field) => field.key === key,
                      )?.relation;
                      const related = relation
                        ? (detail[relation.name] as ExampleRecord | undefined)
                        : undefined;
                      return relation && related ? (
                        <RecordReference
                          target={relation.target}
                          record={related}
                        />
                      ) : (
                        displayValue(detail[key] ?? '')
                      );
                    })()}
                  </dd>
                </div>
              ))}
            </dl>
            {entity.key === 'items' && (
              <p>
                {t('lineTotal')}:{' '}
                {Number(detail.quantity) * Number(detail.unitPriceCents)}
              </p>
            )}
            <h3 className='font-medium'>{t('relations')}</h3>
            {entity.relations.map((relation) => {
              const value = detail[relation.name];
              const related = (
                Array.isArray(value) ? value : value ? [value] : []
              ) as ExampleRecord[];
              return (
                <section
                  key={relation.name}
                  aria-label={t(
                    relation.many
                      ? relation.target
                      : entities[relation.target].singularLabel,
                  )}
                >
                  <h4 className='mb-1 text-sm font-medium'>
                    {t(
                      relation.many
                        ? relation.target
                        : entities[relation.target].singularLabel,
                    )}
                  </h4>
                  {relation.target === 'items' ? (
                    <OrderItemsTable items={related} />
                  ) : related.length ? (
                    <ul className='grid gap-2 sm:grid-cols-2'>
                      {related.map((item) => (
                        <li key={item.id}>
                          <RecordReference
                            target={relation.target}
                            record={item}
                            summary
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className='text-sm text-muted-foreground'>{t('none')}</p>
                  )}
                </section>
              );
            })}
          </CardContent>
        </Card>
      )}
      {!recordId && (
        <Card>
          <CardContent className='pt-5'>
            <form
              className='flex flex-wrap gap-2'
              onSubmit={(event) => {
                event.preventDefault();
                void perform(async () => {
                  const input = { filter: { id: lookup.trim() } };
                  const exists = await repo.exists(input);
                  recordTrace('exists', input, exists);
                  setNotice(t(exists ? 'found' : 'notFound'));
                  if (exists) await open(lookup.trim(), false);
                });
              }}
            >
              <Input
                className='min-w-48 flex-1'
                required
                aria-label={t('lookup')}
                placeholder={t('lookup')}
                value={lookup}
                onChange={(event) => setLookup(event.target.value)}
              />
              <Button
                type='submit'
                variant='outline'
                disabled={busy || !lookup.trim()}
              >
                {t('check')}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}{' '}
      <details className='rounded-lg border p-4'>
        <summary className='cursor-pointer text-sm font-medium'>
          {t('trace')}
        </summary>
        <p className='my-3 text-sm text-muted-foreground'>{t('traceHint')}</p>
        <div className='space-y-3'>
          {traces.map((trace) => (
            <details key={trace.id} className='rounded-md bg-muted p-3'>
              <summary className='cursor-pointer font-mono text-xs'>
                {entity.repository}:{trace.action}
              </summary>
              <div className='grid gap-3 pt-3 lg:grid-cols-2'>
                <section>
                  <h4 className='text-xs'>{t('request')}</h4>
                  <pre className='max-h-64 overflow-auto text-xs'>
                    {JSON.stringify(trace.input, null, 2)}
                  </pre>
                </section>
                <section>
                  <h4 className='text-xs'>{t('response')}</h4>
                  <pre className='max-h-64 overflow-auto text-xs'>
                    {JSON.stringify(trace.output, null, 2)}
                  </pre>
                </section>
              </div>
            </details>
          ))}
        </div>
      </details>
    </div>
  );
}
interface EditorProps {
  readonly entity: Entity;
  readonly record?: ExampleRecord;
  readonly busy: boolean;
  readonly onSave: (
    values: Record<string, string>,
    items: OrderItemDraft[],
  ) => void;
  readonly onCancel: () => void;
}
function RecordEditor({
  entity,
  record,
  busy,
  onSave,
  onCancel,
}: EditorProps): ReactElement {
  const api = useApiClient();
  const { t } = useTranslation(NS);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      entity.fields.map((field) => [
        field.key,
        displayValue(
          record?.[field.key] ??
            field.options?.[0] ??
            (field.kind === 'number' ? (field.min ?? 0) : ''),
        ),
      ]),
    ),
  );
  const [items, setItems] = useState<OrderItemDraft[]>([]);
  const createOrder = entity.key === 'orders' && !record;
  const [choices, setChoices] = useState<
    Partial<Record<EntityKey, ExampleRecord[]>>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const targets = [
      ...new Set([
        ...entity.fields.flatMap((field) =>
          field.relation ? [field.relation.target] : [],
        ),
        ...(createOrder ? ['products' as const] : []),
      ]),
    ];
    void Promise.all(
      targets.map(async (key) => [key, await loadChoices(api, key)] as const),
    )
      .then((entries) => {
        if (active) setChoices(Object.fromEntries(entries));
      })
      .catch((value: unknown) => {
        if (active)
          setError(value instanceof Error ? value.message : t('error'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [api, createOrder, entity, t]);
  return (
    <Card>
      <CardContent>
        <form
          className='space-y-4'
          onSubmit={(event) => {
            event.preventDefault();
            onSave(values, items);
          }}
        >
          {error && (
            <p role='alert' className='text-destructive'>
              {error}
            </p>
          )}
          {loading && <p role='status'>{t('loadingChoices')}</p>}
          <div className='grid gap-4 sm:grid-cols-2'>
            {entity.fields.map((field, index) => (
              <label key={field.key} className='space-y-2 text-sm font-medium'>
                <span>{t(field.key)}</span>
                {field.options || field.relation ? (
                  <Select
                    required
                    name={field.key}
                    value={values[field.key] || null}
                    disabled={busy || loading}
                    items={
                      field.options
                        ? field.options.map((option) => ({
                            value: option,
                            label: t(option),
                          }))
                        : (field.relation
                            ? (choices[field.relation.target] ?? [])
                            : []
                          ).map((item) => ({
                            value: item.id,
                            label:
                              displayValue(
                                item[
                                  entities[field.relation!.target].labelField
                                ],
                              ) || item.id,
                          }))
                    }
                    onValueChange={(value) =>
                      setValues((current) => ({
                        ...current,
                        [field.key]: value ?? '',
                      }))
                    }
                  >
                    <SelectTrigger className='w-full' aria-label={t(field.key)}>
                      <SelectValue placeholder={t('select')} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option} value={option}>
                          {t(option)}
                        </SelectItem>
                      ))}
                      {field.relation &&
                        choices[field.relation.target]?.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {displayValue(
                              item[entities[field.relation!.target].labelField],
                            ) || item.id}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    required
                    autoFocus={index === 0}
                    aria-label={t(field.key)}
                    type={field.kind ?? 'text'}
                    min={field.min}
                    step={field.kind === 'number' ? 1 : undefined}
                    max={field.kind === 'number' ? 2147483647 : undefined}
                    maxLength={
                      field.kind === 'email'
                        ? 255
                        : field.key === 'company'
                          ? 160
                          : ['sku', 'number', 'phone'].includes(field.key)
                            ? 64
                            : 120
                    }
                    disabled={busy}
                    value={values[field.key]}
                    onChange={(event) =>
                      setValues({ ...values, [field.key]: event.target.value })
                    }
                  />
                )}
              </label>
            ))}
          </div>
          {createOrder && (
            <OrderItemsEditor
              items={items}
              products={choices.products ?? []}
              disabled={busy || loading}
              onChange={setItems}
            />
          )}
          <div className='flex gap-2'>
            <Button type='submit' disabled={busy || loading || Boolean(error)}>
              {t('save')}
            </Button>
            <Button
              type='button'
              variant='outline'
              disabled={busy}
              onClick={onCancel}
            >
              {t('cancel')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function displayValue(value: unknown): string {
  return typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
    ? String(value)
    : '';
}

function RecordReference({
  target,
  record,
  summary = false,
}: {
  readonly target: EntityKey;
  readonly record: ExampleRecord;
  readonly summary?: boolean;
}): ReactElement {
  const label =
    target === 'items'
      ? `${displayValue(record.quantity)} × ${displayValue(record.unitPriceCents)} = ${Number(record.quantity) * Number(record.unitPriceCents)}`
      : displayValue(record[entities[target].labelField]) || record.id;
  const context =
    target === 'customers'
      ? ['company', 'email']
      : target === 'contacts'
        ? ['email', 'phone']
        : target === 'products'
          ? ['sku']
          : [];
  return (
    <Link
      to={detailPath(target, record.id)}
      className={
        summary
          ? 'block rounded-lg border border-border p-4 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          : 'font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      }
    >
      <span className='block break-words font-medium'>{label}</span>
      {summary &&
        context.map((key) => {
          const value = displayValue(record[key]);
          return value ? (
            <span
              key={key}
              className='mt-1 block break-words text-sm text-muted-foreground'
            >
              {value}
            </span>
          ) : null;
        })}
    </Link>
  );
}
