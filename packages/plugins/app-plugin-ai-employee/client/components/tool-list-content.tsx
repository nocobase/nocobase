import type { ReactElement, ReactNode } from 'react';
import { ToolAboutSummary } from './tool-about-summary.js';

export function ToolListContent({
  name,
  title,
  about,
  status,
}: {
  name: string;
  title?: string;
  about?: string;
  status?: ReactNode;
}): ReactElement {
  const label = title?.trim() || name;
  return (
    <span className='flex min-w-0 flex-1 flex-col gap-1.5 overflow-hidden font-normal'>
      <span className='flex min-w-0 items-center gap-2'>
        <span className='min-w-0 truncate text-sm font-medium' title={label}>
          {label}
        </span>
        {status ? <span className='shrink-0'>{status}</span> : null}
      </span>
      {label !== name ? (
        <span
          translate='no'
          className='min-w-0 truncate font-mono text-xs text-muted-foreground'
          title={name}
        >
          {name}
        </span>
      ) : null}
      {about?.trim() ? <ToolAboutSummary about={about} /> : null}
    </span>
  );
}
