/**
 * Enabling a pending agent, or changing an enabled or disabled one: what it is good at (started from the model
 * catalog's suggestion in the viewer's language when the agent has none), its default reasoning effort, and, when
 * editing, whether it is enabled. Enabling needs a description; the server refuses one without it too.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';

import type { AgentView } from '../../../shared/agents.js';
import { modelSuggestion } from '../../model-suggestion.js';
import { agentsKeys } from '../../api/keys.js';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select.js';
import { Switch } from '../../components/ui/switch.js';
import { Textarea } from '../../components/ui/textarea.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { useNotify } from '../../hooks/use-notify.js';

/** The value the effort select holds for the tool's default. */
const DEFAULT_EFFORT = '__default__';

export interface AgentDialogProps {
  readonly agent: AgentView | null;
  readonly onClose: () => void;
  readonly candidates?: readonly AgentView[];
}

export function AgentDialog({
  agent,
  onClose,
  candidates,
}: AgentDialogProps): ReactElement {
  return (
    <Dialog
      open={agent !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className='flex max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] flex-col sm:max-w-xl'
        data-testid='agent-dialog'
        finalFocus={() =>
          document.querySelector<HTMLButtonElement>(
            '[data-testid="agents-discovery-toggle"]',
          )
        }
      >
        {agent ? (
          <AgentChoice
            key={agent.id}
            agent={agent}
            candidates={candidates ?? [agent]}
            onClose={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function AgentChoice({
  agent,
  candidates,
  onClose,
}: {
  agent: AgentView;
  candidates: readonly AgentView[];
  onClose: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const [target, setTarget] = useState(agent);
  const [saving, setSaving] = useState(false);
  return (
    <>
      {candidates.length > 1 ? (
        <Field>
          <FieldLabel htmlFor='agent-provider'>
            {t('agents.discovery.provider')}
          </FieldLabel>
          <Select
            disabled={saving}
            items={candidates.map((candidate) => ({
              value: candidate.id,
              label: `${candidate.model} · ${candidate.runners.names.join(', ') || t('agents.where.none')}`,
            }))}
            value={target.id}
            onValueChange={(value) => {
              const next = candidates.find(
                (candidate) => candidate.id === value,
              );
              if (next) setTarget(next);
            }}
          >
            <SelectTrigger id='agent-provider'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((candidate) => (
                <SelectItem key={candidate.id} value={candidate.id}>
                  {candidate.model} ·{' '}
                  {candidate.runners.names.join(', ') || t('agents.where.none')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      ) : null}
      <AgentForm
        key={target.id}
        agent={target}
        onClose={onClose}
        onSavingChange={setSaving}
      />
    </>
  );
}

/** The dialog's content for one agent, its fields starting from what the agent has. */
function AgentForm({
  agent,
  onClose,
  onSavingChange,
}: {
  readonly agent: AgentView;
  readonly onClose: () => void;
  readonly onSavingChange: (saving: boolean) => void;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const api = useAgentsApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const enabling = agent.status === 'pending';
  const [goodAt, setGoodAt] = useState(
    () => agent.description ?? modelSuggestion(agent, i18n.language, t),
  );
  const [effort, setEffort] = useState<string>(agent.effort ?? DEFAULT_EFFORT);
  const [enabled, setEnabled] = useState(agent.status !== 'disabled');
  const [submitted, setSubmitted] = useState(false);

  const save = useMutation({
    onMutate: () => onSavingChange(true),
    onSettled: () => onSavingChange(false),
    mutationFn: (target: AgentView) =>
      api.updateAgent(target.id, {
        description: goodAt.trim() || null,
        effort: effort === DEFAULT_EFFORT ? null : effort,
        enabled: enabling ? true : enabled,
        expectedRevision: target.revision,
      }),
    onSuccess: (saved) => {
      notify.success(
        t(enabling ? 'agents.enable.done' : 'agents.edit.done', {
          name: saved.name,
        }),
      );
      void queryClient.invalidateQueries({ queryKey: agentsKeys.agents });
      onClose();
    },
    onError: (error) => notify.error(error),
  });

  const missing = (enabling || enabled) && goodAt.trim() === '';
  const { runners } = agent;
  const reportedBy = t('agents.enable.reportedBy', {
    count: runners.team + runners.personal,
    names: runners.names.join(', '),
  });

  return (
    <>
      <DialogHeader className='shrink-0'>
        <DialogTitle>
          {t(enabling ? 'agents.enable.title' : 'agents.edit.title', {
            name: agent.name,
          })}
        </DialogTitle>
        <DialogDescription>
          {runners.team + runners.personal > 0
            ? reportedBy
            : t('agents.enable.noRunnerNow')}
        </DialogDescription>
      </DialogHeader>
      <form
        id='agent-dialog-form'
        className='-mx-4 min-h-0 flex-1 overflow-y-auto px-4 pb-1'
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
          if (missing) return;
          save.mutate(agent);
        }}
      >
        <FieldGroup>
          <Field data-invalid={submitted && missing ? true : undefined}>
            <FieldLabel htmlFor='agent-good-at'>
              {t('agents.columns.goodAt')}
            </FieldLabel>
            <Textarea
              id='agent-good-at'
              rows={4}
              value={goodAt}
              onChange={(event) => setGoodAt(event.target.value)}
              aria-invalid={submitted && missing ? true : undefined}
              data-testid='agent-good-at'
            />
            <FieldDescription>{t('agents.enable.goodAtHint')}</FieldDescription>
            {submitted && missing ? (
              <FieldError>{t('agents.enable.goodAtRequired')}</FieldError>
            ) : null}
          </Field>
          {agent.efforts.length > 0 ? (
            <Field>
              <FieldLabel htmlFor='agent-effort'>
                {t('agents.columns.effort')}
              </FieldLabel>
              <Select
                items={[
                  {
                    value: DEFAULT_EFFORT,
                    label: t('agents.effort.default'),
                  },
                  ...agent.efforts.map((value) => ({
                    value,
                    label: t(`agents.effort.${value}`, {
                      defaultValue: value,
                    }),
                  })),
                ]}
                value={effort}
                onValueChange={(next: string | null) =>
                  setEffort(next ?? DEFAULT_EFFORT)
                }
              >
                <SelectTrigger id='agent-effort' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DEFAULT_EFFORT}>
                    {t('agents.effort.default')}
                  </SelectItem>
                  {agent.efforts.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`agents.effort.${value}`, { defaultValue: value })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                {t('agents.enable.effortHint')}
              </FieldDescription>
            </Field>
          ) : null}
          {!enabling ? (
            <Field orientation='horizontal'>
              <Switch
                id='agent-enabled'
                checked={enabled}
                onCheckedChange={(checked: boolean) => setEnabled(checked)}
              />
              <FieldLabel htmlFor='agent-enabled'>
                {t('agents.edit.enabled')}
              </FieldLabel>
            </Field>
          ) : null}
          {agent.personalOnly ? (
            <p className='rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground'>
              {t('agents.enable.personalOnly')}
            </p>
          ) : null}
        </FieldGroup>
      </form>
      <DialogFooter className='shrink-0'>
        <Button variant='outline' type='button' onClick={onClose}>
          {t('actions.cancel')}
        </Button>
        <Button
          type='submit'
          form='agent-dialog-form'
          disabled={save.isPending}
          data-testid='agent-dialog-save'
        >
          {t(enabling ? 'agents.enable.submit' : 'actions.save')}
        </Button>
      </DialogFooter>
    </>
  );
}
