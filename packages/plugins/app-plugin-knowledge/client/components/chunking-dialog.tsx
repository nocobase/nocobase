/**
 * A space's chunking, for whoever manages it: follow the application's default, or cut this space's documents its own
 * way (the deepest heading a section starts at, the size long sections are cut towards and the length past which they
 * are cut). Saving a change cuts the space's documents again in the background, and re-indexes them when semantic
 * search is on; the dialog says while that runs.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';

import { Alert, AlertDescription } from './ui/alert.js';
import { Button } from './ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.js';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from './ui/field.js';
import { Input } from './ui/input.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select.js';
import { Skeleton } from './ui/skeleton.js';
import { Spinner } from './ui/spinner.js';
import { Switch } from './ui/switch.js';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import {
  CHUNK_SIZE_MAX,
  CHUNK_SIZE_MIN,
  chunkingOf,
  type KnowledgeChunking,
  type KnowledgeChunkingConfig,
  type SpaceRef,
} from '../../shared/knowledge.js';
import {
  knowledgeKeys,
  useKnowledgeApi,
  useKnowledgeChunking,
} from '../api.js';
import { useNotify } from '../hooks/use-notify.js';

const DEPTHS = ['1', '2', '3'] as const;

function ChunkingForm({
  space,
  config,
  onDone,
}: {
  readonly space: SpaceRef;
  readonly config: KnowledgeChunkingConfig;
  readonly onDone: () => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = useKnowledgeApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [own, setOwn] = useState(config.override !== null);
  const start = config.override ?? config.defaults;
  const [depth, setDepth] = useState(String(start.headingDepth));
  const [target, setTarget] = useState(String(start.target));
  const [max, setMax] = useState(String(start.max));
  const wanted: KnowledgeChunking | null = chunkingOf({
    headingDepth: Number(depth),
    target: Number(target),
    max: Number(max),
  });
  const save = useMutation({
    mutationFn: () => api.setChunking(space, own ? wanted : null),
    onSuccess: (saved) => {
      queryClient.setQueryData(knowledgeKeys.chunking(space), saved);
      notify.success(t('knowledge.chunking.saved'));
      onDone();
    },
    onError: (error) => notify.error(error),
  });
  const id = (part: string) => `knowledge-chunking-${part}`;
  const depthItems = DEPTHS.map((value) => ({
    value,
    label: t(`knowledge.chunking.depths.${value}`),
  }));
  const invalid = own && wanted === null;
  const { defaults } = config;
  return (
    <form
      className='space-y-4'
      onSubmit={(event) => {
        event.preventDefault();
        if (!invalid && !save.isPending) save.mutate();
      }}
    >
      {config.rechunking ? (
        <Alert>
          <AlertDescription className='flex items-center gap-2'>
            <Spinner />
            {t('knowledge.chunking.rechunking')}
          </AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup className='gap-4'>
        <Field orientation='horizontal'>
          <FieldContent>
            <FieldLabel htmlFor={id('own')}>
              {t('knowledge.chunking.own')}
            </FieldLabel>
            <FieldDescription>
              {t('knowledge.chunking.defaults', {
                depth: defaults.headingDepth,
                target: defaults.target,
                max: defaults.max,
              })}
            </FieldDescription>
          </FieldContent>
          <Switch id={id('own')} checked={own} onCheckedChange={setOwn} />
        </Field>
        {own ? (
          <>
            <Field>
              <FieldLabel htmlFor={id('depth')}>
                {t('knowledge.chunking.depth')}
              </FieldLabel>
              <Select
                items={depthItems}
                value={depth}
                onValueChange={(value: string | null) =>
                  value && setDepth(value)
                }
              >
                <SelectTrigger id={id('depth')} className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  align='end'
                  alignItemWithTrigger={false}
                  className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'
                >
                  {depthItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                {t('knowledge.chunking.depthHint')}
              </FieldDescription>
            </Field>
            <div className='grid gap-4 sm:grid-cols-2'>
              <Field data-invalid={invalid || undefined}>
                <FieldLabel htmlFor={id('target')}>
                  {t('knowledge.chunking.target')}
                </FieldLabel>
                <Input
                  id={id('target')}
                  type='number'
                  inputMode='numeric'
                  min={CHUNK_SIZE_MIN}
                  max={CHUNK_SIZE_MAX}
                  value={target}
                  aria-invalid={invalid || undefined}
                  onChange={(event) => setTarget(event.target.value)}
                />
              </Field>
              <Field data-invalid={invalid || undefined}>
                <FieldLabel htmlFor={id('max')}>
                  {t('knowledge.chunking.max')}
                </FieldLabel>
                <Input
                  id={id('max')}
                  type='number'
                  inputMode='numeric'
                  min={CHUNK_SIZE_MIN}
                  max={CHUNK_SIZE_MAX}
                  value={max}
                  aria-invalid={invalid || undefined}
                  onChange={(event) => setMax(event.target.value)}
                />
              </Field>
            </div>
            {invalid ? (
              <FieldError>
                {t('knowledge.chunking.invalid', {
                  min: CHUNK_SIZE_MIN,
                  max: CHUNK_SIZE_MAX,
                })}
              </FieldError>
            ) : (
              <p className='text-sm text-muted-foreground'>
                {t('knowledge.chunking.sizesHint')}
              </p>
            )}
          </>
        ) : null}
      </FieldGroup>
      <p className='text-sm text-muted-foreground'>
        {t('knowledge.chunking.effect')}
      </p>
      <DialogFooter>
        <Button type='button' variant='outline' onClick={onDone}>
          {t('knowledge.editor.cancel')}
        </Button>
        <Button type='submit' disabled={invalid || save.isPending}>
          {save.isPending ? <Spinner data-icon='inline-start' /> : null}
          {t('knowledge.chunking.save')}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ChunkingDialog({
  open,
  onOpenChange,
  space,
  spaceLabel,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly space: SpaceRef;
  readonly spaceLabel: string;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const config = useKnowledgeChunking(open ? space : null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md' data-testid='knowledge-chunking'>
        <DialogHeader>
          <DialogTitle>{t('knowledge.chunking.title')}</DialogTitle>
          <DialogDescription>
            {t('knowledge.chunking.description', { space: spaceLabel })}
          </DialogDescription>
        </DialogHeader>
        {config.data ? (
          <ChunkingForm
            key={JSON.stringify(config.data.override)}
            space={space}
            config={config.data}
            onDone={() => onOpenChange(false)}
          />
        ) : config.isError ? (
          <p className='text-sm text-muted-foreground'>
            {t('knowledge.loadFailed')}
          </p>
        ) : (
          <Skeleton
            className='h-32 w-full'
            aria-label={t('knowledge.loading')}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
