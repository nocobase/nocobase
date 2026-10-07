import type { ReactElement } from 'react';

/** A small breathing dot for something at work right now. */
export function AgPulse(): ReactElement {
  return (
    <span className='relative inline-flex size-2' aria-hidden='true'>
      <span className='absolute inline-flex size-full animate-ping rounded-full bg-primary/60' />
      <span className='relative inline-flex size-2 rounded-full bg-primary' />
    </span>
  );
}
