import { copyText } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { CopyIcon, DatabaseIcon, FileIcon, LayersIcon } from 'lucide-react';
import { useId, useRef, type ReactElement } from 'react';
import { ACCESS_NAMESPACE } from '../../shared/access.js';
import { useNotify } from '../hooks/use-notify.js';
import { Button } from './ui/button.js';
import { FieldLabel } from './ui/field.js';
import { Textarea } from './ui/textarea.js';

const databases = [
  { key: 'sqlite', type: 'sqlite-vec', Icon: FileIcon },
  { key: 'pgvector', type: 'pgvector', Icon: DatabaseIcon },
] as const;

/** Deployment guidance only: copying a prompt never configures or starts an index. */
export function IndexingEmpty(): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const notify = useNotify();
  const id = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prompt = t('indexing.agentPrompt');
  const copy = async () => {
    if (await copyText(prompt)) {
      notify.success(t('indexing.promptCopied'));
    } else {
      textareaRef.current?.focus();
      textareaRef.current?.select();
      notify.error(t('indexing.promptCopyFallback'));
    }
  };
  return (
    <section className='space-y-6' aria-labelledby={id + '-title'}>
      <div className='space-y-3'>
        <div className='flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary'>
          <LayersIcon className='size-6' aria-hidden='true' />
        </div>
        <h2 id={id + '-title'} className='font-heading text-xl font-semibold'>
          {t('indexing.emptyTitle')}
        </h2>
        <p className='text-sm leading-relaxed text-muted-foreground'>
          {t('indexing.emptyDescription')}
        </p>
      </div>
      <div className='grid gap-3 sm:grid-cols-2'>
        {databases.map(({ key, type, Icon }) => (
          <section key={key} className='space-y-3 rounded-lg border p-4'>
            <div className='flex flex-wrap items-center gap-2'>
              <Icon
                className='size-4 text-muted-foreground'
                aria-hidden='true'
              />
              <h3 className='font-heading text-sm font-medium'>
                {t('indexing.databases.' + key + '.name')}
              </h3>
              <code className='rounded bg-muted px-1.5 py-0.5 text-xs'>
                {type}
              </code>
            </div>
            <p className='text-xs leading-relaxed text-muted-foreground'>
              {t('indexing.databases.' + key + '.description')}
            </p>
          </section>
        ))}
      </div>
      <div className='space-y-3'>
        <h3 className='font-heading text-sm font-medium'>
          {t('indexing.setupTitle')}
        </h3>
        <ol className='space-y-3'>
          {(['instance', 'restart', 'enable'] as const).map((step, index) => (
            <li key={step} className='flex gap-3'>
              <span
                className='flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground'
                aria-hidden='true'
              >
                {index + 1}
              </span>
              <p className='text-sm leading-relaxed'>
                {t('indexing.setup.' + step)}
              </p>
            </li>
          ))}
        </ol>
      </div>
      <p className='text-xs leading-relaxed text-muted-foreground'>
        {t('indexing.agentHandoff')}
      </p>
      <section className='space-y-3 rounded-lg border bg-muted/30 p-4'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <h3 className='font-heading text-sm font-medium'>
            {t('indexing.agentTitle')}
          </h3>
          <Button
            type='button'
            size='icon-sm'
            variant='ghost'
            aria-label={t('indexing.copyPrompt')}
            title={t('indexing.copyPrompt')}
            onClick={() => {
              void copy();
            }}
          >
            <CopyIcon aria-hidden='true' />
          </Button>
        </div>
        <FieldLabel htmlFor={id + '-prompt'} className='sr-only'>
          {t('indexing.promptLabel')}
        </FieldLabel>
        <Textarea
          ref={textareaRef}
          id={id + '-prompt'}
          readOnly
          value={prompt}
          spellCheck={false}
          className='h-64 resize-y overflow-y-auto bg-background text-sm leading-relaxed [field-sizing:fixed]'
        />
      </section>
    </section>
  );
}
