import { SearchIcon } from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type Ref,
} from 'react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '#components/ui/input-group';

export interface DataTableSearchProps {
  /** The applied search, as the URL holds it. */
  readonly value: string;
  /** Applies a trimmed search, such as writing it to the URL and resetting the page. */
  readonly onSearch: (value: string) => void;
  /** The search box's accessible name, such as "Search repairs". */
  readonly label: string;
  /** Visible hint text; the `label` when omitted. */
  readonly placeholder?: string;
  /** How long typing pauses before the search applies; Enter applies at once. */
  readonly debounceMs?: number;
  /** The text field, such as for returning focus to the search after a row action. */
  readonly inputRef?: Ref<HTMLInputElement>;
}

/**
 * The list's search box for `DataTable`'s `search`: a magnifier inside the field, applied 300ms after typing pauses
 * and at once on Enter or when focus leaves the field (such as a click that opens a row, so the search lands on the
 * list before the row's route), never in the middle of an IME composition. It needs no separate search button (mobile.md
 * M4.1), and it follows the applied value when the URL changes elsewhere, such as Clear filters or browser back.
 */
export function DataTableSearch({
  value,
  onSearch,
  label,
  placeholder,
  debounceMs = 300,
  inputRef,
}: DataTableSearchProps): ReactElement {
  const [text, setText] = useState(value);
  const [seen, setSeen] = useState(value);
  const [composing, setComposing] = useState(false);
  // The last value this box applied: when the URL comes back with it, the typed text (with any trailing space) stays.
  const [sent, setSent] = useState(value);
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  });
  if (value !== seen) {
    setSeen(value);
    if (value !== sent) setText(value);
  }
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const apply = () => {
    clearTimeout(timerRef.current);
    if (composing || text.trim() === value) return;
    setSent(text.trim());
    onSearchRef.current(text.trim());
  };
  useEffect(() => {
    if (composing || text.trim() === value) return;
    const timer = setTimeout(() => {
      setSent(text.trim());
      onSearchRef.current(text.trim());
    }, debounceMs);
    timerRef.current = timer;
    return () => clearTimeout(timer);
    // `sent` re-arms the timer after an applied search the URL has not taken yet, such as one sent just as a row
    // opened; the list then holds it until it is current again.
  }, [text, value, composing, debounceMs, sent]);
  return (
    <InputGroup data-slot='data-table-search' className='min-w-0 flex-1'>
      <InputGroupAddon>
        <SearchIcon aria-hidden='true' />
      </InputGroupAddon>
      <InputGroupInput
        ref={inputRef}
        type='search'
        enterKeyHint='search'
        aria-label={label}
        placeholder={placeholder ?? label}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onCompositionStart={() => setComposing(true)}
        onCompositionEnd={(event) => {
          setComposing(false);
          setText(event.currentTarget.value);
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
          event.preventDefault();
          apply();
        }}
        onBlur={apply}
      />
    </InputGroup>
  );
}
