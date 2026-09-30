import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { useAIEmployeeClient } from '../../ai-employee-client.js';
import type {
  ConversationEmployee,
  ConversationUser,
} from '../../conversation-center-service.js';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '../../components/ui/combobox.js';
import { Field, FieldLabel } from '../../components/ui/field.js';
import { Input } from '../../components/ui/input.js';
import { useT } from '../../locales/index.js';
import { conversationEmployeeLabel, conversationUserLabel } from './display.js';

/** How long typing pauses before a search is sent. */
export const SEARCH_DEBOUNCE_MS = 300;

/** Chooses one user by searching the server as the reader types. */
export function ConversationUserFilter({
  userId,
  onChange,
}: {
  userId: string | undefined;
  onChange: (userId: string | undefined) => void;
}): ReactElement {
  const ai = useAIEmployeeClient();
  const t = useT();
  const id = useId();
  const [keyword, setKeyword] = useState('');
  const [options, setOptions] = useState<ConversationUser[]>([]);
  const [loading, setLoading] = useState(false);
  // The last user chosen or looked up, which is what gives the selection its label.
  const [known, setKnown] = useState<ConversationUser | null>(null);
  const knownId = known?.id;
  const selected: ConversationUser | null = userId
    ? known?.id === userId
      ? known
      : { id: userId, name: null, username: null }
    : null;

  // A restored URL names the user by id alone; look the label up once.
  useEffect(() => {
    if (!userId || knownId === userId) return;
    const controller = new AbortController();
    void ai.listConversationUsers({ userId, signal: controller.signal }).then(
      (rows) => {
        if (!controller.signal.aborted && rows[0]) setKnown(rows[0]);
      },
      // The id stands in for the label.
      () => undefined,
    );
    return () => controller.abort();
  }, [ai, userId, knownId]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(() => {
      void ai
        .listConversationUsers({
          keyword: keyword.trim(),
          signal: controller.signal,
        })
        .then(
          (rows) => {
            if (!controller.signal.aborted) setOptions(rows);
          },
          () => {
            if (!controller.signal.aborted) setOptions([]);
          },
        )
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [ai, keyword]);

  // The selected user stays choosable even when the current search leaves it out.
  const items =
    selected && !options.some((option) => option.id === selected.id)
      ? [selected, ...options]
      : options;

  return (
    <Field className='w-full sm:w-56'>
      <FieldLabel htmlFor={id}>{t('conversations.user')}</FieldLabel>
      <Combobox
        items={items}
        filter={null}
        value={selected}
        itemToStringLabel={conversationUserLabel}
        itemToStringValue={(user: ConversationUser) => user.id}
        isItemEqualToValue={(item: ConversationUser, value: ConversationUser) =>
          item.id === value.id
        }
        onInputValueChange={(value, details) => {
          if (details.reason === 'input-change') setKeyword(value);
        }}
        onOpenChange={(open) => {
          if (!open) setKeyword('');
        }}
        onValueChange={(user: ConversationUser | null) => {
          if (user) setKnown(user);
          onChange(user?.id);
        }}
      >
        <ComboboxInput
          id={id}
          placeholder={t('conversations.allUsers')}
          showClear={Boolean(selected)}
          className='w-full'
        />
        <ComboboxContent>
          <ComboboxEmpty>
            {loading
              ? t('conversations.searchingUsers')
              : t('conversations.noUsers')}
          </ComboboxEmpty>
          <ComboboxList>
            {(user: ConversationUser) => (
              <ComboboxItem key={user.id} value={user}>
                <span className='min-w-0 truncate'>
                  {conversationUserLabel(user)}
                </span>
                {user.username && user.username !== user.name ? (
                  <span className='ml-auto truncate text-xs text-muted-foreground'>
                    {user.username}
                  </span>
                ) : null}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}

/** Chooses one employee from the full employee list, filtered locally. */
export function ConversationEmployeeFilter({
  employees,
  username,
  onChange,
}: {
  employees: readonly ConversationEmployee[];
  username: string | undefined;
  onChange: (username: string | undefined) => void;
}): ReactElement {
  const t = useT();
  const id = useId();
  const selected = username
    ? (employees.find((employee) => employee.username === username) ?? {
        username,
        nickname: null,
        avatar: null,
      })
    : null;
  const items =
    selected && !employees.includes(selected)
      ? [selected, ...employees]
      : employees;
  return (
    <Field className='w-full sm:w-56'>
      <FieldLabel htmlFor={id}>{t('conversations.aiEmployee')}</FieldLabel>
      <Combobox
        items={items}
        value={selected}
        itemToStringLabel={conversationEmployeeLabel}
        itemToStringValue={(employee: ConversationEmployee) =>
          employee.username
        }
        isItemEqualToValue={(
          item: ConversationEmployee,
          value: ConversationEmployee,
        ) => item.username === value.username}
        onValueChange={(employee: ConversationEmployee | null) =>
          onChange(employee?.username)
        }
      >
        <ComboboxInput
          id={id}
          placeholder={t('conversations.allEmployees')}
          showClear={Boolean(selected)}
          className='w-full'
        />
        <ComboboxContent>
          <ComboboxEmpty>{t('conversations.noEmployees')}</ComboboxEmpty>
          <ComboboxList>
            {(employee: ConversationEmployee) => (
              <ComboboxItem key={employee.username} value={employee}>
                <span className='min-w-0 truncate'>
                  {conversationEmployeeLabel(employee)}
                </span>
                {employee.nickname ? (
                  <span
                    translate='no'
                    className='ml-auto truncate font-mono text-xs text-muted-foreground'
                  >
                    {employee.username}
                  </span>
                ) : null}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}

/** A title search that reports its value once typing pauses, and follows the URL when it changes elsewhere. */
export function ConversationTitleFilter({
  title,
  onChange,
}: {
  title: string;
  onChange: (title: string) => void;
}): ReactElement {
  const t = useT();
  const id = useId();
  const [value, setValue] = useState(title);
  const committedRef = useRef(title);
  const onChangeRef = useRef(onChange);
  useLayoutEffect(() => {
    onChangeRef.current = onChange;
  });

  // Back and forward change the URL without typing; show what it now says.
  useEffect(() => {
    if (title !== committedRef.current) {
      committedRef.current = title;
      setValue(title);
    }
  }, [title]);

  useEffect(() => {
    const next = value.trim();
    if (next === committedRef.current) return;
    const timer = setTimeout(() => {
      committedRef.current = next;
      onChangeRef.current(next);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <Field className='w-full sm:w-72'>
      <FieldLabel htmlFor={id}>{t('conversations.titleLabel')}</FieldLabel>
      <Input
        id={id}
        type='search'
        placeholder={t('conversations.searchTitle')}
        value={value}
        maxLength={200}
        onChange={(event) => setValue(event.target.value)}
      />
    </Field>
  );
}
