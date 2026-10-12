/**
 * Searches issues through `onSearch` (300 ms after typing stops) and reports the one picked; issues in `exclude` are
 * left out. The input clears after a pick.
 */
import { useEffect, useState, type ReactElement } from 'react';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';

export interface IssuePickerItem {
  readonly id: string;
  readonly identifier: string;
  readonly title: string;
}

export function IssuePicker({
  id,
  exclude,
  disabled,
  placeholder,
  emptyText,
  autoFocus,
  onSearch,
  onPick,
  'aria-label': ariaLabel,
}: {
  readonly id?: string;
  readonly exclude?: ReadonlySet<string>;
  readonly disabled?: boolean;
  readonly placeholder?: string;
  readonly emptyText?: string;
  readonly autoFocus?: boolean;
  /** Issues matching the text (any, for an empty text). */
  readonly onSearch: (query: string) => Promise<readonly IssuePickerItem[]>;
  readonly onPick: (issue: IssuePickerItem) => void;
  readonly 'aria-label'?: string;
}): ReactElement {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<readonly IssuePickerItem[]>([]);
  useEffect(() => {
    let alive = true;
    const timer = window.setTimeout(() => {
      void onSearch(input.trim()).then(
        (found) => {
          if (alive) setResults(found);
        },
        () => {
          if (alive) setResults([]);
        },
      );
    }, 300);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [input, onSearch]);
  const items = results.filter((issue) => !exclude?.has(issue.id));

  return (
    <Combobox
      items={items}
      value={null}
      disabled={disabled}
      inputValue={input}
      // The consumer already matched the text; filtering again by label would hide identifier matches.
      filter={null}
      itemToStringLabel={(issue: IssuePickerItem) =>
        `${issue.identifier} ${issue.title}`
      }
      onInputValueChange={(value) => setInput(value)}
      onValueChange={(issue: IssuePickerItem | null) => {
        if (!issue) return;
        onPick(issue);
        setInput('');
      }}
    >
      <ComboboxInput
        id={id}
        className='w-full'
        aria-label={ariaLabel}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
      />
      <ComboboxContent>
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(issue: IssuePickerItem) => (
            <ComboboxItem key={issue.id} value={issue}>
              <span className='shrink-0 font-mono text-xs text-muted-foreground'>
                {issue.identifier}
              </span>
              <span className='truncate'>{issue.title}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
