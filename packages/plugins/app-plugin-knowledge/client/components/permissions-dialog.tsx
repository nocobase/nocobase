/**
 * Who may access a folder, an article or a file: the viewer's own access and where it comes from at the top, then, for
 * whoever manages it (`docs/permissions.md`), shaped like Notion's Share and Feishu's 权限设置: whether it inherits its parent's access or keeps only its own entries, what it inherits
 * from where, its entries with a level each (or Remove), and a search to add people, roles and whatever else the
 * application offers, grouped by type. Switching to "Only people listed" starts from the inherited entries, so nobody
 * loses access by surprise. Saving replaces the mode and the entries at once.
 */
import { useTranslation } from '@nocobase/i18n/client';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  BotIcon,
  Building2Icon,
  LockIcon,
  ShieldIcon,
  UserIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState, type ReactElement } from 'react';

import { EntryAccess } from './access-sheet.js';
import { Button } from './ui/button.js';
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from './ui/combobox.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.js';
import { Label } from './ui/label.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './ui/select.js';
import { Skeleton } from './ui/skeleton.js';
import { Spinner } from './ui/spinner.js';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import {
  KNOWLEDGE_GRANT_LEVELS,
  levelRank,
  type KnowledgeAccessMode,
  type KnowledgeDocSummary,
  type KnowledgeGrantLevel,
  type KnowledgePermissionEntry,
  type KnowledgePermissions,
  type KnowledgeSubject,
  type KnowledgeSubjectIcon,
  type KnowledgeSubjectType,
  type SpaceRef,
} from '../../shared/knowledge.js';
import {
  knowledgeKeys,
  useKnowledgeApi,
  useKnowledgePermissions,
} from '../api.js';
import { useNotify } from '../hooks/use-notify.js';
import { textOf } from '../lib/text.js';

const ICONS: Readonly<Record<KnowledgeSubjectIcon, LucideIcon>> = {
  user: UserIcon,
  group: UsersIcon,
  role: ShieldIcon,
  agent: BotIcon,
  organization: Building2Icon,
};

/** A subject's icon, by its type's. */
export function SubjectIcon({
  subject,
  types,
}: {
  readonly subject: { readonly type: string };
  readonly types: readonly KnowledgeSubjectType[];
}): ReactElement {
  const icon = types.find((type) => type.type === subject.type)?.icon ?? 'user';
  const Icon = ICONS[icon];
  return (
    <span
      aria-hidden='true'
      className='flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground'
    >
      <Icon className='size-4' />
    </span>
  );
}

const keyOf = (subject: { readonly type: string; readonly id: string }) =>
  `${subject.type}:${subject.id}`;

/** The inherited entries, the highest level per subject: where "Only people listed" starts. */
function inheritedEntries(
  permissions: KnowledgePermissions,
): KnowledgePermissionEntry[] {
  const best = new Map<string, KnowledgePermissionEntry>();
  for (const grant of permissions.inherited)
    for (const entry of grant.entries) {
      const known = best.get(keyOf(entry.subject));
      if (!known || levelRank(entry.level) > levelRank(known.level))
        best.set(keyOf(entry.subject), entry);
    }
  return [...best.values()];
}

