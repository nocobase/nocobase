/**
 * A linked record's status as a small shape in its colour, as the application draws its statuses (`SessionLinkIcon`):
 * not started a dashed ring, started half filled, blocked a pause, in review three quarters, done a check and closed a
 * cross. This plugin keeps its own copy, as it does its other components; Studio's is `client/components/status-icon.tsx`.
 */
import { cn } from 'cn';
import type { ReactElement } from 'react';

import type { SessionLinkIcon } from '../../shared/api.js';
import { ICON_TEXT } from '../lib/tones.js';

export function StatusIcon({
  icon,
  label,
  className,
}: {
  readonly icon: SessionLinkIcon;
  readonly label?: string;
  readonly className?: string;
}): ReactElement {
  return (
    <svg
      viewBox='0 0 16 16'
      className={cn('size-3.5 shrink-0', ICON_TEXT[icon], className)}
      data-status-shape={icon}
      {...(label
        ? { role: 'img', 'aria-label': label }
        : { 'aria-hidden': true })}
    >
      {label ? <title>{label}</title> : null}
      {icon === 'backlog' ? (
        <circle
          cx='8'
          cy='8'
          r='6'
          fill='none'
          stroke='currentColor'
          strokeWidth='1.6'
          strokeDasharray='2.4 2.1'
        />
      ) : icon === 'done' || icon === 'closed' ? (
        <>
          <circle cx='8' cy='8' r='7' fill='currentColor' />
          <path
            d={
              icon === 'done'
                ? 'm5.2 8.3 1.9 1.9 3.7-3.9'
                : 'M6 6l4 4M10 6l-4 4'
            }
            fill='none'
            className='stroke-background'
            strokeWidth='1.7'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </>
      ) : (
        <>
          <circle
            cx='8'
            cy='8'
            r='6'
            fill='none'
            stroke='currentColor'
            strokeWidth='1.6'
          />
          {icon === 'started' ? (
            <path d='M8 4.6a3.4 3.4 0 0 1 0 6.8z' fill='currentColor' />
          ) : icon === 'review' ? (
            <path d='M8 4.6A3.4 3.4 0 1 1 4.6 8H8z' fill='currentColor' />
          ) : (
            <path
              d='M6.6 6v4M9.4 6v4'
              stroke='currentColor'
              strokeWidth='1.6'
              strokeLinecap='round'
            />
          )}
        </>
      )}
    </svg>
  );
}
