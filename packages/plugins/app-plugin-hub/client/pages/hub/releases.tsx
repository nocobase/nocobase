import {
  Archive,
  CloudUpload,
  ChevronDown,
  ChevronUp,
  Play,
} from 'lucide-react';
import { Badge } from '../../components/ui/badge.js';
import { Button } from '../../components/ui/button.js';
import { Input } from '../../components/ui/input.js';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '../../components/ui/table.js';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactElement,
} from 'react';
import type { AppDetail } from './types.js';
import { Empty, AppDialog } from './shared.js';
import { appActionState, formatDate, formatBytes } from './utils.js';

export function Releases({
  app,
  canRead,
  canUpload,
  canDeploy,
  busy,
  collapsed,
  onCollapsed,
  onDeploy,
  onUpload,
}: {
  readonly app: AppDetail;
  readonly canRead: boolean;
  readonly canUpload: boolean;
  readonly canDeploy: boolean;
  readonly busy: boolean;
  readonly collapsed: boolean;
  readonly onCollapsed: (value: boolean) => void;
  readonly onDeploy: (id: string) => void;
  readonly onUpload: () => void;
}): ReactElement {
  const { t, i18n } = useTranslation('@nocobase/app-plugin-hub');
  const [showAll, setShowAll] = useState(false);
  const state = appActionState(app, 'deploy', busy);
  const reason = state.reason ? t(`actions.${state.reason}`) : undefined;
  // The release endpoint orders persisted uploads newest first; versions are not unique.
  const latestReleaseId = app.releases[0]?.id;
  const highlightedReleaseId =
    latestReleaseId !== app.deployment.observedReleaseId
      ? latestReleaseId
      : undefined;
  return (
    <section aria-label={t('releases.title')}>
      <div className='mb-4 flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h2 className='text-sm font-semibold'>
            {t('releases.title')}
            {canRead ? (
              <span className='ml-2 font-normal text-muted-foreground'>
                {app.releases.length}
              </span>
            ) : null}
          </h2>
          <p className='mt-1 text-xs text-muted-foreground'>
            {t('releases.description')}
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          {canRead && app.releases.length > 0 ? (
            <Button
              variant='ghost'
              size='sm'
              aria-expanded={!collapsed}
              aria-controls='hub-release-list'
              onClick={() => onCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronDown /> : <ChevronUp />}
              {t(collapsed ? 'releases.expand' : 'releases.collapse')}
            </Button>
          ) : null}
          {canUpload ? (
            <Button onClick={onUpload}>
              <CloudUpload />
              {t('releases.upload', { defaultValue: 'Upload release' })}
            </Button>
          ) : null}
        </div>
      </div>
      {canRead && !collapsed && app.releases.length > 0 ? (
        <div id='hub-release-list'>
          <div className='overflow-hidden rounded-lg border'>
            <Table>
              <TableHeader className='bg-muted/20'>
                <TableRow>
                  <TableHead>{t('deployments.release')}</TableHead>
                  <TableHead>{t('releases.uploadedAt')}</TableHead>
                  <TableHead>{t('releases.size')}</TableHead>
                  <TableHead className='text-right'>
                    {t('deployments.actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(showAll ? app.releases : app.releases.slice(0, 3)).map(
                  (item) => (
                    <TableRow
                      key={item.id}
                      className={
                        item.id === highlightedReleaseId
                          ? 'bg-primary/5'
                          : undefined
                      }
                    >
                      <TableCell>
                        <div className='flex flex-wrap items-center gap-2'>
                          <span className='font-medium'>v{item.version}</span>
                          {item.id === app.deployment.observedReleaseId ? (
                            <Badge className='bg-emerald-500/10 text-emerald-700'>
                              {t('releases.active')}
                            </Badge>
                          ) : null}
                          {item.id === latestReleaseId ? (
                            <Badge className='bg-sky-500/10 text-sky-700 dark:text-sky-300'>
                              {t('releases.latestUpload')}
                            </Badge>
                          ) : null}
                        </div>
                        <span className='font-mono text-xs text-muted-foreground'>
                          {item.checksum.slice(0, 12)}
                        </span>
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {formatDate(item.createdAt, i18n.language)}
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {formatBytes(item.size)}
                      </TableCell>
                      <TableCell className='text-right'>
                        {canDeploy ? (
                          <Button
                            size='sm'
                            variant={
                              item.id === highlightedReleaseId
                                ? 'default'
                                : 'outline'
                            }
                            disabled={!state.enabled}
                            title={reason}
                            aria-label={t('releases.deployVersion', {
                              version: item.version,
                              defaultValue: `Deploy v${item.version}`,
                            })}
                            onClick={() => onDeploy(item.id)}
                          >
                            <Play />
                            {t('releases.deploy', { defaultValue: 'Deploy' })}
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </div>
          <div className='mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground'>
            <span>{t('releases.reusable')}</span>
            {app.releases.length > 3 ? (
              <Button
                size='sm'
                variant='ghost'
                onClick={() => setShowAll(!showAll)}
              >
                {t(showAll ? 'releases.showLess' : 'releases.showAll', {
                  count: app.releases.length,
                })}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
      {!app.hasReleases ? (
        <div className='rounded-lg border border-dashed bg-muted/20 py-8'>
          <Empty
            icon={<Archive />}
            title={t('releases.firstTitle')}
            description={t('releases.firstDescription')}
          />
        </div>
      ) : null}
    </section>
  );
}

export function UploadReleaseDialog({
  artifact,
  busy,
  onArtifact,
  onClose,
  onUpload,
}: {
  readonly artifact: File | undefined;
  readonly busy: boolean;
  readonly onArtifact: (file: File | undefined) => void;
  readonly onClose: () => void;
  readonly onUpload: () => void;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-hub');
  const [dragging, setDragging] = useState(false);
  const dragDepthRef = useRef(0);
  const [selectionError, setSelectionError] = useState(false);
  const selectFiles = (files: FileList | readonly File[]): void => {
    if (busy || files.length === 0) return;
    const file = files[0];
    if (files.length !== 1 || !file || !/\.(tar\.gz|tgz)$/i.test(file.name)) {
      setSelectionError(true);
      return;
    }
    setSelectionError(false);
    onArtifact(file);
  };
  useEffect(() => {
    // A file dropped beside the zone would otherwise leave the Hub to open or download it, losing this dialog, so
    // every drop while it is open is claimed here and only the zone acts on one.
    const claim = (event: Event): void => {
      if (
        carriesFiles(
          (event as Event & { dataTransfer?: DataTransfer }).dataTransfer,
        )
      ) {
        event.preventDefault();
      }
    };
    document.addEventListener('dragover', claim);
    document.addEventListener('drop', claim);
    return () => {
      document.removeEventListener('dragover', claim);
      document.removeEventListener('drop', claim);
    };
  }, []);
  return (
    <AppDialog
      title={t('releases.uploadTitle', { defaultValue: 'Upload release' })}
      description={t('releases.uploadDescription', {
        defaultValue:
          'Upload a built application artifact. Version and config.example.yml or config.example.yaml are detected automatically.',
      })}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} variant='outline'>
            {t('releases.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button disabled={!artifact || busy} onClick={onUpload}>
            {busy
              ? t('releases.uploading', { defaultValue: 'Uploading…' })
              : t('releases.upload', { defaultValue: 'Upload release' })}
          </Button>
        </>
      }
    >
      <label
        className={`relative flex min-h-28 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-sm focus-within:ring-2 focus-within:ring-ring ${busy ? 'cursor-not-allowed opacity-50' : ''} ${dragging ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}
        onDragEnter={(event: DragEvent<HTMLElement>) => {
          if (!carriesFiles(event.dataTransfer)) return;
          event.preventDefault();
          dragDepthRef.current += 1;
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => {
          dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
          if (dragDepthRef.current === 0) setDragging(false);
        }}
        onDragOver={(event: DragEvent<HTMLElement>) => {
          if (!carriesFiles(event.dataTransfer)) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = busy ? 'none' : 'copy';
          if (!busy) setDragging(true);
        }}
        onDrop={(event: DragEvent<HTMLElement>) => {
          if (!carriesFiles(event.dataTransfer)) return;
          event.preventDefault();
          dragDepthRef.current = 0;
          setDragging(false);
          selectFiles(event.dataTransfer.files);
        }}
      >
        <CloudUpload className='size-5' />
        <span className='max-w-full break-all text-center'>
          {dragging
            ? t('releases.dropArtifact', {
                defaultValue: 'Drop to select this artifact',
              })
            : (artifact?.name ??
              t('releases.chooseArtifact', {
                defaultValue: 'Click or drag a .tar.gz / .tgz artifact here',
              }))}
        </span>
        <span className='text-center text-xs text-muted-foreground'>
          {t('releases.selectionHint', {
            defaultValue:
              'Select one file, then click Upload release to submit.',
          })}
        </span>
        {/* Native pickers may reject compound .tar.gz filters. Validate names in
            selectFiles for both picker and drop input instead. */}
        <Input
          aria-label={t('releases.chooseArtifact', {
            defaultValue: 'Click or drag a .tar.gz / .tgz artifact here',
          })}
          className='absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed'
          disabled={busy}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            if (event.target.files) selectFiles(event.target.files);
            event.target.value = '';
          }}
          type='file'
        />
      </label>
      {selectionError && (
        <p role='alert' className='mt-2 text-sm text-destructive'>
          {t('releases.invalidSelection', {
            defaultValue: 'Select exactly one .tar.gz or .tgz file.',
          })}
        </p>
      )}
    </AppDialog>
  );
}

/** A drop only means an artifact when it carries files; text and links belong to the browser. */
function carriesFiles(dataTransfer: DataTransfer | null | undefined): boolean {
  return Boolean(dataTransfer?.types?.includes('Files'));
}
