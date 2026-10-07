/**
 * Who may do what, shown where it applies: the space's access sheet (opened from the space's "…" menu) with the
 * viewer's read, propose, edit and manage and where they come from, the application's roles × read, propose, edit and
 * manage in this space with what "related" means here, that agents read and propose at most, and the way to the roles
 * for someone who may change them; and the viewer's access to one entry, at the top of its permissions. The
 * application supplies everything but the viewer's own access (`lib/access.ts`).
 */
import { useTranslation } from '@nocobase/i18n/client';
import {
  ArrowRightIcon,
  CheckIcon,
  EyeIcon,
  LockIcon,
  MessageSquarePlusIcon,
  PencilIcon,
  ShieldCheckIcon,
  XIcon,
} from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router';

import { Badge } from './ui/badge.js';
import { Button } from './ui/button.js';
import { Skeleton } from './ui/skeleton.js';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table.js';
import { cn } from 'cn';

import { ACCESS_NAMESPACE, type KnowledgeAction } from '../../shared/access.js';
import {
  levelOf,
  type KnowledgeAccess,
  type KnowledgeDocSummary,
  type KnowledgeLevel,
} from '../../shared/knowledge.js';
import { useKnowledgeAccess } from '../api.js';
import { textOf } from '../lib/text.js';
import type {
  KnowledgeAccessCell,
  KnowledgeAccessDetails,
} from '../lib/access.js';

const ACTIONS: readonly KnowledgeAction[] = [
  'read',
  'propose',
  'edit',
  'manage',
];

const ICONS: Readonly<Record<KnowledgeLevel, typeof PencilIcon>> = {
  manage: ShieldCheckIcon,
  edit: PencilIcon,
  propose: MessageSquarePlusIcon,
  read: EyeIcon,
  none: LockIcon,
} as const;

function Cell({ cell }: { readonly cell: KnowledgeAccessCell }): ReactElement {
  if (cell.reach === 'none')
    return (
      <span className='text-muted-foreground' aria-label={cell.label}>
        —
      </span>
    );
  return (
    <Badge variant={cell.reach === 'all' ? 'default' : 'secondary'}>
      {cell.label}
    </Badge>
  );
}

/**
 * The viewer's access to an entry and where it comes from, at the top of its permissions: the level and its source on
 * one line, then where it is restricted, and that only someone who manages it may change it, for someone who does not.
 */
