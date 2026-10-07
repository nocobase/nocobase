import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import type { Executor } from '../../shared/issues.js';
import type { Member } from '../../shared/members.js';
import { cn } from 'cn';
import { PM_OTHER_KIND_CLASS } from './pm-tones.js';
import { Avatar, AvatarFallback } from './ui/avatar.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select.js';
import { PmKindIcon } from './pm-kind-icon.js';

/**
 * A principal of another registered kind the picker offers; `note` explains why it cannot be chosen (and disables it)
 * or describes its state.
 */
export interface ExecutorOption {
  /** Its kind's key (`shared/kinds.ts`). */
  readonly type: string;
  readonly id: string;
  readonly name: string;
  readonly note?: string;
  readonly disabled?: boolean;
}

export interface PmExecutorSelectProps {
  readonly id?: string;
  /** Null: nobody. */
  readonly value: Executor | null;
  readonly members: readonly Member[];
  /** Executors of other registered kinds, offered before the members. */
  readonly others?: readonly ExecutorOption[];
  /** The current executor's name when neither list has it. */
  readonly currentName?: string | null;
  readonly onChange: (executor: Executor | null) => void;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly 'aria-label'?: string;
}

const NONE = 'none';

function encode(executor: Executor | null): string {
  return executor ? `${executor.type}:${executor.id}` : NONE;
}

function decode(value: string): Executor | null {
  const separator = value.indexOf(':');
  if (value === NONE || separator < 0) return null;
  return {
    type: value.slice(0, separator),
    id: value.slice(separator + 1),
  };
}

const kindOf = (value: string) => value.slice(0, value.indexOf(':'));

/** Who executes an issue: nobody, a member, or a principal of another registered kind. */
export function PmExecutorSelect({
  id,
  value,
  members,
  others = [],
  currentName,
  onChange,
  disabled,
  className,
  'aria-label': ariaLabel,
}: PmExecutorSelectProps): ReactElement {
  const { t } = useTranslation();
  const selected = encode(value);
  const items: { value: string; label: string; option?: ExecutorOption }[] = [
    { value: NONE, label: t('executor.none') },
    ...others.map((option) => ({
      value: `${option.type}:${option.id}`,
      label: option.name,
      option,
    })),
    ...members.map((member) => ({
      value: `user:${member.userId}`,
      label: member.name,
    })),
  ];
  // A current executor neither list has (a disabled account, say) still shows by name.
  if (!items.some((item) => item.value === selected))
    items.push({
      value: selected,
      label: currentName ?? value?.id ?? selected,
    });
  const current = items.find((item) => item.value === selected);

  return (
    <Select
      items={items}
      value={selected}
      disabled={disabled}
      onValueChange={(next) => {
        if (next !== null && next !== selected) onChange(decode(next));
      }}
    >
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        title={selected === NONE ? undefined : current?.label}
        className={cn('w-full', className)}
      >
        <SelectValue className='min-w-0'>
          {(key: string) => {
            const item = items.find((entry) => entry.value === key);
            if (!item || key === NONE)
              return (
                <span className='text-muted-foreground'>
                  —<span className='sr-only'>{t('executor.none')}</span>
                </span>
              );
            const kind = kindOf(key);
            // A person's name stands alone; initials beside it say nothing more.
            if (kind === 'user')
              return <span className='truncate'>{item.label}</span>;
            return (
              <span className='inline-flex max-w-full min-w-0 items-center gap-1.5'>
                <Avatar
                  size='sm'
                  aria-hidden='true'
                  className={cn(
                    'size-4',
                    kind === 'system'
                      ? 'after:border-dashed after:border-muted-foreground/50'
                      : 'rounded-md after:rounded-md',
                  )}
                >
                  <AvatarFallback
                    className={
                      kind === 'system'
                        ? 'bg-transparent text-muted-foreground'
                        : `rounded-md ${PM_OTHER_KIND_CLASS}`
                    }
                  >
                    <PmKindIcon kind={kind} className='size-2.5' />
                  </AvatarFallback>
                </Avatar>
                <span className='truncate'>{item.label}</span>
              </span>
            );
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
        {items.map((item) => (
          <SelectItem
            key={item.value}
            value={item.value}
            disabled={item.option?.disabled === true && item.value !== selected}
            className='[&>span:first-child]:min-w-0 [&>span:first-child]:shrink'
          >
            {item.value === NONE ? (
              item.label
            ) : (
              <span className='flex min-w-0 items-center gap-2'>
                <ItemIcon kind={kindOf(item.value)} />
                <span className='min-w-0'>{item.label}</span>
                {item.option?.note ? (
                  <span className='shrink-0 text-xs text-muted-foreground'>
                    {item.option.note}
                  </span>
                ) : null}
              </span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ItemIcon({ kind }: { readonly kind: string }): ReactElement {
  return (
    <PmKindIcon
      kind={kind}
      className='size-3.5 text-muted-foreground'
      aria-hidden='true'
    />
  );
}
