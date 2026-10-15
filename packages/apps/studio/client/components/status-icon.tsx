/**
 * A task's status as a small shape in its colour, the same in every list, table, board, issue page and "My Agent": not
 * started is a dashed ring, in progress half filled, blocked a pause, in review three quarters filled, done a check and
 * cancelled a cross, so the shape alone tells them apart. The colours are the projects plugin's `statusTone`.
 * "Waiting for you" is not a status; it is a label of its own (`WaitChip`).
 */
import type { ReactElement } from 'react';

import { cn } from 'cn';

import {
  STATUS_SHAPE_TEXT,
  statusShape,
  type StatusShape,
} from './status-shapes.js';

export function StatusShapeIcon({
  shape,
  label,
  className,
}: {
  readonly shape: StatusShape;
  /** The status's name, read by screen readers and shown on hover; the icon is decorative without one. */
  readonly label?: string;
  readonly className?: string;
}): ReactElement {
  return (
    <svg
      viewBox='0 0 16 16'
      className={cn('size-4 shrink-0', STATUS_SHAPE_TEXT[shape], className)}
      data-status-shape={shape}
      {...(label
        ? { role: 'img', 'aria-label': label }
        : { 'aria-hidden': true })}
    >
      {label ? <title>{label}</title> : null}
      {shape === 'backlog' ? (
        <circle
          cx='8'
          cy='8'
          r='6'
          fill='none'
          stroke='currentColor'
          strokeWidth='1.6'
          strokeDasharray='2.4 2.1'
        />
      ) : shape === 'done' || shape === 'closed' ? (
        <>
          <circle cx='8' cy='8' r='7' fill='currentColor' />
          {shape === 'done' ? (
            <path
              d='m5.2 8.3 1.9 1.9 3.7-3.9'
              fill='none'
              className='stroke-background'
              strokeWidth='1.7'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          ) : (
            <path
              d='M6 6l4 4M10 6l-4 4'
              className='stroke-background'
              strokeWidth='1.6'
              strokeLinecap='round'
            />
          )}
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
          {shape === 'started' ? (
            <path d='M8 4.6a3.4 3.4 0 0 1 0 6.8z' fill='currentColor' />
          ) : shape === 'review' ? (
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

/** A task status's icon by its key. */
export function StatusIcon({
  statusKey,
  label,
  className,
}: {
  readonly statusKey: string;
  readonly label?: string;
  readonly className?: string;
}): ReactElement {
  return (
    <StatusShapeIcon
      shape={statusShape(statusKey)}
      {...(label ? { label } : {})}
      {...(className ? { className } : {})}
    />
  );
}

/** A status's icon and name, as a table's status column and a sub-task row show it. */
export function StatusName({
  statusKey,
  name,
  className,
}: {
  readonly statusKey: string;
  readonly name: string;
  readonly className?: string;
}): ReactElement {
  return (
    <span
      className={cn(
        'inline-flex min-w-0 items-center gap-1.5 text-sm whitespace-nowrap',
        className,
      )}
    >
      <StatusIcon statusKey={statusKey} className='size-3.5' />
      <span className='truncate'>{name}</span>
    </span>
  );
}
