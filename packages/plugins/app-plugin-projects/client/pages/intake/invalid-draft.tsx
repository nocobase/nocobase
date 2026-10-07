import { useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon, AlertTriangleIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import type { IntakeSplitResult } from '../../../shared/intake.js';
import { Alert, AlertDescription } from '../../components/ui/alert.js';
import { refOf } from '../../kit/plans/model.js';
import { useRowError } from '../../kit/plans/plan-text.js';

/**
 * A split whose rows did not all pass their rehearsal (nothing was stored): every issue it would create, indented
 * under its parent, with the failing ones' errors. The text is corrected and split again.
 */
export function InvalidDraft({
  result,
}: {
  readonly result: IntakeSplitResult;
}): ReactElement {
  const { t } = useTranslation();
  const rowError = useRowError();
  const depth = new Map<string, number>();
  return (
    <section className='space-y-3' data-testid='intake-invalid'>
      <Alert variant='destructive'>
        <AlertCircleIcon />
        <AlertDescription>{t('intake.invalidDraft')}</AlertDescription>
      </Alert>
      <ol className='space-y-1'>
        {result.request.rows.map((row, index) => {
          const params = row.params as unknown as Record<string, unknown>;
          const parent = refOf(params.parentIssueId);
          const level = parent ? (depth.get(parent) ?? -1) + 1 : 0;
          if (row.ref) depth.set(row.ref, level);
          const check = result.rehearsal?.rows[index];
          const error = check && !check.ok ? rowError(check.error) : null;
          return (
            <li
              key={row.ref ?? `${row.op}:${JSON.stringify(row.params)}`}
              className='rounded-md border bg-card px-3 py-2 text-sm'
              style={{ marginInlineStart: `${level * 1.25}rem` }}
            >
              <span className='font-medium'>
                {typeof params.title === 'string'
                  ? params.title
                  : t('plans.untitled')}
              </span>
              {error ? (
                <span className='mt-1 flex items-start gap-1 text-xs text-destructive'>
                  <AlertTriangleIcon
                    className='mt-0.5 size-3.5 shrink-0'
                    aria-hidden='true'
                  />
                  {error}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
