/**
 * The permissions of an API key, chosen group by group: a preset to start from ("CI deploy", "Read only"), then each
 * permission group at none, read, write or admin, and, where a group offers it, limited to some records. A level the
 * person choosing does not hold is greyed out: a key never holds more than whoever gives it (the server checks again).
 * Serves a person's own keys and the organization's alike.
 */
import type {
  KeyScopeGroupView,
  KeyScopeOptions,
  KeyScopeObject,
} from '@nocobase/app-plugin-api-keys/shared/scopes';
import { PmMultiSelect } from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { type ReactElement, useState } from 'react';

import { Field, FieldLabel } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  applyPreset,
  localized,
  type GroupDraft,
  type KeyDraft,
} from './key-scope-model.js';

const CATEGORIES = ['business', 'administration', 'account'] as const;

/** One permission group: its level, and the records it reaches when it may be limited to some. */
function GroupRow({
  group,
  value,
  objects,
  onChange,
}: {
  readonly group: KeyScopeGroupView;
  readonly value: GroupDraft;
  readonly objects: (group: string) => Promise<KeyScopeObject[]>;
  readonly onChange: (next: GroupDraft) => void;
}): ReactElement {
  const { t } = useTranslation();
  const title = localized(t, group.title);
  const items = [
    { value: 'none', label: t('keys.levels.none'), disabled: false },
    ...group.levels.map((level) => ({
      value: level,
      label: `${t(`keys.levels.${level}`)}${group.held[level] === false ? ` · ${t('keys.notHeld')}` : ''}`,
      disabled: group.held[level] === false,
    })),
  ];
  const pickedIds: readonly string[] =
    value.objects === 'all' ? [] : value.objects;
  const picking = value.level !== 'none' && value.objects !== 'all';
  const records = useQuery({
    queryKey: ['studio', 'keys', 'objects', group.id],
    queryFn: () => objects(group.id),
    enabled: Boolean(group.objects) && picking,
  });
  const notHeld = value.level !== 'none' && group.held[value.level] === false;
  return (
    <div className='flex flex-col gap-2 py-3' data-group={group.id}>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4'>
        <div className='min-w-0 flex-1'>
          <div className='text-sm font-medium'>{title}</div>
          {group.description ? (
            <div className='text-xs text-muted-foreground'>
              {localized(t, group.description)}
            </div>
          ) : null}
          {notHeld ? (
            <div className='text-xs text-amber-600 dark:text-amber-500'>
              {t('keys.notHeldHint')}
            </div>
          ) : null}
        </div>
        <Select
          items={items}
          value={value.level}
          onValueChange={(next: string | null) => {
            if (!next) return;
            onChange({
              level: next as GroupDraft['level'],
              objects: value.objects,
            });
          }}
        >
          <SelectTrigger
            size='sm'
            className='w-full shrink-0 sm:w-44'
            aria-label={t('keys.levelFor', { name: title })}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            align='end'
            alignItemWithTrigger={false}
            className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'
          >
            {items.map((item) => (
              <SelectItem
                key={item.value}
                value={item.value}
                disabled={item.disabled}
              >
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {group.objects && value.level !== 'none' ? (
        <div className='flex flex-col gap-2 pl-1'>
          <RadioGroup
            className='flex flex-wrap gap-4'
            value={value.objects === 'all' ? 'all' : 'pick'}
            aria-label={t('keys.objectsFor', { name: title })}
            onValueChange={(next) =>
              onChange({
                level: value.level,
                objects: next === 'all' ? 'all' : [],
              })
            }
          >
            <label className='flex items-center gap-2 text-sm'>
              <RadioGroupItem value='all' />
              {t('keys.objects.all', {
                name: localized(t, group.objects.title),
              })}
            </label>
            <label className='flex items-center gap-2 text-sm'>
              <RadioGroupItem value='pick' />
              {t('keys.objects.pick')}
            </label>
          </RadioGroup>
          {picking ? (
            <PmMultiSelect
              aria-label={t('keys.objects.choose', {
                name: localized(t, group.objects.title),
              })}
              options={(records.data ?? []).map((record) => ({
                value: record.id,
                label: record.title,
              }))}
              value={[...pickedIds]}
              placeholder={t('keys.objects.placeholder', {
                name: localized(t, group.objects.title),
              })}
              emptyText={t('keys.objects.empty')}
              onChange={(ids) => onChange({ level: value.level, objects: ids })}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** A preset to start from, then every group by category. Changes the draft's groups (and, with a preset, its expiry). */
export function ScopeEditor({
  options,
  draft,
  objects,
  onChange,
}: {
  readonly options: KeyScopeOptions;
  readonly draft: KeyDraft;
  readonly objects: (group: string) => Promise<KeyScopeObject[]>;
  readonly onChange: (next: KeyDraft) => void;
}): ReactElement {
  const { t } = useTranslation();
  const [preset, setPreset] = useState<string>('');
  const presetItems = [
    { value: '', label: t('keys.presets.none') },
    ...options.presets.map((item) => ({
      value: item.id,
      label: localized(t, item.title),
    })),
  ];
  const selectedPreset = options.presets.find((item) => item.id === preset);
  return (
    <div className='space-y-4'>
      {options.presets.length > 0 ? (
        <Field>
          <FieldLabel>{t('keys.presets.label')}</FieldLabel>
          <Select
            items={presetItems}
            value={preset}
            onValueChange={(next: string | null) => {
              const chosen = options.presets.find((item) => item.id === next);
              setPreset(next ?? '');
              onChange(
                chosen
                  ? applyPreset(draft, chosen, options)
                  : { ...draft, groups: {} },
              );
            }}
          >
            <SelectTrigger
              className='w-full sm:w-64'
              aria-label={t('keys.presets.label')}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
              {presetItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPreset?.description ? (
            <div className='text-xs text-muted-foreground'>
              {localized(t, selectedPreset.description)}
            </div>
          ) : null}
        </Field>
      ) : null}
      {CATEGORIES.map((category) => {
        const groups = options.groups.filter(
          (group) => group.category === category,
        );
        if (groups.length === 0) return null;
        return (
          <section key={category} className='rounded-md border px-4'>
            <h3 className='pt-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase'>
              {t(`keys.categories.${category}`)}
            </h3>
            <div className='divide-y'>
              {groups.map((group) => (
                <GroupRow
                  key={group.id}
                  group={group}
                  objects={objects}
                  value={
                    draft.groups[group.id] ?? { level: 'none', objects: 'all' }
                  }
                  onChange={(next) =>
                    onChange({
                      ...draft,
                      groups: { ...draft.groups, [group.id]: next },
                    })
                  }
                />
              ))}
            </div>
          </section>
        );
      })}
      <p className='text-xs text-muted-foreground'>{t('keys.scopeNote')}</p>
    </div>
  );
}