function SubjectLine({
  subject,
  types,
}: {
  readonly subject: KnowledgeSubject;
  readonly types: readonly KnowledgeSubjectType[];
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return (
    <span className='flex min-w-0 flex-1 items-center gap-2'>
      <SubjectIcon subject={subject} types={types} />
      <span className='min-w-0'>
        <span className='block truncate text-sm'>
          {subject.known === false
            ? t('knowledge.permissions.removedSubject', { id: subject.id })
            : textOf(t, subject.label)}
        </span>
        {subject.hint ? (
          <span className='block truncate text-xs text-muted-foreground'>
            {textOf(t, subject.hint)}
          </span>
        ) : null}
      </span>
    </span>
  );
}

const REMOVE = '__remove';

function LevelSelect({
  level,
  onChange,
  onRemove,
  label,
}: {
  readonly level: KnowledgeGrantLevel;
  readonly onChange: (level: KnowledgeGrantLevel) => void;
  readonly onRemove: () => void;
  readonly label: string;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const items = [
    ...KNOWLEDGE_GRANT_LEVELS.map((value) => ({
      value,
      label: t(`knowledge.permissions.levels.${value}`),
    })),
    { value: REMOVE, label: t('knowledge.permissions.remove') },
  ];
  return (
    <Select
      items={items}
      value={level}
      onValueChange={(next: string | null) => {
        if (next === REMOVE) onRemove();
        else if (next) onChange(next as KnowledgeGrantLevel);
      }}
    >
      <SelectTrigger aria-label={label} className='shrink-0'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        align='end'
        className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'
      >
        {KNOWLEDGE_GRANT_LEVELS.map((value) => (
          <SelectItem key={value} value={value}>
            {t(`knowledge.permissions.levels.${value}`)}
          </SelectItem>
        ))}
        <SelectSeparator />
        <SelectItem value={REMOVE} className='text-destructive'>
          {t('knowledge.permissions.remove')}
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

interface SubjectGroup {
  readonly value: string;
  readonly label: string;
  readonly items: KnowledgeSubject[];
}

/**
 * The one input that adds a subject: its candidates, grouped by type, open in a popup while it has focus or is typed
 * in, and are searched only then.
 */
function AddSubject({
  space,
  types,
  taken,
  onAdd,
}: {
  readonly space: SpaceRef;
  readonly types: readonly KnowledgeSubjectType[];
  readonly taken: ReadonlySet<string>;
  readonly onAdd: (subject: KnowledgeSubject) => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = useKnowledgeApi();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(text.trim()), 200);
    return () => window.clearTimeout(timer);
  }, [text]);
  const found = useQuery({
    queryKey: knowledgeKeys.subjects(space, query),
    queryFn: ({ signal }) => api.subjects(space, query, signal),
    placeholderData: keepPreviousData,
    enabled: open,
  });
  const offered = (found.data?.subjects ?? []).filter(
    (subject) => !taken.has(keyOf(subject)),
  );
  const groups: SubjectGroup[] = types
    .map((type) => ({
      value: type.type,
      label: textOf(t, type.title),
      items: offered.filter((subject) => subject.type === type.type),
    }))
    .filter((group) => group.items.length > 0);
  return (
    <Combobox<KnowledgeSubject>
      items={groups}
      filter={null}
      value={null}
      open={open}
      onOpenChange={setOpen}
      inputValue={text}
      onInputValueChange={(next, details) => {
        if (details.reason !== 'item-press') setText(next);
      }}
      itemToStringLabel={(subject) => textOf(t, subject.label)}
      isItemEqualToValue={(a, b) => keyOf(a) === keyOf(b)}
      onValueChange={(subject) => {
        if (!subject) return;
        onAdd(subject);
        setText('');
      }}
    >
      <ComboboxInput
        className='w-full min-w-0'
        showTrigger={false}
        placeholder={t('knowledge.permissions.addPlaceholder')}
        aria-label={t('knowledge.permissions.add')}
        onFocus={() => setOpen(true)}
      />
      <ComboboxContent className='min-w-(--anchor-width)'>
        <ComboboxEmpty>
          {found.isPending ? (
            <Spinner className='mx-auto' />
          ) : (
            t('knowledge.permissions.noMatches')
          )}
        </ComboboxEmpty>
        <ComboboxList>
          {(group: SubjectGroup) => (
            <ComboboxGroup key={group.value} items={group.items}>
              <ComboboxLabel>{group.label}</ComboboxLabel>
              <ComboboxCollection>
                {(subject: KnowledgeSubject) => (
                  <ComboboxItem key={keyOf(subject)} value={subject}>
                    <SubjectLine subject={subject} types={types} />
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function PermissionsForm({
  doc,
  space,
  spaceLabel,
  permissions,
  onDone,
}: {
  readonly doc: KnowledgeDocSummary;
  readonly space: SpaceRef;
  readonly spaceLabel: string;
  readonly permissions: KnowledgePermissions;
  readonly onDone: () => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = useKnowledgeApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<KnowledgeAccessMode>(permissions.mode);
  const [entries, setEntries] = useState<KnowledgePermissionEntry[]>([
    ...permissions.entries,
  ]);
  const types = permissions.types;
  const save = useMutation({
    mutationFn: () =>
      api.replacePermissions(doc.id, {
        mode,
        entries: entries.map((entry) => ({
          subject: { type: entry.subject.type, id: entry.subject.id },
          level: entry.level,
        })),
      }),
    onSuccess: () => {
      notify.success(t('knowledge.permissions.saved'));
      void queryClient.invalidateQueries({ queryKey: knowledgeKeys.all });
      onDone();
    },
    onError: (error) => notify.error(error),
  });
  const modes = [
    { value: 'inherit', label: t('knowledge.permissions.modes.inherit') },
    { value: 'custom', label: t('knowledge.permissions.modes.custom') },
  ];
  const changeMode = (next: KnowledgeAccessMode) => {
    // Restricting starts from who has access now, so nobody listed loses it by surprise.
    if (next === 'custom' && mode === 'inherit') {
      const own = new Set(entries.map((entry) => keyOf(entry.subject)));
      setEntries([
        ...entries,
        ...inheritedEntries(permissions).filter(
          (entry) => !own.has(keyOf(entry.subject)),
        ),
      ]);
    }
    setMode(next);
  };
  const taken = new Set(entries.map((entry) => keyOf(entry.subject)));
  const update = (index: number, level: KnowledgeGrantLevel | null) =>
    setEntries(
      level === null
        ? entries.filter((_, at) => at !== index)
        : entries.map((entry, at) =>
            at === index ? { ...entry, level } : entry,
          ),
    );

  return (
    <>
      <div className='-mx-4 min-h-0 min-w-0 flex-1 space-y-5 overflow-y-auto px-4'>
        <EntryAccess doc={doc} spaceLabel={spaceLabel} />
        <div className='min-w-0 space-y-2'>
          <Label htmlFor='knowledge-permissions-mode'>
            {t('knowledge.permissions.modeLabel')}
          </Label>
          <Select
            items={modes}
            value={mode}
            onValueChange={(next: string | null) =>
              next && changeMode(next as KnowledgeAccessMode)
            }
          >
            <SelectTrigger id='knowledge-permissions-mode' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
              {modes.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className='text-sm text-muted-foreground'>
            {mode === 'inherit'
              ? t('knowledge.permissions.inheritHint')
              : t('knowledge.permissions.customHint')}
          </p>
        </div>
        {mode === 'inherit' && permissions.inherited.length > 0 ? (
          <section
            className='min-w-0 space-y-2'
            data-testid='knowledge-inherited'
          >
            <h3 className='text-sm font-medium'>
              {t('knowledge.permissions.inherited')}
            </h3>
            <ul className='divide-y rounded-lg border'>
              {permissions.inherited.map((grant) => (
                <li
                  key={grant.from.kind === 'doc' ? grant.from.id : 'space'}
                  className='min-w-0 space-y-1 px-3 py-2 text-sm'
                >
                  <p className='flex min-w-0 items-center gap-1.5 font-medium'>
                    {grant.from.kind === 'doc' &&
                    grant.from.mode === 'custom' ? (
                      <LockIcon
                        className='size-3.5 shrink-0 text-muted-foreground'
                        aria-hidden='true'
                      />
                    ) : null}
                    <span className='min-w-0 truncate'>
                      {grant.from.kind === 'space'
                        ? t('knowledge.permissions.fromSpace', {
                            space: spaceLabel,
                          })
                        : t(
                            grant.from.mode === 'custom'
                              ? 'knowledge.permissions.fromRestricted'
                              : 'knowledge.permissions.fromDoc',
                            { title: grant.from.title },
                          )}
                    </span>
                  </p>
                  {grant.entries.map((entry) => (
                    <p
                      key={keyOf(entry.subject)}
                      className='break-words text-muted-foreground'
                    >
                      {entry.subject.known === false
                        ? t('knowledge.permissions.removedSubject', {
                            id: entry.subject.id,
                          })
                        : textOf(t, entry.subject.label)}
                      {' · '}
                      {t(`knowledge.permissions.levels.${entry.level}`)}
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <section className='min-w-0 space-y-2'>
          <h3 className='text-sm font-medium'>
            {mode === 'inherit'
              ? t('knowledge.permissions.added')
              : t('knowledge.permissions.listed')}
          </h3>
          <AddSubject
            space={space}
            types={types}
            taken={taken}
            onAdd={(subject) =>
              setEntries([...entries, { subject, level: 'read' }])
            }
          />
          {entries.length > 0 ? (
            <ul
              className='divide-y rounded-lg border'
              data-testid='knowledge-entries'
            >
              {entries.map((entry, index) => (
                <li
                  key={keyOf(entry.subject)}
                  className='flex min-w-0 items-center gap-3 px-3 py-2'
                >
                  <SubjectLine subject={entry.subject} types={types} />
                  <LevelSelect
                    level={entry.level}
                    label={t('knowledge.permissions.levelOf', {
                      subject: textOf(t, entry.subject.label),
                    })}
                    onChange={(level) => update(index, level)}
                    onRemove={() => update(index, null)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className='text-sm text-muted-foreground'>
              {mode === 'inherit'
                ? t('knowledge.permissions.noneAdded')
                : t('knowledge.permissions.noneListed')}
            </p>
          )}
          <p className='text-xs text-muted-foreground'>
            {t('knowledge.permissions.managers')}
          </p>
        </section>
      </div>
      <DialogFooter>
        <Button variant='outline' onClick={onDone}>
          {t('knowledge.editor.cancel')}
        </Button>
        <Button disabled={save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? <Spinner data-icon='inline-start' /> : null}
          {t('knowledge.permissions.save')}
        </Button>
      </DialogFooter>
    </>
  );
}

export function PermissionsDialog({
  open,
  onOpenChange,
  doc,
  space,
  spaceLabel,
  editable = doc.access.manage,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly doc: KnowledgeDocSummary;
  /** The space it is in, where subjects are searched. */
  readonly space: SpaceRef;
  readonly spaceLabel: string;
  /** Whether its entries are changed here: for someone who manages it, in the space it belongs to. */
  readonly editable?: boolean;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const permissions = useKnowledgePermissions(open && editable ? doc.id : null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-2xl'
        data-testid='knowledge-permissions'
      >
        <DialogHeader className='min-w-0 pr-6'>
          <DialogTitle className='leading-snug break-words'>
            {t('knowledge.permissions.title', { title: doc.title })}
          </DialogTitle>
          <DialogDescription>
            {t(`knowledge.permissions.description.${doc.kind}`)}
          </DialogDescription>
        </DialogHeader>
        {!editable ? (
          <>
            <div className='-mx-4 min-h-0 min-w-0 flex-1 overflow-y-auto px-4'>
              <EntryAccess doc={doc} spaceLabel={spaceLabel} />
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => onOpenChange(false)}>
                {t('knowledge.permissions.close')}
              </Button>
            </DialogFooter>
          </>
        ) : permissions.data ? (
          <PermissionsForm
            key={doc.id}
            doc={doc}
            space={space}
            spaceLabel={spaceLabel}
            permissions={permissions.data}
            onDone={() => onOpenChange(false)}
          />
        ) : (
          <div className='-mx-4 min-h-0 min-w-0 flex-1 space-y-5 overflow-y-auto px-4'>
            <EntryAccess doc={doc} spaceLabel={spaceLabel} />
            {permissions.isError ? (
              <p className='text-sm text-muted-foreground'>
                {t('knowledge.permissions.loadFailed')}
              </p>
            ) : (
              <div className='space-y-2'>
                <Skeleton className='h-9 w-full' />
                <Skeleton className='h-24 w-full' />
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
