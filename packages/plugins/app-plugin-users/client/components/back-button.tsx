import { ArrowLeftIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from 'cn';

export interface BackButtonProps {
  /** An application-relative destination, already checked with `safeReturnTo`. */
  readonly to: string;
  readonly children: ReactNode;
  readonly className?: string;
}

/**
 * The way back to the page that sent the viewer here, such as a feature's prerequisites. A muted text link above the
 * heading that replaces the history entry, as the application's own back links do.
 */
export function BackButton({
  to,
  children,
  className,
}: BackButtonProps): ReactElement {
  return (
    <Link
      replace
      className={cn(
        'inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground',
        className,
      )}
      to={to}
    >
      <ArrowLeftIcon className='size-4' />
      {children}
    </Link>
  );
}