export function EntryAccess({
  doc,
  spaceLabel,
}: {
  readonly doc: KnowledgeDocSummary;
  readonly spaceLabel: string;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const found = useKnowledgeAccess(doc.id);
  const access = found.data;
  const Icon = ICONS[access?.level ?? 'none'];
  const source = access?.source;
  const from =
    !source || source.kind === 'none'
      ? null
      : source.kind === 'entry'
        ? t('knowledge.access.source.entry', {
            subject: textOf(t, source.subject.label),
            title: source.docTitle,
          })
        : t(`knowledge.access.source.${source.kind}`, { space: spaceLabel });
  return (
    <section
      className='min-w-0 space-y-1.5'
      data-testid='knowledge-node-access'
    >
      <h3 className='text-sm font-medium'>{t('knowledge.access.yours')}</h3>
      {!access ? (
        <Skeleton className='h-5 w-2/3' />
      ) : (
        <div className='min-w-0 space-y-1 text-sm'>
          <p className='flex min-w-0 items-start gap-1.5'>
            <Icon
              className='mt-0.5 size-4 shrink-0 text-muted-foreground'
              aria-hidden='true'
            />
            <span className='min-w-0 break-words'>
              {t(`knowledge.access.you.${access.level}`)}
              {from ? (
                <span className='text-muted-foreground'>
                  {' · '}
                  {t('knowledge.access.from', { source: from })}
                </span>
              ) : null}
            </span>
          </p>
          {access.restrictedBy ? (
            <p className='flex min-w-0 items-start gap-1.5 text-muted-foreground'>
              <LockIcon
                className='mt-0.5 size-3.5 shrink-0'
                aria-hidden='true'
              />
              <span className='min-w-0 break-words'>
                {t('knowledge.access.restrictedAt', {
                  title: access.restrictedBy.title,
                })}
              </span>
            </p>
          ) : null}
          {access.access.manage ? null : (
            <p className='text-muted-foreground'>
              {t('knowledge.access.viewOnly')}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * A space's access, from its "…" menu: what the viewer may do in it and where that comes from, the application's roles
 * × read, propose, edit and manage here, and the way to the roles.
 */
export function SpaceAccessSheet({
  open,
  onOpenChange,
  access,
  spaceLabel,
  details,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly access: KnowledgeAccess;
  readonly spaceLabel: string;
  readonly details: KnowledgeAccessDetails | undefined;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const level = levelOf(access);
  const Icon = ICONS[level];
  const you = t(`knowledge.access.you.${level}`);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className='w-full gap-0 data-[side=right]:sm:max-w-2xl'
        data-testid='knowledge-space-access'
      >
        <SheetHeader className='border-b pr-12'>
          <SheetTitle>{t('knowledge.access.title')}</SheetTitle>
          <SheetDescription>
            {t('knowledge.access.description', { space: spaceLabel })}
          </SheetDescription>
        </SheetHeader>
        <div className='min-h-0 flex-1 space-y-6 overflow-y-auto p-4'>
          <section className='space-y-2'>
            <div className='flex items-center justify-between gap-2'>
              <h3 className='text-sm font-medium'>
                {t('knowledge.access.yours')}
              </h3>
              <Badge variant='secondary'>
                <Icon data-icon='inline-start' />
                {you}
              </Badge>
            </div>
            <ul className='divide-y rounded-lg border'>
              {ACTIONS.map((action) => (
                <li
                  key={action}
                  className='flex items-center gap-3 px-3 py-2 text-sm'
                >
                  {access[action] ? (
                    <CheckIcon
                      className='size-4 text-emerald-700 dark:text-emerald-400'
                      aria-hidden='true'
                    />
                  ) : (
                    <XIcon
                      className='size-4 text-muted-foreground'
                      aria-hidden='true'
                    />
                  )}
                  <span
                    className={cn(!access[action] && 'text-muted-foreground')}
                  >
                    {t(`knowledge.access.actions.${action}`)}
                  </span>
                  <span className='sr-only'>
                    {access[action]
                      ? t('knowledge.access.allowed')
                      : t('knowledge.access.notAllowed')}
                  </span>
                </li>
              ))}
            </ul>
            {details?.source ? (
              <p className='text-sm text-muted-foreground'>{details.source}</p>
            ) : null}
          </section>
          {details?.rows && details.rows.length > 0 ? (
            <section className='space-y-2'>
              <h3 className='text-sm font-medium'>
                {t('knowledge.access.matrix')}
              </h3>
              <div className='rounded-lg border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('knowledge.access.role')}</TableHead>
                      {ACTIONS.map((action) => (
                        <TableHead key={action}>
                          {t(`knowledge.access.columns.${action}`)}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {details.rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.mine ? 'selected' : undefined}
                      >
                        <TableCell className='font-medium'>
                          {row.title}
                          {row.mine ? (
                            <span className='ml-1.5 text-xs font-normal text-muted-foreground'>
                              {t('knowledge.access.mine')}
                            </span>
                          ) : null}
                        </TableCell>
                        {ACTIONS.map((action) => (
                          <TableCell key={action}>
                            <Cell cell={row.cells[action]} />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          ) : null}
          <section className='space-y-2'>
            <h3 className='text-sm font-medium'>
              {t('knowledge.access.howTitle')}
            </h3>
            <ul className='list-disc space-y-1 pl-5 text-sm text-muted-foreground'>
              {(details?.related ?? []).map((line) => (
                <li key={line}>{line}</li>
              ))}
              <li>{t('knowledge.access.agents')}</li>
            </ul>
          </section>
          {details?.manage ? (
            <Button
              variant='outline'
              nativeButton={false}
              render={<Link to={details.manage.href} />}
            >
              {details.manage.label ?? t('knowledge.access.manage')}
              <ArrowRightIcon data-icon='inline-end' />
            </Button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
