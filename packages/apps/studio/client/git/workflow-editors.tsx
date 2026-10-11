/** The settings editor and summary of the `prMerged` entry condition (`workflow.ts`). */
import type {
  StatusRuleEditorProps,
  StatusRuleSummaryProps,
} from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

/** The same bound as the server's (`PR_MERGED_MIN_MAX`). */
const MIN_MAX = 20;

const minOf = (config: StatusRuleEditorProps['config']): number =>
  typeof config.min === 'number' ? config.min : 1;

export function PrMergedEditor({
  config,
  onChange,
  idPrefix,
}: StatusRuleEditorProps): ReactElement {
  const { t } = useTranslation();
  return (
    <Field>
      <FieldLabel htmlFor={`${idPrefix}-min`}>
        {t('studioGit.rule.min')}
      </FieldLabel>
      <Input
        id={`${idPrefix}-min`}
        type='number'
        min={1}
        max={MIN_MAX}
        className='h-8 w-24'
        value={minOf(config)}
        onChange={(event) => {
          const value = Math.min(
            MIN_MAX,
            Math.max(1, Math.trunc(Number(event.target.value) || 1)),
          );
          onChange(value === 1 ? {} : { min: value });
        }}
      />
    </Field>
  );
}

export function PrMergedSummary({
  config,
}: StatusRuleSummaryProps): ReactElement {
  const { t } = useTranslation();
  return <>{t('studioGit.rule.summary', { count: minOf(config) })}</>;
}
