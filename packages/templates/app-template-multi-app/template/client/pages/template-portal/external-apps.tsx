import { useId, useState, type FormEvent, type ReactNode } from 'react';
import {
  Link,
  useHref,
  useLinkClickHandler,
  useNavigate,
  useParams,
  useSearchParams,
  useLocation,
} from 'react-router';
import {
  useApiClient,
  useSubmission,
  usePageBreadcrumb,
} from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { IdentityAccess } from '@nocobase/app-plugin-identity-provider/client';
import { useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import { RouteDialog } from '#components/route-dialog';
import { DialogClose } from '#components/ui/dialog';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { RecordLink } from '#components/record-link';
import { DataTable } from '#components/data-table';
import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '#components/ui/tabs';
import { Input } from '#components/ui/input';
import { Label } from '#components/ui/label';
import { Card, CardContent } from '#components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '#components/ui/select';
import AgentSetup from './agent-setup.js';
import { Feedback } from './management-ui.js';
import { platformLoginUrl } from './links.js';
import { usePortalData, refreshPortal, safeUrl } from './data.js';
interface ExternalApp {
  id: string;
  name: string;
  url: string;
  kind: 'nocobase' | 'web';
  authMode: 'link' | 'platform';
  callbackUrl: string | null;
  status: 'enabled' | 'disabled';
  revision: number;
}

/**
 * React Router's Link in this workspace replaces its merged ref each render.
 * Base UI 1.7 registers tabs from that ref, so the replacement loops registration.
 * Keep the DOM ref unchanged while retaining Router's normal link click semantics.
 */
function SourceTabLink({
  to,
  onClick,
  target,
  ...props
}: import('react').ComponentProps<'a'> & { to: string }) {
  const href = useHref(to);
  const navigate = useLinkClickHandler<HTMLAnchorElement>(to, { target });
  return (
    <a
      {...props}
      href={href}
      target={target}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) navigate(event);
      }}
    />
  );
}
const listPath = '/multi-app/instances?source=external';
function useExternalBreadcrumb(label: string) {
  const { t } = useTranslation();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  params.set('source', 'external');
  const parent = `/multi-app/instances?${params}`;
  usePageBreadcrumb([{ label: t('portal.management'), to: parent }, { label }]);
  return parent;
}
export function ApplicationSources({
  external = false,
  children,
}: {
  external?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const admin = useCan('unrestricted');
  if (admin.isPending) return null;
  if (!admin.can) return <>{children}</>;
  const source = external ? 'external' : 'managed';
  return (
    <Tabs value={source} className='min-w-0 gap-6'>
      <TabsList aria-label={t('external.source')}>
        <TabsTrigger
          value='managed'
          nativeButton={false}
          render={<SourceTabLink to='/multi-app/instances' />}
        >
          {t('external.managed')}
        </TabsTrigger>
        <TabsTrigger
          value='external'
          nativeButton={false}
          render={<SourceTabLink to={listPath} />}
        >
          {t('external.title')}
        </TabsTrigger>
      </TabsList>
      <TabsContent value={source} className='min-w-0 space-y-6'>
        {children}
      </TabsContent>
    </Tabs>
  );
}
export function ExternalAppsList() {
  const { t } = useTranslation(),
    admin = useCan('unrestricted');
  return admin.can ? <ExternalList /> : <p>{t('portal.error403')}</p>;
}
function ExternalList() {
  const { t } = useTranslation(),
    request = usePortalData<{ data: ExternalApp[] }>('multiApp/externalApps');
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';
  const setSearch = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('q', value);
    setSearchParams(next, { replace: true });
  };
  const rows =
    request.data?.data.filter((row) =>
      `${row.name} ${row.url}`.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];
  const columns: ColumnDef<ExternalApp>[] = [
    {
      accessorKey: 'name',
      header: t('external.name'),
      cell: ({ row }) => (
        <RecordLink
          to={`/multi-app/external-apps/${row.original.id}?${searchParams}`}
        >
          {row.original.name}
        </RecordLink>
      ),
    },
    {
      accessorKey: 'kind',
      header: t('external.kind'),
      cell: ({ row }) => t(`external.${row.original.kind}`),
    },
    {
      accessorKey: 'url',
      header: t('external.url'),
      cell: ({ row }) => (
        <span className='block max-w-72 truncate' title={row.original.url}>
          {row.original.url}
        </span>
      ),
    },
    {
      accessorKey: 'authMode',
      header: t('external.authMode'),
      cell: ({ row }) => t(`external.${row.original.authMode}`),
    },
    {
      accessorKey: 'status',
      header: t('external.status'),
      cell: ({ row }) => t(`external.${row.original.status}`),
    },
    {
      id: 'actions',
      header: t('portal.actions'),
      cell: ({ row }) => (
        <Button
          variant='ghost'
          render={
            <Link
              to={`/multi-app/external-apps/${row.original.id}?${searchParams}`}
            />
          }
        >
          {t('external.manage')}
        </Button>
      ),
    },
  ];
  return (
    <PageContainer>
      <PageHeader
        title={t('portal.management')}
        description={t('external.description')}
        actions={
          <Button
            render={
              <Link to={`/multi-app/external-apps/new?${searchParams}`} />
            }
          >
            {t('external.add')}
          </Button>
        }
      />
      <ApplicationSources external>
        <Input
          aria-label={t('portal.search')}
          placeholder={t('portal.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='sm:max-w-sm'
        />
        <DataTable
          columns={columns}
          data={rows}
          showSelectedCount={false}
          loading={request.loading}
          listState={
            request.error
              ? 'failed'
              : !request.data
                ? 'loading'
                : rows.length
                  ? 'ready'
                  : search
                    ? 'no-results'
                    : 'empty'
          }
          onRetry={request.reload}
          onClearFilters={() => setSearch('')}
          emptyMessage={t('external.empty')}
        />
      </ApplicationSources>
    </PageContainer>
  );
}
export function ExternalCreate() {
  const location = useLocation();
  const returnParams = new URLSearchParams(location.search);
  returnParams.set('source', 'external');
  const closeTo = {
    pathname: '/multi-app/instances',
    search: returnParams.toString(),
  };
  const formId = useId();
  const { t } = useTranslation(),
    api = useApiClient(),
    navigate = useNavigate();
  const submission = useSubmission({ scope: 'external-app-create' });
  const [name, setName] = useState(''),
    [url, setUrl] = useState(''),
    [kind, setKind] = useState<'nocobase' | 'web'>('nocobase');
  const [authMode, setAuthMode] = useState<'link' | 'platform'>('platform'),
    [callbackUrl, setCallbackUrl] = useState(''),
    [error, setError] = useState<unknown>();
  async function save(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    try {
      const result = await submission.run(
        {
          name,
          url,
          kind,
          authMode,
          callbackUrl:
            kind === 'web' && authMode === 'platform' ? callbackUrl : null,
        },
        (key, signal, input) =>
          api.request<{ data: ExternalApp }>({
            path: 'multiApp/externalApps',
            method: 'POST',
            json: input,
            headers: { 'Idempotency-Key': key },
            signal,
          }),
      );
      if (result) {
        refreshPortal();
        await navigate(`/multi-app/external-apps/${result.data.id}`);
      }
    } catch (failure) {
      setError(failure);
    }
  }
  return (
    <RouteDialog
      title={t('external.add')}
      closeTo={closeTo}
      beforeClose={() => !submission.submitting}
      footer={
        <>
          <DialogClose
            disabled={submission.submitting}
            render={<Button variant='outline' className='h-9 min-w-24' />}
          >
            {t('actions.cancel')}
          </DialogClose>
          <Button
            type='submit'
            form={formId}
            disabled={submission.submitting}
            className='h-9 min-w-24'
          >
            {t(submission.submitting ? 'external.saving' : 'external.add')}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        onSubmit={(event) => {
          save(event).catch(setError);
        }}
        className='space-y-4'
      >
        <div className='space-y-2'>
          <Label htmlFor='external-name'>{t('external.name')} *</Label>
          <Input
            id='external-name'
            required
            maxLength={200}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='external-kind'>{t('external.kind')}</Label>
          <Select
            value={kind}
            onValueChange={(v) => {
              if (v === 'nocobase' || v === 'web') {
                setKind(v);
                setAuthMode(v === 'web' ? 'link' : 'platform');
              }
            }}
          >
            <SelectTrigger className='w-full' id='external-kind'>
              <SelectValue>{t(`external.${kind}`)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='nocobase'>{t('external.nocobase')}</SelectItem>
              <SelectItem value='web'>{t('external.web')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='space-y-2'>
          <Label htmlFor='external-url'>{t('external.url')} *</Label>
          <Input
            id='external-url'
            type='url'
            required
            maxLength={2048}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <p className='text-sm text-muted-foreground'>
            {t('external.urlHint')}
          </p>
        </div>
        <div className='space-y-2'>
          <Label htmlFor='external-auth'>{t('external.authMode')}</Label>
          <Select
            value={authMode}
            onValueChange={(v) => {
              if (v === 'link' || v === 'platform') setAuthMode(v);
            }}
          >
            <SelectTrigger className='w-full' id='external-auth'>
              <SelectValue>{t(`external.${authMode}`)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='link'>{t('external.link')}</SelectItem>
              <SelectItem value='platform'>{t('external.platform')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {kind === 'web' && authMode === 'platform' && (
          <div className='space-y-2'>
            <Label htmlFor='external-callback'>
              {t('external.callback')} *
            </Label>
            <Input
              id='external-callback'
              type='url'
              required
              value={callbackUrl}
              onChange={(e) => setCallbackUrl(e.target.value)}
            />
            <p className='text-sm text-muted-foreground'>
              {t('external.oidcHint')}
            </p>
          </div>
        )}
        <p className='text-sm text-muted-foreground'>
          {t(
            authMode === 'link' ? 'external.linkHint' : 'external.platformHint',
          )}
        </p>
        {error ? <Feedback error={error} /> : null}
      </form>
    </RouteDialog>
  );
}
export default function ExternalDetail() {
  const { id = '' } = useParams(),
    { t } = useTranslation();
  const request = usePortalData<{ data: ExternalApp }>(
    `multiApp/externalApps/${id}`,
  );
  const app = request.data?.data;
  useExternalBreadcrumb(app?.name ?? t('external.title'));
  const url = app && safeUrl(app.url);
  const entryUrl =
    url && app?.kind === 'nocobase' && app.authMode === 'platform'
      ? platformLoginUrl(url)
      : url;
  return (
    <PageContainer>
      <PageHeader
        title={request.data?.data.name ?? t('external.title')}
        description={t('external.description')}
        actions={
          <div className='flex flex-wrap items-center gap-2'>
            {app && (
              <Badge variant='outline'>{t(`external.${app.status}`)}</Badge>
            )}
            {app?.status === 'enabled' && entryUrl && (
              <Button render={<a href={entryUrl} />}>
                {t('portal.enter')}
              </Button>
            )}
          </div>
        }
      />
      {request.error || !request.data ? (
        <Feedback error={request.error} />
      ) : (
        <ExternalDetails
          key={id}
          app={request.data.data}
          reload={request.reload}
        />
      )}
    </PageContainer>
  );
}
function ExternalDetails({
  app,
  reload,
}: {
  app: ExternalApp;
  reload: () => void;
}) {
  const { t } = useTranslation(),
    api = useApiClient(),
    submission = useSubmission({ scope: `external-state:${app.id}` });
  const [error, setError] = useState<unknown>();
  async function toggle() {
    setError(undefined);
    try {
      const result = await submission.run(
        {
          expectedRevision: app.revision,
          status: app.status === 'enabled' ? 'disabled' : 'enabled',
        },
        (key, signal, input) =>
          api.request({
            path: `multiApp/externalApps/${app.id}`,
            method: 'PUT',
            json: input,
            headers: { 'Idempotency-Key': key },
            signal,
          }),
      );
      if (result) {
        reload();
        refreshPortal();
      }
    } catch (failure) {
      setError(failure);
    }
  }
  return (
    <Tabs defaultValue='overview' className='min-w-0 gap-6'>
      <TabsList aria-label={app.name}>
        <TabsTrigger value='overview'>{t('portal.overview')}</TabsTrigger>
        {app.authMode === 'platform' && (
          <TabsTrigger value='configuration'>
            {t('external.configuration')}
          </TabsTrigger>
        )}
        <TabsTrigger value='access'>{t('portal.access')}</TabsTrigger>
      </TabsList>
      {error ? <Feedback error={error} /> : null}
      <TabsContent value='overview'>
        <Card>
          <CardContent className='space-y-4'>
            <dl className='grid gap-4 sm:grid-cols-2'>
              {[
                [t('external.kind'), t(`external.${app.kind}`)],
                [t('external.url'), app.url],
                [t('external.authMode'), t(`external.${app.authMode}`)],
                [t('external.status'), t(`external.${app.status}`)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className='text-sm text-muted-foreground'>{label}</dt>
                  <dd className='mt-1 break-all'>{value}</dd>
                </div>
              ))}
            </dl>
            <p className='text-sm text-muted-foreground'>
              {t(
                app.authMode === 'link'
                  ? 'external.linkHint'
                  : 'external.disableHint',
              )}
            </p>
            <Button
              variant='outline'
              disabled={submission.submitting}
              onClick={() => {
                toggle().catch(setError);
              }}
            >
              {t(
                app.status === 'enabled'
                  ? 'external.disable'
                  : 'external.enable',
              )}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
      {app.authMode === 'platform' && (
        <TabsContent value='configuration' keepMounted>
          <AgentSetup app={app} />
        </TabsContent>
      )}
      <TabsContent value='access' className='space-y-4'>
        {app.authMode === 'link' && (
          <p className='text-sm text-muted-foreground'>
            {t('external.linkHint')}
          </p>
        )}
        <IdentityAccess appId={app.id} accessOnly />
      </TabsContent>
    </Tabs>
  );
}
