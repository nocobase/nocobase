import type { ReactElement } from 'react';

import { diffLines } from '../lib/diff.js';
import { cn } from 'cn';

/** A line diff of two texts, added lines green and removed ones red; for skill versions and an agent's history. */
export function DiffBlock({
  before,
  after,
  className,
}: {
  readonly before: string;
  readonly after: string;
  readonly className?: string;
}): ReactElement {
  const lines = diffLines(before, after).map((line, at) => ({
    ...line,
    id: `${line.kind}:${at}`,
  }));
  return (
    <pre
      className={cn(
        'max-h-96 overflow-auto rounded-md border font-mono text-xs leading-5',
        className,
      )}
    >
      {lines.map((line) => (
        <div
          key={line.id}
          className={cn(
            'px-2 whitespace-pre-wrap',
            line.kind === 'added' &&
              'bg-[oklch(0.955_0.04_155)] text-[oklch(0.4_0.12_155)] dark:bg-[oklch(0.65_0.12_155/0.2)] dark:text-[oklch(0.85_0.12_155)]',
            line.kind === 'removed' &&
              'bg-[oklch(0.955_0.03_25)] text-[oklch(0.45_0.18_27)] dark:bg-[oklch(0.62_0.18_25/0.2)] dark:text-[oklch(0.82_0.13_25)]',
          )}
        >
          {line.kind === 'added' ? '+ ' : line.kind === 'removed' ? '- ' : '  '}
          {line.text}
        </div>
      ))}
    </pre>
  );
}
