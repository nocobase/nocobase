import type { ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { MAIL_PLUGIN_NS } from '../namespace.js';
import { splitMailQuotedText } from '../lib/mail-quoted-content.js';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible.js';

export function MailTextBody({
  text,
}: {
  readonly text: string;
}): ReactElement {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  const { body, quote } = splitMailQuotedText(text);
  return (
    <div className='mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-foreground'>
      {body}
      {quote ? (
        <Collapsible key={text}>
          <CollapsibleTrigger className='cursor-pointer text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring'>
            {t('workspace.quotedContent', { defaultValue: 'Quoted content' })}
          </CollapsibleTrigger>
          <CollapsibleContent className='mt-2'>{quote}</CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  );
}
