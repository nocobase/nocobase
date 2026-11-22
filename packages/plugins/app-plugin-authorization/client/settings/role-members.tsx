import { ApiClientError, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { PlusIcon } from 'lucide-react';
import { Link } from 'react-router';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from 'react';

import { useIsPhone } from '#components/data-table/data-table';
import { Button } from '#components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog';
import { Input } from '#components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#components/ui/table';
import type {
  LocalizedText,
  PermissionSetAssignment,
  SubjectOption,
} from '../authorization-client.js';
import { useAuthorizationClient } from '../use-authorization-client.js';
import { SettingsError, SettingsLoading } from './shared.js';

/** The surface whose subject directory the members tab reads. */
const SURFACE = 'permissionSets';
const PAGE_SIZE = 20;

export interface RoleMemberType {
  readonly type: string;
  readonly title: LocalizedText;
  /** Only a type with a directory can be listed and added here. */
  readonly directory: boolean;
}

interface Member {
  readonly assignment: PermissionSetAssignment;
  readonly title: string;
  readonly description?: string;
}

const subjectKey = (subject: { type: string; id: string }): string =>
  `${subject.type}:${subject.id}`;

/**
 * Who holds a role. Adding and removing a member takes effect at once, apart from the role's unsaved permission
 * changes, as the review before saving says.
 */
export function RoleMembers({
  permissionSet,
  types,
  editable,
  onCount,
  checkHref,
}: {
  readonly permissionSet: string;
  readonly types: readonly RoleMemberType[];
  /** The person may assign and revoke this role. */
  readonly editable: boolean;
  /** Reports how many members the role has, for the tab's badge. */
  readonly onCount?: (count: number) => void;
  /** Where a user's permissions are checked, such as Permission check with the user picked. */
  readonly checkHref?: ((userId: string) => string) | undefined;
}): ReactElement {
  const { t } = useTranslation();
  const authz = useAuthorizationClient();
  const toaster = useToaster();
  const text = useCallback(
    (value: LocalizedText | undefined): string =>
      value === undefined
        ? ''
        : typeof value === 'string'
          ? value
          : t(value.key, {
              ns: value.ns,
              defaultValue: value.defaultValue ?? value.key,
            }),
    [t],
  );
  const [members, setMembers] = useState<readonly Member[]>();
  const [error, setError] = useState<unknown>();
  const [attempt, setAttempt] = useState(0);
  const [removing, setRemoving] = useState<string>();
  const [adding, setAdding] = useState(false);
  const typeTitle = useCallback(
    (type: string): string => {
      const found = types.find((candidate) => candidate.type === type);
      return found ? text(found.title) : type;
    },
    [types, text],
  );

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const assignments = await authz.listAssignments(permissionSet);
        const byType = new Map<string, string[]>();
        for (const assignment of assignments) {
          const ids = byType.get(assignment.subject.type) ?? [];
          ids.push(assignment.subject.id);
          byType.set(assignment.subject.type, ids);
        }
        // A title that cannot be resolved falls back to the subject's id, so the member stays removable.
        const titles = new Map<string, SubjectOption>();
        await Promise.all(
          [...byType].map(async ([type, ids]) => {
            if (!types.some((item) => item.type === type && item.directory))
              return;
            for (let start = 0; start < ids.length; start += 100) {
              const found = await authz
                .resolveSubjects(SURFACE, type, ids.slice(start, start + 100))
                .catch(() => []);
              for (const option of found)
                titles.set(subjectKey({ type, id: option.id }), option);
            }
          }),
        );
        if (!active) return;
        setError(undefined);
        setMembers(
          assignments.map((assignment) => {
            const option = titles.get(subjectKey(assignment.subject));
            return {
              assignment,
              title: option ? text(option.title) : assignment.subject.id,
              ...(option?.description === undefined
                ? {}
                : { description: text(option.description) }),
            };
          }),
        );
      } catch (next) {
        if (active) setError(next);
      }
    })();
    return () => {
      active = false;
    };
  }, [authz, permissionSet, types, text, attempt]);

  useEffect(() => {
    if (members) onCount?.(members.length);
  }, [members, onCount]);

  // The other roles each member holds, so a member's permissions read as the sum of their roles. Best effort: a role
  // whose members cannot be read is left out.
  const [otherRoles, setOtherRoles] =
    useState<ReadonlyMap<string, readonly string[]>>();
  useEffect(() => {
    if (!members?.length) return;
    let active = true;
    void (async () => {
      const sets = await authz.listPermissionSets().catch(() => []);
      const byMember = new Map<string, string[]>();
      await Promise.all(
        sets
          .filter((set) => set.key !== permissionSet)
          .map(async (set) => {
            const assignments = await authz
              .listAssignments(set.key)
              .catch(() => []);
            for (const assignment of assignments) {
              const key = subjectKey(assignment.subject);
              byMember.set(key, [
                ...(byMember.get(key) ?? []),
                text(set.title ?? set.key),
              ]);
            }
          }),
      );
      if (active) setOtherRoles(byMember);
    })();
    return () => {
      active = false;
    };
  }, [authz, members, permissionSet, text]);

  const reload = (): void => setAttempt((value) => value + 1);

  const remove = async (member: Member): Promise<void> => {
    setRemoving(member.assignment.id);
    try {
      await authz.revoke(permissionSet, member.assignment.id);
      toaster.show({
        type: 'success',
        title: t('settings.members.removed', { name: member.title }),
      });
      reload();
    } catch (next) {
      toaster.show({
        type: 'error',
        title: t(
          next instanceof ApiClientError && next.reason === 'LAST_ASSIGNMENT'
            ? 'settings.members.keepOne'
            : 'settings.failed',
        ),
      });
    } finally {
      setRemoving(undefined);
    }
  };

  const assigned = useMemo(
    () =>
      new Set(
        (members ?? []).map((member) => subjectKey(member.assignment.subject)),
      ),
    [members],
  );
  const directories = types.filter((type) => type.directory);
  const phone = useIsPhone(true);
  // The Type column tells members apart only when they are of more than one kind, such as users and teams.
  const showType =
    new Set((members ?? []).map((member) => member.assignment.subject.type))
      .size > 1;
  const otherRolesOf = (member: Member): ReactElement => (
    <span className='flex flex-wrap gap-1'>
      {otherRoles?.get(subjectKey(member.assignment.subject))?.map((role) => (
        <span
          key={role}
          className='rounded bg-muted px-1.5 text-xs leading-5 text-muted-foreground'
        >
          {role}
        </span>
      ))}
    </span>
  );
  const actionsOf = (member: Member): ReactElement | null =>
    (checkHref && member.assignment.subject.type === 'user') || editable ? (
      <div className='flex flex-wrap items-center gap-2 md:flex-nowrap md:justify-end'>
        {checkHref && member.assignment.subject.type === 'user' && (
          <Link
            className='text-sm text-primary underline-offset-4 hover:underline'
            to={checkHref(member.assignment.subject.id)}
          >
            {t('settings.members.checkPermissions')}
          </Link>
        )}
        {editable && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            disabled={removing !== undefined}
            aria-label={t('settings.members.removeMember', {
              name: member.title,
            })}
            onClick={() => void remove(member)}
          >
            {t('settings.members.remove')}
          </Button>
        )}
      </div>
    ) : null;

  if (error) return <SettingsError error={error} retry={reload} />;
  if (!members) return <SettingsLoading />;
  return (
    <div className='flex flex-col gap-3' data-slot='role-members'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <p className='text-sm text-muted-foreground'>
          {t('settings.members.description', { count: members.length })}
        </p>
        {editable && directories.length > 0 && (
          <Button type='button' size='sm' onClick={() => setAdding(true)}>
            <PlusIcon />
            {t('settings.members.add')}
          </Button>
        )}
      </div>
      {members.length === 0 ? (
        <p className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>
          {t('settings.members.empty')}
        </p>
      ) : phone ? (
        // A phone lists each member as a card with its actions under it, so nothing scrolls sideways.
        <ul
          className='divide-y rounded-lg border'
          data-slot='role-member-cards'
        >
          {members.map((member) => (
            <li key={member.assignment.id} className='flex flex-col gap-2 p-3'>
              <div className='min-w-0'>
                <div className='font-medium break-words'>{member.title}</div>
                {member.description && (
                  <div className='text-xs break-words text-muted-foreground'>
                    {member.description}
                  </div>
                )}
                {showType && (
                  <div className='text-xs text-muted-foreground'>
                    {typeTitle(member.assignment.subject.type)}
                  </div>
                )}
              </div>
              {otherRoles?.get(subjectKey(member.assignment.subject))
                ?.length ? (
                <div className='flex flex-wrap items-center gap-1 text-xs text-muted-foreground'>
                  {t('settings.members.otherRoles')}:{otherRolesOf(member)}
                </div>
              ) : null}
              {actionsOf(member)}
            </li>
          ))}
        </ul>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('settings.members.member')}</TableHead>
              {showType && <TableHead>{t('settings.members.type')}</TableHead>}
              <TableHead>{t('settings.members.otherRoles')}</TableHead>
              {(editable || checkHref) && (
                <TableHead className='text-right'>
                  <span className='sr-only'>{t('settings.actions')}</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.assignment.id}>
                <TableCell>
                  <div className='font-medium'>{member.title}</div>
                  {member.description && (
                    <div className='text-xs text-muted-foreground'>
                      {member.description}
                    </div>
                  )}
                </TableCell>
                {showType && (
                  <TableCell className='text-muted-foreground'>
                    {typeTitle(member.assignment.subject.type)}
                  </TableCell>
                )}
                <TableCell>
                  {otherRoles?.get(subjectKey(member.assignment.subject))
                    ?.length ? (
                    otherRolesOf(member)
                  ) : (
                    <span className='text-muted-foreground'>
                      {otherRoles ? '—' : ''}
                    </span>
                  )}
                </TableCell>
                {(editable || checkHref) && (
                  <TableCell className='text-right whitespace-nowrap'>
                    {actionsOf(member)}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {editable && (
        <p className='text-xs text-muted-foreground'>
          {t('settings.members.immediate')}
        </p>
      )}
      {adding && (
        <AddMembers
          permissionSet={permissionSet}
          types={directories}
          assigned={assigned}
          text={text}
          onClose={() => setAdding(false)}
          onAdded={reload}
        />
      )}
    </div>
  );
}

function AddMembers({
  permissionSet,
  types,
  assigned,
  text,
  onClose,
  onAdded,
}: {
  readonly permissionSet: string;
  readonly types: readonly RoleMemberType[];
  readonly assigned: ReadonlySet<string>;
  readonly text: (value: LocalizedText | undefined) => string;
  readonly onClose: () => void;
  readonly onAdded: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const authz = useAuthorizationClient();
  const toaster = useToaster();
  const [type, setType] = useState(types[0]?.type ?? '');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{
    readonly key: string;
    readonly items: readonly SubjectOption[];
    readonly total: number;
  }>();
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState<string>();
  const [added, setAdded] = useState<ReadonlySet<string>>(() => new Set());
  const search = query.trim();
  const key = `${type}\n${search}`;

  useEffect(() => {
    if (!type) return;
    let active = true;
    // Searching waits for a pause in typing, so each keystroke does not send a request.
    const timer = setTimeout(() => {
      authz
        .listSubjects(SURFACE, type, {
          ...(search ? { search } : {}),
          page: 1,
          pageSize: PAGE_SIZE,
        })
        .then(
          (page) => {
            if (!active) return;
            setError(undefined);
            setResult({ key, ...page });
          },
          (next: unknown) => {
            if (active) setError(next);
          },
        );
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [authz, type, search, key]);

  const add = async (option: SubjectOption): Promise<void> => {
    const subject = { type, id: option.id };
    setBusy(subjectKey(subject));
    try {
      await authz.assign(permissionSet, { subject });
      setAdded((current) => new Set([...current, subjectKey(subject)]));
      toaster.show({
        type: 'success',
        title: t('settings.members.added', { name: text(option.title) }),
      });
      onAdded();
    } catch (next) {
      setError(next);
    } finally {
      setBusy(undefined);
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('settings.members.addTitle')}</DialogTitle>
          <DialogDescription>
            {t('settings.members.addDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className='flex flex-col gap-3'>
          {types.length > 1 && (
            <div
              role='group'
              aria-label={t('settings.members.type')}
              className='flex flex-wrap gap-1'
            >
              {types.map((item) => (
                <Button
                  key={item.type}
                  type='button'
                  size='sm'
                  variant={item.type === type ? 'secondary' : 'ghost'}
                  aria-pressed={item.type === type}
                  onClick={() => setType(item.type)}
                >
                  {text(item.title)}
                </Button>
              ))}
            </div>
          )}
          <Input
            type='search'
            autoFocus
            value={query}
            placeholder={t('settings.members.search')}
            aria-label={t('settings.members.search')}
            onChange={(event) => setQuery(event.target.value)}
          />
          <SettingsError error={error} />
          {!result || result.key !== key ? (
            error ? null : (
              <SettingsLoading />
            )
          ) : result.items.length === 0 ? (
            <p className='py-6 text-center text-sm text-muted-foreground'>
              {t('settings.members.noMatches')}
            </p>
          ) : (
            <ul className='max-h-80 divide-y overflow-y-auto rounded-lg border'>
              {result.items.map((option) => {
                const id = subjectKey({ type, id: option.id });
                const member = assigned.has(id) || added.has(id);
                return (
                  <li
                    key={option.id}
                    className='flex items-center justify-between gap-3 px-3 py-2'
                  >
                    <div className='min-w-0'>
                      <div className='truncate text-sm font-medium'>
                        {text(option.title)}
                      </div>
                      {option.description !== undefined && (
                        <div className='truncate text-xs text-muted-foreground'>
                          {text(option.description)}
                        </div>
                      )}
                    </div>
                    {member ? (
                      <span className='shrink-0 text-xs text-muted-foreground'>
                        {t('settings.members.alreadyMember')}
                      </span>
                    ) : (
                      <Button
                        type='button'
                        size='sm'
                        variant='outline'
                        disabled={busy !== undefined}
                        aria-label={t('settings.members.addMember', {
                          name: text(option.title),
                        })}
                        onClick={() => void add(option)}
                      >
                        {t('settings.members.addOne')}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {result &&
            result.key === key &&
            result.total > result.items.length && (
              <p className='text-xs text-muted-foreground'>
                {t('settings.members.more', {
                  shown: result.items.length,
                  total: result.total,
                })}
              </p>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
