import { useTranslation } from '@nocobase/i18n/client';
import { PlusIcon, XIcon } from 'lucide-react';
import { useEffect, useState, type ReactElement } from 'react';

import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog';
import { Input } from '#components/ui/input';
import { Label } from '#components/ui/label';
import type {
  AuthorizationOptionsResponse,
  SubjectOption,
} from '../authorization-client.js';
import { useAuthorizationClient } from '../use-authorization-client.js';
import type { DataRuleKind } from './data-rule-kinds.js';
import {
  subjectKey,
  useText,
  type RuleSubject,
} from './data-rule-subject-titles.js';
import { SettingsError, SettingsLoading } from './shared.js';

const PAGE_SIZE = 20;

/** Who a sharing or restriction rule applies to: chips, with a dialog that searches each subject directory. */
export function RuleSubjects({
  kind,
  catalog,
  value,
  titles,
  readOnly,
  error,
  onChange,
}: {
  readonly kind: DataRuleKind;
  readonly catalog: AuthorizationOptionsResponse;
  readonly value: readonly RuleSubject[];
  /** The subjects' display names, from `useSubjectTitles`. */
  readonly titles: ReadonlyMap<string, string>;
  readonly readOnly: boolean;
  readonly error?: string | undefined;
  readonly onChange: (value: readonly RuleSubject[]) => void;
}): ReactElement {
  const { t } = useTranslation();
  const text = useText();
  const [adding, setAdding] = useState(false);
  const typeTitle = (type: string): string => {
    const option = catalog.subjectTypes.find((item) => item.type === type);
    return option ? text(option.title) : type;
  };
  const chosen = new Set(value.map(subjectKey));

  return (
    <div className='flex flex-col gap-1.5'>
      <Label id={`${kind.key}-subjects`}>
        {t(`settings.${kind.texts}.subjects`)}
      </Label>
      <div
        role='list'
        aria-labelledby={`${kind.key}-subjects`}
        aria-invalid={error ? true : undefined}
        tabIndex={error ? -1 : undefined}
        className='flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border px-2 py-1.5 aria-invalid:border-destructive'
      >
        {value.map((subject) => (
          <Badge
            key={subjectKey(subject)}
            role='listitem'
            variant='secondary'
            className='gap-1'
          >
            <span className='text-muted-foreground'>
              {typeTitle(subject.type)}
            </span>
            {titles.get(subjectKey(subject)) ?? subject.id}
            {!readOnly && (
              <button
                type='button'
                className='rounded-sm opacity-70 hover:opacity-100'
                aria-label={t('settings.ruleSubjects.removeSubject', {
                  name: titles.get(subjectKey(subject)) ?? subject.id,
                })}
                onClick={() =>
                  onChange(
                    value.filter(
                      (item) => subjectKey(item) !== subjectKey(subject),
                    ),
                  )
                }
              >
                <XIcon className='size-3' />
              </button>
            )}
          </Badge>
        ))}
        {!readOnly && (
          <Button
            type='button'
            size='sm'
            variant='ghost'
            className='h-6 px-2'
            onClick={() => setAdding(true)}
          >
            <PlusIcon />
            {t('settings.ruleSubjects.addSubject')}
          </Button>
        )}
      </div>
      {error && <p className='text-sm text-destructive'>{error}</p>}
      {adding && (
        <AddSubjects
          path={kind.path}
          catalog={catalog}
          chosen={chosen}
          onAdd={(subject) => onChange([...value, subject])}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  );
}

function AddSubjects({
  path,
  catalog,
  chosen,
  onAdd,
  onClose,
}: {
  readonly path: string;
  readonly catalog: AuthorizationOptionsResponse;
  readonly chosen: ReadonlySet<string>;
  readonly onAdd: (subject: RuleSubject) => void;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const text = useText();
  const authz = useAuthorizationClient();
  const types = catalog.subjectTypes;
  const [type, setType] = useState(types[0]?.type ?? '');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{
    readonly key: string;
    readonly items: readonly SubjectOption[];
  }>();
  const [error, setError] = useState<unknown>();
  const option = types.find((item) => item.type === type);
  const fixed =
    option?.selection.type === 'fixed' ? option.selection : undefined;
  const search = query.trim();
  const key = `${type}\n${search}`;

  useEffect(() => {
    if (!type || fixed) return;
    let active = true;
    // Searching waits for a pause in typing, so each keystroke does not send a request.
    const timer = setTimeout(() => {
      authz
        .listSubjects(path, type, {
          ...(search ? { search } : {}),
          page: 1,
          pageSize: PAGE_SIZE,
        })
        .then(
          (page) => {
            if (!active) return;
            setError(undefined);
            setResult({ key, items: page.items });
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
  }, [authz, fixed, key, path, search, type]);

  const row = (subject: RuleSubject, title: string, description?: string) => {
    const added = chosen.has(subjectKey(subject));
    return (
      <li
        key={subjectKey(subject)}
        className='flex items-center justify-between gap-3 px-3 py-2'
      >
        <div className='min-w-0'>
          <div className='truncate text-sm font-medium'>{title}</div>
          {description && (
            <div className='truncate text-xs text-muted-foreground'>
              {description}
            </div>
          )}
        </div>
        <Button
          type='button'
          size='sm'
          variant='outline'
          disabled={added}
          aria-label={t('settings.ruleSubjects.addNamed', { name: title })}
          onClick={() => onAdd(subject)}
        >
          {added
            ? t('settings.ruleSubjects.added')
            : t('settings.ruleSubjects.add')}
        </Button>
      </li>
    );
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
          <DialogTitle>
            {t('settings.ruleSubjects.addSubjectTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('settings.ruleSubjects.addSubjectDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className='flex flex-col gap-3'>
          {types.length > 1 && (
            <div
              role='group'
              aria-label={t('settings.ruleSubjects.subjectType')}
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
          {fixed ? (
            <ul className='divide-y rounded-lg border'>
              {row({ type, id: fixed.id }, text(option?.title))}
            </ul>
          ) : (
            <>
              <Input
                type='search'
                autoFocus
                value={query}
                placeholder={t('settings.ruleSubjects.searchSubjects')}
                aria-label={t('settings.ruleSubjects.searchSubjects')}
                onChange={(event) => setQuery(event.target.value)}
              />
              <SettingsError error={error} />
              {!result || result.key !== key ? (
                error ? null : (
                  <SettingsLoading />
                )
              ) : result.items.length === 0 ? (
                <p className='py-6 text-center text-sm text-muted-foreground'>
                  {t('settings.ruleSubjects.noSubjects')}
                </p>
              ) : (
                <ul className='max-h-80 divide-y overflow-y-auto rounded-lg border'>
                  {result.items.map((item) =>
                    row(
                      { type, id: item.id },
                      text(item.title),
                      item.description === undefined
                        ? undefined
                        : text(item.description),
                    ),
                  )}
                </ul>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
