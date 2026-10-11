/**
 * Choosing people from the projects plugin's members, the list the rest of Studio's pages use: `MembersPicker` for
 * several (chips, such as an environment's approvers), `MemberPicker` for one (such as who takes an issue over). Both
 * search by name and email and hold user ids; an id that is not a member keeps showing as it is.
 */
import { pmKeys, usePmApi } from '@nocobase/app-plugin-projects/client/kit';
import { APP_NS, useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { useMemo, type ReactElement } from 'react';

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';

interface Directory {
  readonly ids: readonly string[];
  readonly nameOf: (userId: string) => string;
  readonly emailOf: (userId: string) => string | null;
  readonly loading: boolean;
}

function useDirectory(extra: readonly string[]): Directory {
  const api = usePmApi();
  const members = useQuery({
    queryKey: pmKeys.members,
    queryFn: () => api.members(),
    staleTime: 60_000,
  });
  return useMemo(() => {
    const byId = new Map(
      (members.data ?? []).map((member) => [member.userId, member]),
    );
    const ids = [
      ...byId.keys(),
      ...extra.filter((userId) => !byId.has(userId)),
    ];
    return {
      ids,
      nameOf: (userId) => byId.get(userId)?.name ?? userId,
      emailOf: (userId) => byId.get(userId)?.email ?? null,
      loading: members.isPending,
    };
  }, [members.data, members.isPending, extra]);
}

function MemberItem({
  userId,
  directory,
}: {
  readonly userId: string;
  readonly directory: Directory;
}): ReactElement {
  const email = directory.emailOf(userId);
  return (
    <ComboboxItem value={userId}>
      <span className='flex min-w-0 items-center gap-2'>
        <span className='truncate'>{directory.nameOf(userId)}</span>
        {email ? (
          <span className='truncate text-xs text-muted-foreground'>
            {email}
          </span>
        ) : null}
      </span>
    </ComboboxItem>
  );
}

export interface MembersPickerProps {
  readonly value: readonly string[];
  readonly onChange: (userIds: string[]) => void;
  readonly id?: string;
  readonly disabled?: boolean;
  readonly placeholder?: string;
}

/** Several members, as chips with a search input. */
export function MembersPicker({
  value,
  onChange,
  id,
  disabled,
  placeholder,
}: MembersPickerProps): ReactElement {
  // Studio's own words, also inside a plugin's page (whose namespace is the default there).
  const { t } = useTranslation(APP_NS);
  const directory = useDirectory(value);
  const anchor = useComboboxAnchor();
  return (
    <Combobox
      multiple
      autoHighlight
      items={directory.ids as string[]}
      value={value as string[]}
      itemToStringLabel={(userId: string) =>
        `${directory.nameOf(userId)} ${directory.emailOf(userId) ?? ''}`
      }
      disabled={disabled}
      onValueChange={(next: string[]) => onChange(next)}
    >
      <ComboboxChips ref={anchor}>
        <ComboboxValue>
          {value.map((userId) => (
            <ComboboxChip key={userId}>{directory.nameOf(userId)}</ComboboxChip>
          ))}
        </ComboboxValue>
        <ComboboxChipsInput
          id={id}
          placeholder={value.length === 0 ? placeholder : undefined}
        />
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>
          {directory.loading ? t('common.loading') : t('memberPicker.empty')}
        </ComboboxEmpty>
        <ComboboxList>
          {(userId: string) => (
            <MemberItem key={userId} userId={userId} directory={directory} />
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

export interface MemberPickerProps {
  readonly value: string | null;
  readonly onChange: (userId: string | null) => void;
  readonly id?: string;
  readonly disabled?: boolean;
  readonly placeholder?: string;
  /** Members not to offer, such as nobody's current choice. */
  readonly exclude?: readonly string[];
}

/** One member, typed to search. */
export function MemberPicker({
  value,
  onChange,
  id,
  disabled,
  placeholder,
  exclude = [],
}: MemberPickerProps): ReactElement {
  // Studio's own words, also inside a plugin's page (whose namespace is the default there).
  const { t } = useTranslation(APP_NS);
  const directory = useDirectory(value ? [value] : []);
  const ids = directory.ids.filter((userId) => !exclude.includes(userId));
  return (
    <Combobox
      autoHighlight
      items={ids}
      value={value}
      itemToStringLabel={(userId: string) => directory.nameOf(userId)}
      disabled={disabled}
      onValueChange={(next: string | null) => onChange(next)}
    >
      <ComboboxInput id={id} placeholder={placeholder} showClear />
      <ComboboxContent>
        <ComboboxEmpty>
          {directory.loading ? t('common.loading') : t('memberPicker.empty')}
        </ComboboxEmpty>
        <ComboboxList>
          {(userId: string) => (
            <MemberItem key={userId} userId={userId} directory={directory} />
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
