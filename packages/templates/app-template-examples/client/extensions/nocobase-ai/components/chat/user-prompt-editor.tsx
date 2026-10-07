import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '../../shared/ui/button.js';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '../../shared/ui/popover.js';
import { Textarea } from '../../shared/ui/textarea.js';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../shared/ui/tooltip.js';
import { MessageSquareText } from 'lucide-react';
import { useState } from 'react';
import { useAIChatBase } from '../../providers/index.js';

export function UserPromptEditor() {
  const { t } = useTranslation('@nocobase/app-plugin-ai-employee');
  const { currentEmployee, saveUserPrompt } = useAIChatBase();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  // Seed the draft while rendering rather than in an effect: the popover would
  // otherwise render once with the previous employee's prompt.
  const savedPrompt = currentEmployee.userConfig?.prompt ?? '';
  const promptSource = open
    ? `${currentEmployee.username}:${savedPrompt}`
    : undefined;
  const [syncedPromptSource, setSyncedPromptSource] = useState(promptSource);
  if (syncedPromptSource !== promptSource) {
    setSyncedPromptSource(promptSource);
    if (open) {
      setPrompt(savedPrompt);
      setError(undefined);
    }
  }

  const save = async () => {
    setSaving(true);
    setError(undefined);
    try {
      await saveUserPrompt(prompt);
      setOpen(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : t('chat.prompt.saveError', 'Unable to save prompt'),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button
                  variant='ghost'
                  size='icon-sm'
                  aria-label={t('chat.prompt.title', 'Personalized prompt')}
                />
              }
            />
          }
        >
          <MessageSquareText />
        </TooltipTrigger>
        <TooltipContent>
          {t('chat.prompt.title', 'Personalized prompt')}
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        align='end'
        sideOffset={8}
        className='w-[380px] gap-3 p-4'
      >
        <PopoverHeader>
          <PopoverTitle>
            {t('chat.prompt.title', 'Personalized prompt')}
          </PopoverTitle>
          <PopoverDescription>
            {t(
              'chat.prompt.description',
              'Add instructions that this AI employee should follow when working with you.',
            )}
          </PopoverDescription>
        </PopoverHeader>
        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={5}
          className='max-h-52 min-h-28 resize-y'
          placeholder={t(
            'chat.prompt.placeholder',
            'For example: Keep answers concise and ask before changing data.',
          )}
        />
        {error ? <p className='text-xs text-destructive'>{error}</p> : null}
        <div className='flex justify-end gap-2'>
          <Button variant='outline' size='sm' onClick={() => setOpen(false)}>
            {t('actions.cancel', 'Cancel')}
          </Button>
          <Button size='sm' disabled={saving} onClick={() => void save()}>
            {saving
              ? t('actions.saving', 'Saving…')
              : t('actions.save', 'Save')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
