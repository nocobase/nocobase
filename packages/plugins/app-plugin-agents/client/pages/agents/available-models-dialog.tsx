/**
 * Every tool and model a runner has reported signed in, whether an agent exists for it yet or not, grouped by tool:
 * create one from an entry that has none, or see the state of one that already does. Replaces the old discoveries
 * section, which a runner's report created one pending agent per model for — the thing that once produced hundreds
 * of pending agents for a single ACP tool reporting that many. The application's recommended combinations never
 * show a "Create" button here: a runner reporting one signed in creates and enables it on its own.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';

import type { AvailableModel } from '../../../shared/agents.js';
import { TOOL_LABELS } from '../../../shared/model-catalog.js';
import { modelSuggestion } from '../../model-suggestion.js';
import { agentsKeys } from '../../api/keys.js';
import { AgListSkeleton, AgLoadError } from '../../components/ag-states.js';
import { AgTag, type Tone } from '../../components/ag-tag.js';
import { Button } from '../../components/ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog.js';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '../../components/ui/field.js';
import { Input } from '../../components/ui/input.js';
import { Textarea } from '../../components/ui/textarea.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { useNotify } from '../../hooks/use-notify.js';

const STATUS_TONE: Readonly<Record<'pending' | 'enabled' | 'disabled', Tone>> =
  { pending: 'amber', enabled: 'green', disabled: 'grey' };

export interface AvailableModelsDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

export function AvailableModelsDialog({
  open,
  onClose,
}: AvailableModelsDialogProps): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState<AvailableModel | null>(null);
  const models = useQuery({
    queryKey: agentsKeys.availableModels,
    queryFn: () => api.availableModels(),
    enabled: open,
  });
  const matches = (model: AvailableModel) =>
    `${model.displayModel ?? model.model} ${model.tool}`
      .toLowerCase()
      .includes(search.toLowerCase());
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setCreating(null);
          onClose();
        }
      }}
    >
      <DialogContent
        className='flex max-h-[calc(100dvh-2rem)] flex-col'
        data-testid='available-models-dialog'
      >
        {creating ? (
          <CreateForm
            model={creating}
            onBack={() => setCreating(null)}
            onDone={() => setCreating(null)}
          />
        ) : (
          <>
            <DialogHeader className='shrink-0'>
              <DialogTitle>{t('agents.available.title')}</DialogTitle>
              <DialogDescription>
                {t('agents.available.description')}
              </DialogDescription>
            </DialogHeader>
            <div className='min-h-0 flex-1 space-y-3 overflow-y-auto'>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('agents.discovery.search')}
                aria-label={t('agents.discovery.search')}
              />
              {models.isError && !models.data ? (
                <AgLoadError
                  title={t('agents.loadFailed')}
                  error={models.error}
                  onRetry={() => void models.refetch()}
                />
              ) : !models.data ? (
                <AgListSkeleton />
              ) : (
                Object.entries(TOOL_LABELS).map(([tool, label]) => {
                  const byTool = models.data.filter(
                    (model) => model.tool === tool && matches(model),
                  );
                  return byTool.length ? (
                    <div key={tool} className='space-y-2'>
                      <h3 className='font-medium'>{label}</h3>
                      {byTool.map((model) => (
                        <div
                          key={`${model.tool}:${model.model}`}
                          data-testid={`available-model-${model.tool}-${model.model}`}
                          className='flex items-center gap-3 rounded-lg border p-3'
                        >
                          <div className='min-w-0 flex-1'>
                            <div className='font-medium'>
                              {model.displayModel ?? (model.model || label)}
                            </div>
                            {model.recommended ? (
                              <div className='text-xs text-muted-foreground'>
                                {t('agents.available.recommended')}
                              </div>
                            ) : null}
                          </div>
                          {model.agentId && model.status ? (
                            <AgTag tone={STATUS_TONE[model.status]} dot>
                              {t(`agents.state.${model.status}`)}
                            </AgTag>
                          ) : (
                            <Button
                              size='sm'
                              onClick={() => setCreating(model)}
                              data-testid={`available-model-create-${model.tool}-${model.model}`}
                            >
                              {t('agents.available.create')}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null;
                })
              )}
              {models.data && models.data.filter(matches).length === 0 ? (
                <p className='text-sm text-muted-foreground'>
                  {t('agents.noneInFilter')}
                </p>
              ) : null}
            </div>
            <DialogFooter className='shrink-0'>
              <Button variant='outline' onClick={onClose}>
                {t('actions.close')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreateForm({
  model,
  onBack,
  onDone,
}: {
  readonly model: AvailableModel;
  readonly onBack: () => void;
  readonly onDone: () => void;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const api = useAgentsApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [goodAt, setGoodAt] = useState(() =>
    modelSuggestion(model, i18n.language, t),
  );
  const [submitted, setSubmitted] = useState(false);
  const create = useMutation({
    mutationFn: () =>
      api.createRunnerAgent({
        tool: model.tool,
        model: model.model,
        ...(model.displayModel ? { displayModel: model.displayModel } : {}),
        description: goodAt.trim(),
      }),
    onSuccess: (agent) => {
      notify.success(t('agents.enable.done', { name: agent.name }));
      void queryClient.invalidateQueries({ queryKey: agentsKeys.agents });
      void queryClient.invalidateQueries({
        queryKey: agentsKeys.availableModels,
      });
      onDone();
    },
    onError: (error) => notify.error(error),
  });
  const missing = goodAt.trim() === '';
  return (
    <>
      <DialogHeader className='shrink-0'>
        <DialogTitle>
          {t('agents.available.createTitle', {
            name: model.displayModel ?? model.model,
          })}
        </DialogTitle>
      </DialogHeader>
      <form
        id='available-model-create-form'
        className='-mx-4 min-h-0 flex-1 overflow-y-auto px-4 pb-1'
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
          if (missing) return;
          create.mutate();
        }}
      >
        <FieldGroup>
          <Field data-invalid={submitted && missing ? true : undefined}>
            <FieldLabel htmlFor='available-model-good-at'>
              {t('agents.columns.goodAt')}
            </FieldLabel>
            <Textarea
              id='available-model-good-at'
              rows={4}
              value={goodAt}
              onChange={(event) => setGoodAt(event.target.value)}
              aria-invalid={submitted && missing ? true : undefined}
              data-testid='available-model-good-at'
            />
            <FieldDescription>{t('agents.enable.goodAtHint')}</FieldDescription>
            {submitted && missing ? (
              <FieldError>{t('agents.enable.goodAtRequired')}</FieldError>
            ) : null}
          </Field>
        </FieldGroup>
      </form>
      <DialogFooter className='shrink-0'>
        <Button variant='outline' type='button' onClick={onBack}>
          {t('actions.back')}
        </Button>
        <Button
          type='submit'
          form='available-model-create-form'
          disabled={create.isPending}
          data-testid='available-model-create-submit'
        >
          {t('agents.available.create')}
        </Button>
      </DialogFooter>
    </>
  );
}
