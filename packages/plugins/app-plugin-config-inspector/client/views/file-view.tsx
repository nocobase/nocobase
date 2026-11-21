import { useMemo, useState, type ReactElement, type ReactNode } from 'react';

import {
  diffLines,
  foldUnchanged,
  type DiffRow,
} from '../../shared/line-diff.js';
import { MASK, type ConfigInspectorSnapshot } from '../../shared/snapshot.js';
import { Alert, AlertDescription } from '../components/ui/alert.js';
import { Segment, useInspectorT } from './shared.js';

/** The configuration file, masked, in full or against `config.example.yml`. */
export function FileView({
  snapshot,
}: {
  snapshot: ConfigInspectorSnapshot;
}): ReactElement {
  const t = useInspectorT();
  const diff = useMemo(
    () =>
      snapshot.example !== null && snapshot.file.exists
        ? diffLines(snapshot.example, snapshot.file.text)
        : undefined,
    [snapshot],
  );
  const canCompare = diff !== undefined;
  const tooLarge =
    diff === undefined && snapshot.example !== null && snapshot.file.exists;
  const [mode, setMode] = useState<'compare' | 'full'>('compare');
  const lines = useMemo<DiffRow[]>(
    () =>
      mode === 'compare' && diff
        ? foldUnchanged(diff)
        : snapshot.file.text
            .replace(/\n$/u, '')
            .split('\n')
            .map((text, index) => ({ kind: 'same', text, line: index + 1 })),
    [mode, diff, snapshot],
  );
  const overridden = snapshot.settings.some(
    (setting) => setting.fileValue !== undefined,
  );
  return (
    <div className='grid gap-3'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <p className='font-mono text-xs break-all text-muted-foreground'>
          {snapshot.file.path ?? 'config.yml'}
        </p>
        {canCompare ? (
          <Segment
            label={t('views.file')}
            value={mode}
            options={[
              ['compare', t('file.compare')],
              ['full', t('file.full')],
            ]}
            onChange={setMode}
          />
        ) : null}
      </div>
      {!snapshot.file.exists ? (
        <Alert>
          <AlertDescription>{t('file.missing')}</AlertDescription>
        </Alert>
      ) : (
        <>
          {overridden ? (
            <Alert className='border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200'>
              <AlertDescription className='text-inherit'>
                {t('file.envNote')}
              </AlertDescription>
            </Alert>
          ) : null}
          {snapshot.example === null || tooLarge ? (
            <p className='text-xs text-muted-foreground'>
              {t(tooLarge ? 'file.tooLarge' : 'file.noExample')}
            </p>
          ) : null}
          <pre className='max-h-[36rem] overflow-auto rounded-lg border bg-muted/30 py-3 font-mono text-xs leading-relaxed'>
            {lines.map((line, index) =>
              line.kind === 'skipped' ? (
                <span
                  key={index}
                  className='my-1 block border-y border-dashed bg-muted/50 px-3 py-1 font-sans text-muted-foreground select-none'
                >
                  {t('file.unchanged', { count: line.count })}
                </span>
              ) : (
                <span
                  key={index}
                  className={`grid grid-cols-[3rem_1.25rem_minmax(0,1fr)] ${line.kind === 'added' ? 'bg-emerald-50 dark:bg-emerald-950/50' : line.kind === 'removed' ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200' : ''}`}
                >
                  <span className='pr-2 text-right text-muted-foreground select-none'>
                    {line.line ?? ''}
                  </span>
                  <span
                    aria-hidden
                    className={`text-center select-none ${line.kind === 'added' ? 'text-emerald-600' : line.kind === 'removed' ? 'text-rose-600' : ''}`}
                  >
                    {line.kind === 'added'
                      ? '+'
                      : line.kind === 'removed'
                        ? '-'
                        : ''}
                  </span>
                  <span className='pr-4 whitespace-pre'>
                    {highlight(line.text)}
                  </span>
                </span>
              ),
            )}
          </pre>
        </>
      )}
    </div>
  );
}

const KEY = /^(\s*(?:-\s+)?)([\w.-]+)(:)/u;

function highlight(text: string): ReactNode {
  if (/^\s*#/u.test(text))
    return <span className='text-muted-foreground'>{text}</span>;
  const key = KEY.exec(text);
  const rest = key ? text.slice(key[0].length) : text;
  const value = rest.split(MASK).flatMap((part, index) =>
    index === 0
      ? [part]
      : [
          <span key={index} className='text-muted-foreground'>
            {MASK}
          </span>,
          part,
        ],
  );
  return key ? (
    <>
      {key[1]}
      <span className='text-violet-700 dark:text-violet-300'>{key[2]}</span>
      {key[3]}
      {value}
    </>
  ) : (
    value
  );
}
