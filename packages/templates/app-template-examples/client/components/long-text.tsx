import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from 'cn';

import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '#components/ui/popover';

// The last line fades out rather than ending in an ellipsis mid-sentence.
const FADE = '[mask-image:linear-gradient(to_bottom,black_55%,transparent)]';
// Cut at a height of whole lines rather than with line-clamp, which would add an ellipsis under the fade.
const CLAMP = 'overflow-hidden max-h-[calc(var(--long-text-lines)*1lh)]';

/**
 * Whether the element's content is taller than the lines it shows, measured again on every resize. The element comes
 * through a callback ref, so measuring follows it when it is replaced, as LongTextPreview's is once it overflows and
 * moves into the pop-up's trigger.
 */
function useOverflows(
  watch: unknown,
): [(element: HTMLDivElement | null) => void, boolean | undefined] {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  // Undefined until measured, so a remounted element does not first report that it fits.
  const [overflows, setOverflows] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    if (!element || typeof ResizeObserver === 'undefined') return;
    const measure = (): void =>
      setOverflows(element.scrollHeight > element.clientHeight + 1);
    // The observer reports once when it starts, then on every resize.
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, watch]);
  return [setElement, overflows];
}

export interface LongTextProps {
  /** The text, or rendered content such as Markdown. A string keeps its line breaks. */
  readonly children: ReactNode;
  /** How many lines show while folded. */
  readonly lines?: number;
  readonly className?: string;
}

/**
 * A long text where there is room for it, such as the description under a page's title or a comment: up to `lines`
 * lines, the last fading out while there is more, unfolding in place on a click and folding again on the next. It
 * reacts only when it overflows; a double-click or a text selection does not fold it, and Enter or Space works as a
 * click.
 */
export function LongText({
  children,
  lines = 5,
  className,
}: LongTextProps): ReactElement {
  const [open, setOpen] = useState(false);
  const [ref, measured] = useOverflows(open);
  const overflows = measured === true;
  const foldable = overflows || open;
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timerRef.current), []);
  const toggle = (): void => setOpen((current) => !current);
  return (
    <div
      ref={ref}
      role={foldable ? 'button' : undefined}
      tabIndex={foldable ? 0 : undefined}
      aria-expanded={foldable ? open : undefined}
      style={{ '--long-text-lines': lines } as CSSProperties}
      className={cn(
        'leading-relaxed break-words whitespace-pre-line',
        foldable && 'cursor-pointer',
        !open && CLAMP,
        !open && overflows && FADE,
        className,
      )}
      onClick={(event: MouseEvent<HTMLDivElement>) => {
        // A double-click selects a word rather than folding twice, and a selection is not a click.
        if (!foldable || event.detail > 1) return;
        if (!window.getSelection()?.isCollapsed) return;
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(toggle, 220);
      }}
      onDoubleClick={() => clearTimeout(timerRef.current)}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        if (!foldable || event.target !== event.currentTarget) return;
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        toggle();
      }}
    >
      {children}
    </div>
  );
}

export interface FadingTextProps {
  /** The text, or rendered content. A string keeps its line breaks. */
  readonly children: ReactNode;
  /** How many lines show. */
  readonly lines?: number;
  readonly className?: string;
  /** Told whether the text overflows, each time that changes. */
  readonly onOverflowChange?: (overflows: boolean) => void;
}

/**
 * The part both components are drawn with, for a consumer that opens the text its own way, such as a field editing it
 * in a pop-up: up to `lines` lines, the last fading out while there is more, and nothing that reacts to a click.
 */
export function FadingText({
  children,
  lines = 3,
  className,
  onOverflowChange,
}: FadingTextProps): ReactElement {
  const [ref, overflows] = useOverflows(children);
  useEffect(() => {
    if (overflows !== undefined) onOverflowChange?.(overflows);
  }, [overflows, onOverflowChange]);
  return (
    <div
      ref={ref}
      style={{ '--long-text-lines': lines } as CSSProperties}
      className={cn(
        'text-left leading-relaxed break-words whitespace-pre-line',
        CLAMP,
        overflows && FADE,
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface LongTextPreviewProps {
  /** The text, or rendered content. A string keeps its line breaks. */
  readonly children: ReactNode;
  /** What the text is, such as "Introduction": the heading of the pop-up that shows it whole. */
  readonly label: ReactNode;
  /** How many lines show in the column. */
  readonly lines?: number;
  readonly className?: string;
}

/**
 * A long text in a narrow column, such as a record's introduction or address beside its page: up to `lines` lines in
 * muted text, the last fading out while there is more, the whole text opening in a pop-up beside it on a click, so
 * the column never grows and pushes what is under it. It reacts only when it overflows.
 */
export function LongTextPreview({
  children,
  label,
  lines = 3,
  className,
}: LongTextPreviewProps): ReactElement {
  const [overflows, setOverflows] = useState(false);
  const preview = (
    <FadingText
      lines={lines}
      className={cn('text-muted-foreground', className)}
      onOverflowChange={setOverflows}
    >
      {children}
    </FadingText>
  );
  if (!overflows) return preview;
  return (
    <Popover>
      <PopoverTrigger className='block w-full cursor-pointer rounded-md text-left'>
        {preview}
      </PopoverTrigger>
      <PopoverContent
        align='start'
        side='left'
        className='max-h-[min(36rem,70vh)] w-[28rem] max-w-[calc(100vw-2rem)] overflow-y-auto'
      >
        <PopoverHeader>
          <PopoverTitle>{label}</PopoverTitle>
        </PopoverHeader>
        <div className='text-sm leading-relaxed break-words whitespace-pre-line'>
          {children}
        </div>
      </PopoverContent>
    </Popover>
  );
}
