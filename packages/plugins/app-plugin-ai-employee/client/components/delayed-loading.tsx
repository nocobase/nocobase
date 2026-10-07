import { useEffect, useState, type ReactElement } from 'react';
import { cn } from 'cn';

/**
 * A loading status that appears only once loading has taken noticeably long, so a fast response goes straight to its
 * content instead of flashing a placeholder first. It deliberately has no shape of its own, such as a table, that the
 * content might then replace.
 */
export function DelayedLoading({
  label,
  delay = 250,
  className,
}: {
  label: string;
  delay?: number;
  className?: string;
}): ReactElement | null {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  if (!visible) return null;
  return (
    <p
      role='status'
      className={cn(
        'py-10 text-center text-sm text-muted-foreground',
        className,
      )}
    >
      {label}
    </p>
  );
}
