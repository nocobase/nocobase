import type { ReactElement } from 'react';
import { copyText } from '@nocobase/app-client';
import { useDetailCopy } from './use-detail-copy.js';
import { Copy } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Label } from '#components/ui/label';
import { Textarea } from '#components/ui/textarea';

export default function DatabaseConnectionPrompt(): ReactElement | null {
  const { t } = useDetailCopy();
  const id = useId();
  const [databaseType, setDatabaseType] = useState('PostgreSQL');
  const [connectionName, setConnectionName] = useState('analytics');
  const [purpose, setPurpose] = useState('');
  const [draft, setDraft] = useState<string>();
  const [status, setStatus] = useState<
    'idle' | 'copying' | 'copied' | 'failed'
  >('idle');
  const revisionRef = useRef(0);
  const generated = t('databaseOverview.agent.prompt', {
    databaseType:
      databaseType.trim() || t('databaseOverview.agent.typePlaceholder'),
    connectionName:
      connectionName.trim() || t('databaseOverview.agent.namePlaceholder'),
    purpose: purpose.trim() || t('databaseOverview.agent.purposePlaceholder'),
  });
  const value = draft ?? generated;
  const changed = () => {
    revisionRef.current += 1;
    setStatus('idle');
  };

  async function copy() {
    const current = ++revisionRef.current;
    setStatus('copying');
    let success = false;
    try {
      success = await copyText(value);
    } catch {
      /* The manual-copy fallback remains available. */
    }
    if (current === revisionRef.current)
      setStatus(success ? 'copied' : 'failed');
  }

  return (
    <div className='space-y-4'>
      <p className='text-sm leading-6 text-muted-foreground'>
        {t('databaseOverview.agent.hint')}
      </p>
      <form
        className='space-y-3'
        onSubmit={(event) => {
          event.preventDefault();
          setDraft(generated);
          changed();
        }}
      >
        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor={`${id}-type`}>
              {t('databaseOverview.agent.type')}
            </Label>
            <Input
              id={`${id}-type`}
              value={databaseType}
              onChange={(event) => {
                setDatabaseType(event.target.value);
                changed();
              }}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor={`${id}-name`}>
              {t('databaseOverview.agent.name')}
            </Label>
            <Input
              id={`${id}-name`}
              value={connectionName}
              onChange={(event) => {
                setConnectionName(event.target.value);
                changed();
              }}
            />
          </div>
        </div>
        <div className='space-y-2'>
          <Label htmlFor={`${id}-purpose`}>
            {t('databaseOverview.agent.purpose')}
          </Label>
          <Input
            id={`${id}-purpose`}
            value={purpose}
            placeholder={t('databaseOverview.agent.purposeHint')}
            onChange={(event) => {
              setPurpose(event.target.value);
              changed();
            }}
          />
        </div>
        <Button type='submit' variant='outline'>
          {t('databaseOverview.agent.generate')}
        </Button>
        <p className='text-xs leading-5 text-muted-foreground'>
          {t('databaseOverview.agent.generateHint')}
        </p>
      </form>
      <div className='space-y-2'>
        <Label htmlFor={`${id}-prompt`}>
          {t('databaseOverview.agent.promptLabel')}
        </Label>
        <Textarea
          id={`${id}-prompt`}
          className='max-h-96 min-h-64 resize-y text-sm leading-6'
          value={value}
          onChange={(event) => {
            setDraft(event.target.value);
            changed();
          }}
        />
      </div>
      <div className='flex flex-wrap items-center gap-3'>
        <Button
          disabled={status === 'copying' || !value.trim()}
          onClick={() => void copy()}
        >
          <Copy aria-hidden />
          {t('databaseOverview.agent.copy')}
        </Button>
        <span role='status' className='text-sm text-muted-foreground'>
          {status === 'copied'
            ? t('databaseOverview.agent.copied')
            : status === 'failed'
              ? t('databaseOverview.agent.copyFailed')
              : ''}
        </span>
      </div>
    </div>
  );
}
