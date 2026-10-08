import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { useToaster } from '@nocobase/app-client';
import { MoreHorizontalIcon, SendIcon, Trash2Icon } from 'lucide-react';
import { type ReactElement, useMemo, useState } from 'react';

import { DataTable } from '../../../components/data-table.js';
import { PmListSkeleton, PmLoadError } from '../../../components/pm-states.js';
import { PmTag } from '../../../components/pm-tag.js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog.js';
import { Button } from '../../../components/ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu.js';
import type {
  Invitation,
  InvitationResult,
} from '../../../../shared/invitations.js';
import { pmKeys } from '../../../api/keys.js';
import { useNotify } from '../../../hooks/use-notify.js';
import { usePmApi } from '../../../hooks/use-pm-api.js';
import { usePmFormatters } from '../../../lib/format.js';
import { InviteResults } from './invite-dialog.js';
import { SectionHeading } from '../section-heading.js';

/**
 * The invitations not accepted yet, under the member table: owner/admin see all, a project lead their own.
 * Each row can be sent again (a fresh link, a new seven days) or revoked. Hidden while there are none.
 */
export function InvitationsSection(): ReactElement | null {
  const { t } = useTranslation();
  const api = usePmApi();
  const notify = useNotify();
  const toaster = useToaster();
  const queryClient = useQueryClient();
  const format = usePmFormatters();
  const [revoking, setRevoking] = useState<Invitation | null>(null);
  const [resent, setResent] = useState<InvitationResult | null>(null);
  const invitations = useQuery({
    queryKey: pmKeys.invitations,
    queryFn: () => api.invitations(),
  });
  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: pmKeys.invitations });
  const failed = (error: unknown) => notify.error(error);

  const resend = useMutation({
    mutationFn: (invitation: Invitation) => api.resendInvitation(invitation.id),
    onSuccess: (result) => {
      if (result.emailSent === false) {
        void toaster.show({
          type: 'warning',
          title: t('invitations.outcome.notSent'),
        });
        setResent(result);
      } else notify.success(t('invitations.resent', { email: result.email }));
    },
    onError: failed,
    onSettled: refresh,
  });
  const revoke = useMutation({
    mutationFn: (invitation: Invitation) => api.revokeInvitation(invitation.id),
    onSuccess: (_, invitation) =>
      notify.success(t('invitations.revoked', { email: invitation.email })),
    onError: failed,
    onSettled: refresh,
  });
  // `useMutation` answers a new object every render; depending on it would rebuild the cells and close an open row menu.
  const { isPending: resending, mutate: resendInvitation } = resend;

  const columns = useMemo<ColumnDef<Invitation, unknown>[]>(
    () => [
      {
        accessorKey: 'email',
        header: t('members.columns.email'),
        cell: ({ row }) => (
          <span className='font-medium'>{row.original.email}</span>
        ),
      },
      {
        id: 'projects',
        header: t('invitations.projects'),
        cell: ({ row }) =>
          row.original.projects.length ? (
            <span className='text-sm'>
              {row.original.projects
                .map((project) => project.name)
                .join(t('invitations.listSeparator'))}
            </span>
          ) : (
            <span className='text-muted-foreground'>—</span>
          ),
      },
      {
        id: 'status',
        header: t('invitations.status'),
        cell: ({ row }) =>
          row.original.status === 'expired' ? (
            <PmTag tone='grey'>{t('invitations.expired')}</PmTag>
          ) : row.original.sentAt ? (
            <PmTag tone='blue'>{t('invitations.pending')}</PmTag>
          ) : (
            <PmTag tone='amber'>{t('invitations.notSent')}</PmTag>
          ),
      },
      {
        id: 'invitedBy',
        header: t('invitations.invitedBy'),
        cell: ({ row }) => (
          <span className='text-sm text-muted-foreground'>
            {row.original.invitedBy.name}
          </span>
        ),
      },
      {
        accessorKey: 'expiresAt',
        header: t('invitations.expiresAt'),
        cell: ({ row }) => (
          <span className='text-sm text-muted-foreground'>
            {format.dateTime(row.original.expiresAt)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => (
          <span className='sr-only'>{t('invitations.actions')}</span>
        ),
        cell: ({ row }) => (
          <div className='flex justify-end'>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label={t('invitations.actionsFor', {
                      email: row.original.email,
                    })}
                  />
                }
              >
                <MoreHorizontalIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-auto min-w-40'>
                <DropdownMenuItem
                  disabled={resending}
                  onClick={() => resendInvitation(row.original)}
                >
                  <SendIcon />
                  {t('invitations.resend')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant='destructive'
                  onClick={() => setRevoking(row.original)}
                >
                  <Trash2Icon />
                  {t('invitations.revoke')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [t, format, resending, resendInvitation],
  );

  const rows = invitations.data;
  if (invitations.isError && !rows)
    return (
      <PmLoadError
        title={t('invitations.loadFailed')}
        error={invitations.error}
        onRetry={() => void invitations.refetch()}
      />
    );
  if (!rows) return <PmListSkeleton rows={2} />;
  if (rows.length === 0) return null;

  return (
    <section
      className='space-y-4 pt-4'
      aria-labelledby='pm-config-invitations-heading'
    >
      <SectionHeading
        id='pm-config-invitations-heading'
        title={t('invitations.title')}
      />
      <DataTable
        columns={columns}
        data={rows}
        pageSize={20}
        showSelectedCount={false}
        getRowId={(invitation) => invitation.id}
      />
      <AlertDialog
        open={revoking !== null}
        onOpenChange={(open) => {
          if (!open) setRevoking(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('invitations.revokeTitle', { email: revoking?.email })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('invitations.revokeDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={() => {
                if (revoking) revoke.mutate(revoking);
                setRevoking(null);
              }}
            >
              {t('invitations.revoke')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog
        open={resent !== null}
        onOpenChange={(open) => {
          if (!open) setResent(null);
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>{t('invitations.linkTitle')}</DialogTitle>
          </DialogHeader>
          {resent ? <InviteResults results={[resent]} /> : null}
          <DialogFooter>
            <Button type='button' onClick={() => setResent(null)}>
              {t('invitations.done')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
