import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '../../shared/ui/button.js';
import { cn } from 'cn';
import { useState } from 'react';
import { getNocoBaseToolCallMetadata } from '../chat/tool-call-utils.js';
import type { AIToolRendererProps } from './tool-renderer-provider.js';
import { asRecord, parseArray } from './tool-renderer-utils.js';

export function SuggestionsRenderer({
  part,
  disabled,
  onEdit,
}: AIToolRendererProps) {
  const { t } = useTranslation('@nocobase/app-plugin-ai-employee');
  const input = asRecord(part.input);
  const metadata = getNocoBaseToolCallMetadata(part);
  const options = parseArray(input.options).filter(
    (option): option is string => typeof option === 'string',
  );
  const [selected, setSelected] = useState<string>();
  const persistedSelection = metadata?.selectedSuggestion;
  const hasSelected =
    selected !== undefined || persistedSelection !== undefined;
  const canSelect =
    metadata?.invokeStatus === undefined ||
    metadata.invokeStatus === 'interrupted';

  if (!options.length) {
    return (
      <p className='text-xs text-muted-foreground'>
        {t('tool.suggestions.generating', 'Generating suggestions…')}
      </p>
    );
  }

  return (
    <div className='flex flex-wrap gap-2'>
      {options.map((option) => (
        <Button
          key={option}
          variant='outline'
          size='sm'
          className={cn(
            'h-auto min-h-8 whitespace-normal text-left',
            (selected === option || persistedSelection === option) &&
              'border-2 border-dashed bg-muted',
          )}
          disabled={disabled || hasSelected || !canSelect}
          onClick={() => {
            setSelected(option);
            void Promise.resolve(onEdit({ ...input, option })).catch(() => {
              setSelected((current) =>
                current === option ? undefined : current,
              );
            });
          }}
        >
          {option}
        </Button>
      ))}
    </div>
  );
}
