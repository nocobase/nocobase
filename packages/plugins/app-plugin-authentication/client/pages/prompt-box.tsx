import { copyText, useToaster } from '@nocobase/app-client';
import { BotIcon, CopyIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { Button } from '../components/ui/button.js';
import { useAuthenticationTranslation } from './i18n.js';

/**
 * The generated prompt for a development agent, editable before it is copied. An edit lasts until the generated text
 * changes, such as when another provider is chosen; then the box shows the new prompt.
 */
export function PromptBox({
  prompt,
  hint,
}: {
  readonly prompt: string;
  readonly hint: string;
}): ReactElement {
  const { t } = useAuthenticationTranslation();
  const toaster = useToaster();
  const [draft, setDraft] = useState<{
    readonly base: string;
    readonly text: string;
  }>();
  const text = draft?.base === prompt ? draft.text : prompt;
  const copy = (): void => {
    void copyText(text).then((copied) => {
      if (copied) toaster.show({ type: 'success', title: t('sso.copied') });
    });
  };

  return (
    <div>
      <div className='overflow-hidden rounded-lg border bg-background'>
        <div className='flex items-center gap-2 border-b bg-muted/50 px-3 py-2'>
          <BotIcon className='size-4 text-muted-foreground' aria-hidden />
          <span className='text-sm font-semibold'>{t('prompt.title')}</span>
          <Button size='sm' className='ml-auto' onClick={copy}>
            <CopyIcon aria-hidden />
            {t('prompt.copy')}
          </Button>
        </div>
        <textarea
          aria-label={t('prompt.label')}
          data-testid='agent-prompt'
          className='block min-h-72 w-full resize-y bg-transparent px-3 py-2 text-sm leading-6 outline-none [field-sizing:content] focus-visible:bg-primary/5'
          value={text}
          spellCheck={false}
          onChange={(event) =>
            setDraft({ base: prompt, text: event.target.value })
          }
        />
      </div>
      <p className='mt-1 text-xs text-muted-foreground'>{hint}</p>
    </div>
  );
}
