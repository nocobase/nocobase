import { useTranslation } from '@nocobase/i18n/client';
import { CheckIcon, CopyIcon, RotateCcwIcon } from 'lucide-react';
import { type ReactElement, useState } from 'react';

import { Button } from '#components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '#components/ui/tabs';
import { Textarea } from '#components/ui/textarea';

import type { Capability } from './capabilities.js';
import { useCopy } from './use-copy.js';

export interface PromptDialogProps {
  readonly capability: Capability;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

/**
 * The prompts of one capability, ready to hand to a coding agent. Each prompt can be edited before copying. Edits are
 * not saved: the page mounts a new dialog each time one is opened, so it starts from the default wording again.
 */
export function PromptDialog({
  capability,
  open,
  onOpenChange,
}: PromptDialogProps): ReactElement {
  const { t } = useTranslation();
  const { copied, copy } = useCopy();
  const [current, setCurrent] = useState(capability.prompts[0]);
  // Edited text per prompt id; a prompt without an entry shows its default wording.
  const [edits, setEdits] = useState<Readonly<Record<string, string>>>({});

  const prefix = `home.capabilities.${capability.id}`;
  const defaultText = t(`${prefix}.prompts.${current}.text`);
  const text = edits[current] ?? defaultText;
  const Icon = capability.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='gap-5 sm:max-w-2xl'>
        <DialogHeader className='flex-row items-center gap-3 pr-8'>
          <span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary'>
            <Icon className='size-5' aria-hidden />
          </span>
          <div className='flex min-w-0 flex-col gap-1.5'>
            <DialogTitle>{t(`${prefix}.title`)}</DialogTitle>
            <DialogDescription>{t(`${prefix}.description`)}</DialogDescription>
          </div>
        </DialogHeader>
        <div className='flex flex-col gap-3'>
          {capability.prompts.length > 1 ? (
            <Tabs
              value={current}
              onValueChange={(value) => {
                if (typeof value === 'string') setCurrent(value);
              }}
            >
              <TabsList className='w-full'>
                {capability.prompts.map((id) => (
                  <TabsTrigger key={id} value={id}>
                    {t(`${prefix}.prompts.${id}.label`)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          ) : null}
          <Textarea
            aria-label={t('home.prompt.label')}
            className='field-sizing-fixed h-60 max-h-[50dvh] resize-none leading-6'
            value={text}
            onChange={(event) =>
              setEdits((previous) => ({
                ...previous,
                [current]: event.target.value,
              }))
            }
          />
          <p className='text-xs text-muted-foreground'>
            {t('home.prompt.hint')}
          </p>
        </div>
        <DialogFooter className='sm:items-center'>
          <Button
            variant='ghost'
            className='sm:mr-auto'
            disabled={text === defaultText}
            onClick={() =>
              setEdits((previous) => {
                const rest = { ...previous };
                delete rest[current];
                return rest;
              })
            }
          >
            <RotateCcwIcon data-icon='inline-start' />
            {t('home.prompt.reset')}
          </Button>
          <DialogClose render={<Button variant='outline' />}>
            {t('actions.close')}
          </DialogClose>
          <Button disabled={text.trim() === ''} onClick={() => void copy(text)}>
            {copied ? (
              <CheckIcon data-icon='inline-start' />
            ) : (
              <CopyIcon data-icon='inline-start' />
            )}
            {copied ? t('home.prompt.copiedShort') : t('home.prompt.copy')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
