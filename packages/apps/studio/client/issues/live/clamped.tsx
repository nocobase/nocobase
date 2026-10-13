/** Long text cut to a few lines, with "Show more" / "Show less" once it is taller than that. */
import { useTranslation } from '@nocobase/i18n/client';
import {
  useCallback,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import { cn } from 'cn';

export function Clamped({
  children,
  className,
  clampClassName = 'max-h-18 overflow-hidden',
}: {
  readonly children: ReactNode;
  readonly className?: string;
  /** How far it is cut while folded: a height by default, or lines such as `line-clamp-2`. */
  readonly clampClassName?: string;
}): ReactElement {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  // Measured while cut, and again whenever its size changes.
  const ref = useCallback(
    (element: HTMLDivElement | null) => {
      if (!element || expanded) return;
      const measure = (): void =>
        setOverflows(element.scrollHeight > element.clientHeight + 1);
      measure();
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(measure);
      observer.observe(element);
      return () => observer.disconnect();
    },
    [expanded],
  );
  return (
    <div className={className} data-slot='clamped'>
      <div
        ref={ref}
        className={cn(!expanded && clampClassName)}
        data-clamped={!expanded && overflows ? '' : undefined}
      >
        {children}
      </div>
      {overflows || expanded ? (
        <button
          type='button'
          className='mt-1 text-xs text-primary hover:underline'
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? t('issueLive.feed.less') : t('issueLive.feed.more')}
        </button>
      ) : null}
    </div>
  );
}
