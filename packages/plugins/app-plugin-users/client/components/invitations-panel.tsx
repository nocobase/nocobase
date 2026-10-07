import { useTranslation } from '@nocobase/i18n/client';
import { MoreHorizontal, Send, Trash2 } from 'lucide-react';
import { type ReactElement, useState } from 'react';

import type { UserInvitation } from '../user-client.js';
import { Badge } from './ui/badge.js';
import { Button } from './ui/button.js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table.js';

const NS = '@nocobase/app-plugin-users';

/** Pending and expired invitations, each with "send again" and "revoke". */
export function InvitationsPanel({
  invitations,
  busy,
  onResend,
  onRevoke,
}: {
  readonly invitations: readonly UserInvitation[];
  readonly busy: boolean;
  readonly onResend: (invitation: UserInvitation) => void;
  readonly onRevoke: (invitation: UserInvitation) => void;
}): ReactElement {
  const { t, i18n } = useTranslation(NS);
  const [revoking, setRevoking] = useState<UserInvitation>();
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' });

  return (
    <section className='space-y-3'>
      <h2 className='text-base font-medium'>{t('invitations.title')}</h2>
      {invitations.length === 0 ? (
        <p className='text-sm text-muted-foreground'>
          {t('invitations.empty')}
        </p>
      ) : (
        <div className='overflow-x-auto rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('invitations.email')}</TableHead>
                <TableHead>{t('invitations.invitedBy')}</TableHead>
                <TableHead>{t('invitations.status')}</TableHead>
                <TableHead>{t('invitations.expires')}</TableHead>
                <TableHead className='text-right' />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell className='max-w-64 truncate'>
                    {invitation.email}
                  </TableCell>
                  <TableCell>{invitation.invitedBy.name}</TableCell>
                  <TableCell>
                    <div className='flex gap-1'>
                      <Badge variant='secondary'>
                        {t(
                          invitation.status === 'expired'
                            ? 'invitations.expired'
                            : 'invitations.pending',
                        )}
                      </Badge>
                      {invitation.sentAt === null ? (
                        <Badge
                          variant='secondary'
                          className='bg-destructive/10 text-destructive'
                        >
                          {t('invitations.notSent')}
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    {date.format(new Date(invitation.expiresAt))}
                  </TableCell>
                  <TableCell className='text-right'>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant='ghost'
                            size='icon-sm'
                            disabled={busy}
                            aria-label={t('invitations.actionsFor', {
                              email: invitation.email,
                            })}
                          />
                        }
                      >
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align='end'
                        className='w-auto min-w-40'
                      >
                        <DropdownMenuItem onClick={() => onResend(invitation)}>
                          <Send />
                          {t('invitations.resend')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant='destructive'
                          onClick={() => setRevoking(invitation)}
                        >
                          <Trash2 />
                          {t('invitations.revoke')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {revoking ? (
        <AlertDialog
          open
          onOpenChange={(open) => (!open ? setRevoking(undefined) : undefined)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('invitations.revokeTitle', { email: revoking.email })}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('invitations.revokeDescription', {
                  email: revoking.email,
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('form.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                variant='destructive'
                disabled={busy}
                onClick={() => {
                  onRevoke(revoking);
                  setRevoking(undefined);
                }}
              >
                {t('invitations.revoke')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </section>
  );
}
