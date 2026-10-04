import { Link } from 'react-router';
import {
  Boxes,
  Clipboard,
  ClipboardCheck,
  MoreHorizontal,
  Play,
  RotateCcw,
} from 'lucide-react';
import { Badge } from '../../components/ui/badge.js';
import { Button } from '../../components/ui/button.js';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from '../../components/ui/pagination.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table.js';
import { useTranslation } from '@nocobase/i18n/client';
import { useState, type ReactElement } from 'react';
import type { AppDetail, DeploymentRecord } from './types.js';
import { Empty, StatusBadge, AppDialog } from './shared.js';
import {
  appActionState,
  shortId,
  deploymentPhaseLabel,
  formatDateTime,
  readError,
} from './utils.js';

export function Deployments({
  app,
  busy,
  canDeploy,
  canRollback,
  onDeploy,
  onRollback,
  pagination,
  loading,
  onPage,
}: {
  readonly app: AppDetail;
  readonly busy: boolean;
  readonly canDeploy: boolean;
  readonly canRollback: boolean;
  readonly onDeploy: () => void;
  readonly onRollback: (deploymentId: string) => void;
  readonly pagination: { page: number; pageSize: number; total: number };
  readonly loading: boolean;
  readonly onPage: (page: number) => void;
}): ReactElement {
  const { t, i18n } = useTranslation('@nocobase/app-plugin-hub');
  const deployState = appActionState(app, 'deploy', busy);
  const rollbackState = appActionState(app, 'rollback', busy);
  const previousDisabled = loading || pagination.page <= 1;
  const nextDisabled =
    loading || pagination.page * pagination.pageSize >= pagination.total;
  if (app.deployments.length === 0) {
    return (
      <Empty
        icon={<Boxes />}
        title={t('deployments.noDeployments', {
          defaultValue: 'No deployments yet',
        })}
        description={t('deployments.noDeploymentsDescription', {
          defaultValue: 'Deploy a release to create the first deployment.',
        })}
        action={
          canDeploy ? (
            <div className='flex flex-col items-start gap-1'>
              <Button
                disabled={!deployState.enabled}
                title={
                  deployState.reason
                    ? t(`actions.${deployState.reason}`, {
                        defaultValue: deployState.reason,
                      })
                    : undefined
                }
                aria-describedby={
                  deployState.reason ? 'hub-deploy-action-reason' : undefined
                }
                onClick={onDeploy}
              >
                <Play className='size-4' />{' '}
                {t('deployments.deploy', { defaultValue: 'Deploy release' })}
              </Button>
              {deployState.reason ? (
                <span className='sr-only' id='hub-deploy-action-reason'>
                  {t(`actions.${deployState.reason}`, {
                    defaultValue: deployState.reason,
                  })}
                </span>
              ) : null}
            </div>
          ) : undefined
        }
      />
    );
  }
  return (
    <div className='space-y-5'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h2 className='text-lg font-semibold'>
            {t('deployments.title', { defaultValue: 'Deployments' })}
            <span className='ml-2 text-sm font-normal text-muted-foreground'>
              {pagination.total}
            </span>
          </h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            {t('deployments.description', {
              defaultValue:
                'Each row is a deployment operation. Rolling back creates a new deployment using the selected release and configuration.',
            })}
          </p>
        </div>
        {canDeploy ? (
          <Button
            disabled={!deployState.enabled}
            title={
              deployState.reason
                ? t(`actions.${deployState.reason}`, {
                    defaultValue: deployState.reason,
                  })
                : undefined
            }
            aria-describedby={
              deployState.reason ? 'hub-deploy-action-reason' : undefined
            }
            onClick={onDeploy}
          >
            <Play className='size-4' />{' '}
            {t('deployments.deploy', { defaultValue: 'Deploy release' })}
          </Button>
        ) : null}
      </div>
      {/* The reason a disabled action cannot run is shown as the button's tooltip and read out through
          `aria-describedby`; the header of the detail page follows the same pattern. Repeating it as visible text
          above the table added noise without telling the user anything the button itself does not. */}
      {deployState.reason ? (
        <span className='sr-only' id='hub-deploy-action-reason'>
          {t(`actions.${deployState.reason}`, {
            defaultValue: deployState.reason,
          })}
        </span>
      ) : null}
      <div
        className='overflow-hidden rounded-lg border bg-card'
        aria-busy={loading}
      >
        <Table className='min-w-[800px]'>
          <TableHeader className='bg-muted/20'>
            <TableRow>
              <TableHead className='w-[25%]'>
                {t('deployments.release', { defaultValue: 'Release' })}
              </TableHead>
              <TableHead className='w-[21%]'>
                {t('deployments.deployment', { defaultValue: 'Deployment' })}
              </TableHead>
              <TableHead className='w-[24%]'>
                {t('deployments.status', { defaultValue: 'Status' })}
              </TableHead>
              <TableHead className='w-[16%]'>
                {t('deployments.created', { defaultValue: 'Created' })}
              </TableHead>
              <TableHead className='w-20'>
                <span className='sr-only'>
                  {t('deployments.actions', { defaultValue: 'Actions' })}
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {app.deployments.map((deployment) => {
              const deployedRelease = deployment.release;
              const current = deployment.id === app.app.currentDeploymentId;
              const rowRollbackReason = current
                ? 'currentDeployment'
                : deployment.status !== 'succeeded'
                  ? 'deploymentNotSucceeded'
                  : rollbackState.reason;
              return (
                <TableRow
                  className={
                    current
                      ? 'bg-primary/[0.025] hover:bg-primary/[0.045]'
                      : undefined
                  }
                  key={deployment.id}
                >
                  <TableCell className='py-4'>
                    <div className='flex items-center gap-2'>
                      <span className='font-medium tabular-nums'>
                        {deployedRelease
                          ? `v${deployedRelease.version}`
                          : t('deployments.unknown', {
                              defaultValue: 'Unknown',
                            })}
                      </span>
                      {current ? (
                        <Badge className='bg-emerald-500/10 text-emerald-700'>
                          {t('deployments.current', {
                            defaultValue: 'Current',
                          })}
                        </Badge>
                      ) : null}
                    </div>
                    {deployedRelease ? (
                      <div className='mt-0.5 font-mono text-[11px] text-muted-foreground'>
                        {deployedRelease.checksum.slice(0, 12)}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className='py-4'>
                    <DeploymentId value={deployment.id} />
                    <div className='mt-0.5 text-xs text-muted-foreground'>
                      {deployment.kind === 'rollback'
                        ? t('deployments.rolledBack', {
                            defaultValue: 'Rolled back',
                          })
                        : t('deployments.deployed', {
                            defaultValue: 'Deployed',
                          })}
                    </div>
                  </TableCell>
                  <TableCell className='py-4'>
                    <DeploymentStatus deployment={deployment} />
                  </TableCell>
                  <TableCell className='whitespace-nowrap py-4 text-sm text-muted-foreground tabular-nums'>
                    {formatDateTime(deployment.createdAt, i18n.language)}
                  </TableCell>
                  <TableCell className='py-4 text-right align-top'>
                    <div className='flex items-center justify-end gap-2'>
                      <Link
                        className='text-xs text-primary underline underline-offset-4'
                        to={`${deployment.id}/logs`}
                      >
                        {t('logs.view')}
                      </Link>

                      {canRollback ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                aria-label={`${t('deployments.actions', {
                                  defaultValue: 'Actions',
                                })} for deployment ${shortId(deployment.id)}${
                                  rowRollbackReason
                                    ? `: ${t(`actions.${rowRollbackReason}`, {
                                        defaultValue: rowRollbackReason,
                                      })}`
                                    : ''
                                }`}
                                className='size-8 text-muted-foreground'
                                size='icon'
                                title={
                                  rowRollbackReason
                                    ? t(`actions.${rowRollbackReason}`, {
                                        defaultValue: rowRollbackReason,
                                      })
                                    : t('deployments.actions', {
                                        defaultValue: 'Actions',
                                      })
                                }
                                variant='ghost'
                              >
                                <MoreHorizontal />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align='end' className='w-40'>
                            <DropdownMenuItem
                              disabled={
                                !rollbackState.enabled ||
                                deployment.status !== 'succeeded' ||
                                current
                              }
                              title={
                                rowRollbackReason
                                  ? t(`actions.${rowRollbackReason}`, {
                                      defaultValue: rowRollbackReason,
                                    })
                                  : undefined
                              }
                              aria-describedby={
                                rowRollbackReason
                                  ? `hub-rollback-${deployment.id}-reason`
                                  : undefined
                              }
                              onClick={() => onRollback(deployment.id)}
                            >
                              <RotateCcw />
                              {t('deployments.rollback', {
                                defaultValue: 'Roll back',
                              })}
                              {rowRollbackReason ? (
                                <span
                                  className='sr-only'
                                  id={`hub-rollback-${deployment.id}-reason`}
                                >
                                  {t(`actions.${rowRollbackReason}`, {
                                    defaultValue: rowRollbackReason,
                                  })}
                                </span>
                              ) : null}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className='flex items-center justify-between gap-3 pt-1 text-sm text-muted-foreground'>
        <span>
          {t('deployments.pagination', {
            count: pagination.total,
            page: pagination.page,
            pages: Math.max(
              1,
              Math.ceil(pagination.total / pagination.pageSize),
            ),
            defaultValue: `${pagination.total} deployments · Page ${pagination.page} of ${Math.max(1, Math.ceil(pagination.total / pagination.pageSize))}`,
          })}
        </span>
        <Pagination
          aria-label={t('deployments.title', {
            defaultValue: 'Deployments',
          })}
          className='mx-0 w-auto'
        >
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href='#'
                aria-label={t('deployments.previousPage', {
                  defaultValue: 'Previous deployment page',
                })}
                aria-disabled={previousDisabled}
                tabIndex={previousDisabled ? -1 : undefined}
                className={
                  previousDisabled
                    ? 'pointer-events-none opacity-50'
                    : undefined
                }
                onClick={(event) => {
                  event.preventDefault();
                  if (!previousDisabled) onPage(pagination.page - 1);
                }}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href='#'
                aria-label={t('deployments.nextPage', {
                  defaultValue: 'Next deployment page',
                })}
                aria-disabled={nextDisabled}
                tabIndex={nextDisabled ? -1 : undefined}
                className={
                  nextDisabled ? 'pointer-events-none opacity-50' : undefined
                }
                onClick={(event) => {
                  event.preventDefault();
                  if (!nextDisabled) onPage(pagination.page + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

export function DeploymentId({
  value,
}: {
  readonly value: string;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-hub');
  const [copied, setCopied] = useState(false);
  const copy = async (): Promise<void> => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  };
  return (
    <Button
      aria-label={t('deployments.copyId', {
        defaultValue: 'Copy deployment ID',
      })}
      className='group/deployment-id h-auto cursor-copy gap-1 rounded-none p-0 text-sm font-medium tabular-nums hover:bg-transparent hover:text-primary [&_svg]:size-3.5'
      onClick={() => void copy()}
      variant='ghost'
    >
      {shortId(value)}
      {copied ? (
        <ClipboardCheck className='text-muted-foreground' />
      ) : (
        <Clipboard className='opacity-0 transition-opacity group-hover/deployment-id:opacity-100 group-focus-visible/deployment-id:opacity-100' />
      )}
    </Button>
  );
}

export function DeploymentStatus({
  deployment,
}: {
  readonly deployment: DeploymentRecord;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-hub');
  if (deployment.status === 'deploying') {
    return (
      <Badge
        className='gap-1.5 whitespace-nowrap bg-amber-500/10 text-amber-700'
        role='status'
      >
        <span className='size-1.5 rounded-full bg-amber-500' />
        {t(`deployments.phases.${deployment.phase}`, {
          defaultValue: deploymentPhaseLabel(deployment.phase),
        })}
      </Badge>
    );
  }
  return (
    <div className='space-y-2'>
      <div className='flex flex-wrap items-center gap-2'>
        <StatusBadge state={deployment.status} />
        {deployment.cacheHit ? (
          <Badge className='bg-sky-500/10 text-sky-700 dark:text-sky-300'>
            {t('deployments.cacheReused', { defaultValue: 'Cache reused' })}
          </Badge>
        ) : null}
      </div>
      {deployment.error ? <DeploymentError message={deployment.error} /> : null}
    </div>
  );
}

/**
 * A deployment's stored failure is text the App Host wrote, not an API error, so it carries no `reason`. The Host
 * reports an archive whose version differs from the Release it was deployed as with this sentence.
 */
function isArtifactVersionMismatch(message: string): boolean {
  return /^Artifact version mismatch\b/iu.test(message);
}

export function DeploymentError({
  message,
}: {
  readonly message: string;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-hub');
  const readableError = readError(message);
  const summary = isArtifactVersionMismatch(message)
    ? t('errors.artifactVersionMismatchDescription', {
        defaultValue:
          'Build the release from this application source, then upload the generated artifact again.',
      })
    : readableError.isTechnical
      ? t('errors.unexpectedDescription', {
          defaultValue:
            'The operation could not be completed. Try again. If the problem continues, share the technical details with an administrator.',
        })
      : readableError.message;
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const copy = async (): Promise<void> => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  };
  return (
    <div className='mt-2 flex min-w-0 max-w-full items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-1.5'>
      <Button
        className='h-auto min-w-0 flex-1 justify-start whitespace-normal px-2 py-1.5 text-left text-xs leading-4 text-destructive hover:text-destructive'
        onClick={() => setOpen(true)}
        title={message}
        variant='ghost'
      >
        <span className='line-clamp-2'>{summary}</span>
      </Button>
      <Button
        aria-label={t('deployments.copyError', { defaultValue: 'Copy error' })}
        className='mt-0.5 size-7 shrink-0 text-destructive hover:text-destructive'
        onClick={() => void copy()}
        size='icon'
        title={
          copied
            ? t('deployments.copied', { defaultValue: 'Copied' })
            : t('deployments.copyError', { defaultValue: 'Copy error' })
        }
        variant='ghost'
      >
        {copied ? <ClipboardCheck /> : <Clipboard />}
      </Button>
      {open ? (
        <AppDialog
          title={t('deployments.errorTitle', {
            defaultValue: 'Deployment error',
          })}
          description={t('deployments.errorDescription', {
            defaultValue: 'The deployment did not complete successfully.',
          })}
          onClose={() => setOpen(false)}
          wide
          footer={
            <>
              <Button onClick={() => setOpen(false)} variant='outline'>
                {t('deployments.close', { defaultValue: 'Close' })}
              </Button>
              <Button onClick={() => void copy()}>
                {copied ? <ClipboardCheck /> : <Clipboard />}
                {copied
                  ? t('deployments.copied', { defaultValue: 'Copied' })
                  : t('deployments.copyError', { defaultValue: 'Copy error' })}
              </Button>
            </>
          }
        >
          <pre className='max-h-[24rem] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-950 p-4 font-mono text-xs leading-5 text-red-200'>
            {readableError.technicalMessage}
          </pre>
        </AppDialog>
      ) : null}
    </div>
  );
}
