import { useState, type ReactNode } from 'react';
import { Check, Copy } from 'lucide-react';

import { Button } from './ui/button.js';
import { Card } from './ui/card.js';
import { cn } from './utils.js';

export function PromptOutput({
  className,
  copiedLabel = 'Copied',
  copyErrorLabel = 'Clipboard access failed. Select the prompt and copy it manually.',
  copyLabel = 'Copy prompt',
  description,
  prompt,
  promptClassName,
  title = 'Generated prompt',
}: {
  className?: string;
  copiedLabel?: ReactNode;
  copyErrorLabel?: ReactNode;
  copyLabel?: ReactNode;
  description: ReactNode;
  prompt: string;
  promptClassName?: string;
  title?: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyError(false);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopyError(true);
    }
  };

  return (
    <Card className={cn('min-w-0 gap-0 overflow-hidden py-0', className)}>
      <div className='flex items-center justify-between gap-3 border-b px-4 py-3'>
        <div className='min-w-0'>
          <div className='text-sm font-medium'>{title}</div>
          <div className='text-xs text-muted-foreground'>{description}</div>
        </div>
        <Button
          type='button'
          size='sm'
          className='shrink-0'
          onClick={() => void copyPrompt()}
        >
          {copied ? <Check /> : <Copy />}
          {copied ? copiedLabel : copyLabel}
        </Button>
      </div>
      {copyError ? (
        <p className='border-b px-4 py-2 text-xs text-destructive'>
          {copyErrorLabel}
        </p>
      ) : null}
      <pre
        className={cn(
          'max-h-[560px] overflow-auto whitespace-pre-wrap bg-muted/25 p-5 font-mono text-xs leading-5 text-muted-foreground',
          promptClassName,
        )}
      >
        {prompt}
      </pre>
    </Card>
  );
}
