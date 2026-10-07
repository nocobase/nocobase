/**
 * `ModelServicesPage`: the Models page, laid out like the Apps page: a page header with "Add service", then a table of
 * the model services online agents call, one row per service with its name, base URL host, provider type with how many
 * chat, embedding and rerank models it offers, and status.
 * Several services of one provider are normal (two OpenAI-compatible endpoints, two keys of one provider). Clicking a
 * row, or Edit in its menu, opens its editor in a dialog (`service-editor.tsx`); "Add service" opens the same dialog
 * empty. The menu also turns a service on or off or deletes it. Above the table, the system default chat model online
 * agents with no models of their own answer with (`default-model.tsx`). It reads and manages behind `agents.services`: who
 * only reads sees the same rows and forms, unchangeable.
 */
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BrainCircuitIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  Trash2Icon,
} from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { MODEL_PROVIDERS, type ModelServiceView } from '../../shared/models.js';
import { agentsKeys } from '../api/keys.js';
import {
  AgEmpty,
  AgListSkeleton,
  AgLoadError,
} from '../components/ag-states.js';
import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog.js';
import { Badge } from '../components/ui/badge.js';
import { Button } from '../components/ui/button.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.js';
import { useAgentsApi } from '../hooks/use-agents-api.js';
import { useNotify } from '../hooks/use-notify.js';
import {
  hostOf,
  kindCounts,
  serviceStatus,
  sortServices,
  type ServiceStatus,
} from './model.js';
import { DefaultModelSection } from './default-model.js';
import { ServiceDialog } from './service-editor.js';

const STATUS_BADGE: Record<
  ServiceStatus,
  'secondary' | 'outline' | 'destructive'
> = {
  on: 'secondary',
  off: 'outline',
  noKey: 'destructive',
  noModels: 'destructive',
};

export function ModelServicesPage(): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const canManage = useCan({
    resource: { type: 'settings', id: 'agents.services' },
    action: 'manage',
  }).can;
  const services = useQuery({
    queryKey: agentsKeys.services,
    queryFn: () => api.services(),
  });
  // The dialog's service (null adds one), kept while it closes so its content does not change as it fades out.
  const [editor, setEditor] = useState<{
    readonly open: boolean;
    readonly name: string | null;
  }>({ open: false, name: null });
  const openEditor = (name: string | null) => setEditor({ open: true, name });
  const addButton = canManage ? (
    <Button onClick={() => openEditor(null)}>
      <PlusIcon data-icon='inline-start' />
      {t('services.add.open')}
    </Button>
  ) : null;

  let content: ReactElement;
  if (services.isError && !services.data)
    content = (
      <AgLoadError
        title={t('services.loadFailed')}
        error={services.error}
        onRetry={() => void services.refetch()}
      />
    );
  else if (!services.data) content = <AgListSkeleton rows={2} />;
  else if (services.data.length === 0)
    content = (
      <AgEmpty
        icon={<BrainCircuitIcon />}
        title={t('services.empty.title')}
        description={
          canManage
            ? t('services.empty.description')
            : t('services.empty.readOnly')
        }
        action={addButton}
      />
    );
  else
    content = (
      <div className='rounded-lg border'>
        <Table aria-label={t('services.list')}>
          <TableHeader>
            <TableRow>
              <TableHead>{t('services.columns.name')}</TableHead>
              <TableHead className='w-48'>
                {t('services.columns.provider')}
              </TableHead>
              <TableHead className='w-32'>
                {t('services.columns.status')}
              </TableHead>
              <TableHead className='w-12' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortServices(services.data).map((service) => (
              <ServiceRow
                key={service.name}
                service={service}
                canManage={canManage}
                onEdit={() => openEditor(service.name)}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    );

  return (
    <PageContainer>
      <PageHeader
        title={t('models.title')}
        description={t('models.description')}
        actions={services.data && services.data.length > 0 ? addButton : null}
      />
      {services.data && services.data.length > 0 ? (
        <DefaultModelSection canManage={canManage} />
      ) : null}
      {content}
      {services.data ? (
        <ServiceDialog
          open={editor.open}
          service={
            services.data.find((service) => service.name === editor.name) ??
            null
          }
          services={services.data}
          canManage={canManage}
          onOpenChange={(open) =>
            setEditor((current) => ({ ...current, open }))
          }
        />
      ) : null}
    </PageContainer>
  );
}

/** One service: its name, host, provider and status, and its actions; clicking it opens its editor. */
function ServiceRow({
  service,
  canManage,
  onEdit,
}: {
  readonly service: ModelServiceView;
  readonly canManage: boolean;
  readonly onEdit: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);
  const status = serviceStatus(service);
  const host = hostOf(service);
  // A service's models are the catalog's, and its default chat model's and the agents' state follow from them.
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: agentsKeys.all });
  const power = useMutation({
    mutationFn: (enabled: boolean) =>
      api.updateService(service.name, { enabled }),
    onSuccess: async (_, enabled) => {
      await refresh();
      notify.success(
        t(
          enabled ? 'services.service.turnedOn' : 'services.service.turnedOff',
          {
            title: service.title,
          },
        ),
      );
    },
    onError: (error) => notify.error(error),
  });
  const remove = useMutation({
    mutationFn: () => api.deleteService(service.name),
    onSuccess: async () => {
      await refresh();
      notify.success(t('services.service.deleted', { title: service.title }));
    },
    onError: (error) => notify.error(error),
  });

  return (
    <TableRow
      aria-label={service.title}
      className='cursor-pointer'
      onClick={onEdit}
    >
      <TableCell>
        <div className='min-w-0'>
          <Button
            variant='link'
            className='h-auto max-w-full justify-start px-0 text-left whitespace-normal text-foreground'
            aria-label={t('services.service.edit', { title: service.title })}
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
          >
            {service.title}
          </Button>
          <div className='truncate font-mono text-xs text-muted-foreground'>
            {host ?? t('services.service.defaultHost')}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div>{providerTitle(service)}</div>
        <div className='text-xs text-muted-foreground'>
          {kindCounts(service.models)
            .map(({ kind, count }) =>
              t(`services.models.counts.${kind}`, { count }),
            )
            .join(' · ')}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={STATUS_BADGE[status]}>
          {t(`services.status.${status}`)}
        </Badge>
      </TableCell>
      {/* The menu and its confirmation are portalled, but their clicks still bubble to the row through React. */}
      <TableCell
        className='text-right'
        onClick={(event) => event.stopPropagation()}
      >
        {canManage ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant='ghost'
                  size='icon-sm'
                  aria-label={t('services.service.actions', {
                    title: service.title,
                  })}
                />
              }
            >
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-auto min-w-40'>
              <DropdownMenuItem onClick={onEdit}>
                <PencilIcon />
                {t('actions.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={power.isPending}
                onClick={() => power.mutate(!service.enabled)}
              >
                <PowerIcon />
                {service.enabled
                  ? t('services.service.turnOff')
                  : t('services.service.turnOn')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant='destructive'
                onClick={() => setDeleting(true)}
              >
                <Trash2Icon />
                {t('services.service.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        <AlertDialog open={deleting} onOpenChange={setDeleting}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('services.service.deleteTitle', { title: service.title })}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('services.service.deleteDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                variant='destructive'
                disabled={remove.isPending}
                onClick={() => remove.mutate()}
              >
                {t('services.service.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
}

const providerTitle = (service: ModelServiceView): string =>
  MODEL_PROVIDERS.find((provider) => provider.name === service.provider)
    ?.title ?? service.provider;
