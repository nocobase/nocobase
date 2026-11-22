/**
 * An agent's details, in a sheet the Agent page opens from its row: its settings (the saved description, default
 * reasoning effort, who may chat with it and enabled state, edited by who manages agents and only read by everyone
 * else), the business actions it may perform, the team's default skills it gets and its recent runs. Enabling needs a
 * description; the server refuses one without it too.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';

import type { AgentView } from '../../../shared/agents.js';
import { agentModelOf } from '../../../shared/model-catalog.js';
import { agentsKeys } from '../../api/keys.js';
import { Button } from '../../components/ui/button.js';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../components/ui/sheet.js';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs.js';
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
import { AgMultiSelect } from '../../components/ag-multi-select.js';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group.js';
import { Switch } from '../../components/ui/switch.js';
import { Textarea } from '../../components/ui/textarea.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { useNotify } from '../../hooks/use-notify.js';
import { useChatRoles, useRoleTitle } from './chat-roles.js';
import {
  AgentActionsTab,
  AgentRunsTab,
  AgentSkillsTab,
  AgentSummary,
} from './agent-detail-tabs.js';
import { GoodAtTemplates } from './good-at-templates.js';

/** The value the effort select holds for the tool's default. */
const DEFAULT_EFFORT = '__default__';

export interface AgentDialogProps {
  readonly agent: AgentView | null;
  readonly onClose: () => void;
}

export function AgentDialog({
  agent,
  onClose,
}: AgentDialogProps): ReactElement {
  return (
    <Sheet
      open={agent !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        className='w-full gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[640px]'
        data-testid='agent-dialog'
      >
        {agent ? (
          <AgentDetail key={agent.id} agent={agent} onClose={onClose} />
        ) : (
          <SheetTitle className='sr-only'>Agent</SheetTitle>
        )}
      </SheetContent>
    </Sheet>
  );
}

const TABS = ['settings', 'actions', 'skills', 'runs'] as const;

function AgentDetail({
  agent,
  onClose,
}: {
  readonly agent: AgentView;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const [tab, setTab] = useState<string>('settings');
  const { runners } = agent;
  return (
    <>
      <SheetHeader className='shrink-0 border-b'>
        <SheetTitle>{agent.name}</SheetTitle>
        <SheetDescription>
          {runners.team + runners.personal > 0
            ? t('agents.enable.reportedBy', {
                count: runners.team + runners.personal,
                names: runners.names.join(', '),
              })
            : t('agents.enable.noRunnerNow')}
        </SheetDescription>
      </SheetHeader>
      <Tabs
        value={tab}
        onValueChange={setTab}
        className='flex min-h-0 flex-1 flex-col gap-0'
      >
        <div className='shrink-0 overflow-x-auto border-b px-4'>
          <TabsList variant='line' className='w-max'>
            {TABS.map((value) => (
              <TabsTrigger
                key={value}
                value={value}
                data-testid={`agent-tab-${value}`}
              >
                {t(`agents.detail.tabs.${value}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent
          keepMounted
          value='settings'
          className='flex min-h-0 flex-1 flex-col'
        >
          {agent.canEdit ? (
            <AgentForm agent={agent} onClose={onClose} />
          ) : (
            <div className='min-h-0 flex-1 overflow-y-auto p-4'>
              <AgentSummary agent={agent} />
            </div>
          )}
        </TabsContent>
        <TabsContent value='actions' className='min-h-0 overflow-y-auto p-4'>
          <AgentActionsTab agent={agent} />
        </TabsContent>
        <TabsContent value='skills' className='min-h-0 overflow-y-auto p-4'>
          <AgentSkillsTab />
        </TabsContent>
        <TabsContent value='runs' className='min-h-0 overflow-y-auto p-4'>
          <AgentRunsTab agentId={agent.id} />
        </TabsContent>
      </Tabs>
    </>
  );
}

/** The dialog's content for one agent, its fields starting from what the agent has. */
function AgentForm({
  agent,
  onClose,
}: {
  readonly agent: AgentView;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [goodAt, setGoodAt] = useState(() => agent.description ?? '');
  const [effort, setEffort] = useState<string>(agent.effort ?? DEFAULT_EFFORT);
  const [enabled, setEnabled] = useState(agent.status !== 'disabled');
  const [audience, setAudience] = useState<'everyone' | 'roles'>(
    agent.chatRoles?.length ? 'roles' : 'everyone',
  );
  const [chatRoles, setChatRoles] = useState<readonly string[]>(
    agent.chatRoles ?? [],
  );
  const roles = useChatRoles();
  const roleTitle = useRoleTitle(roles.data);
  const [submitted, setSubmitted] = useState(false);

  const save = useMutation({
    mutationFn: (target: AgentView) =>
      api.updateAgent(target.id, {
        description: goodAt.trim() || null,
        effort: effort === DEFAULT_EFFORT ? null : effort,
        enabled,
        chatRoles: audience === 'roles' ? [...chatRoles] : null,
        expectedRevision: target.revision,
      }),
    onSuccess: async (saved) => {
      // A pending list read must not replace the saved values before reopening.
      await queryClient.cancelQueries({ queryKey: agentsKeys.agents });
      queryClient.setQueryData<AgentView[]>(agentsKeys.agents, (current) =>
        current?.map((item) =>
          item.id === saved.id ? { ...item, ...saved } : item,
        ),
      );
      notify.success(
        t('agents.edit.done', {
          name: saved.name,
        }),
      );
      void queryClient.invalidateQueries({ queryKey: agentsKeys.agents });
      onClose();
    },
    onError: (error) => notify.error(error),
  });

  const missing = enabled && goodAt.trim() === '';
  const rolesMissing = audience === 'roles' && chatRoles.length === 0;
  // Every agent shows its whole model id here.
  const qualifiedModel = agentModelOf(agent).model ?? null;

  return (
    <>
      <form
        id='agent-dialog-form'
        className='min-h-0 flex-1 overflow-y-auto p-4'
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
          if (missing || rolesMissing) return;
          save.mutate(agent);
        }}
      >
        <FieldGroup>
          {qualifiedModel ? (
            <Field>
              <FieldLabel htmlFor='agent-model'>
                {t('agents.edit.model')}
              </FieldLabel>
              <p
                id='agent-model'
                className='font-mono text-sm break-words [overflow-wrap:anywhere]'
                data-testid='agent-dialog-model'
              >
                {qualifiedModel}
              </p>
            </Field>
          ) : null}
          <Field data-invalid={submitted && missing ? true : undefined}>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <FieldLabel htmlFor='agent-good-at'>
                {t('agents.columns.goodAt')}
              </FieldLabel>
              <GoodAtTemplates
                value={goodAt}
                onChange={setGoodAt}
                disabled={save.isPending}
              />
            </div>
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
          <Field
            data-invalid={submitted && rolesMissing ? true : undefined}
            data-testid='agent-chat-roles'
          >
            <FieldLabel id='agent-chat-roles-label'>
              {t('agents.chatRoles.label')}
            </FieldLabel>
            <RadioGroup
              aria-labelledby='agent-chat-roles-label'
              value={audience}
              onValueChange={(value) =>
                setAudience(value === 'roles' ? 'roles' : 'everyone')
              }
            >
              <label className='flex items-center gap-2 text-sm'>
                <RadioGroupItem value='everyone' />
                {t('agents.chatRoles.everyone')}
              </label>
              <label className='flex items-center gap-2 text-sm'>
                <RadioGroupItem value='roles' />
                {t('agents.chatRoles.roles')}
              </label>
            </RadioGroup>
            {audience === 'roles' ? (
              <AgMultiSelect
                aria-label={t('agents.chatRoles.roles')}
                options={(roles.data ?? []).map((role) => ({
                  value: role.key,
                  label: roleTitle(role.key),
                }))}
                value={chatRoles}
                onChange={setChatRoles}
                placeholder={t('agents.chatRoles.placeholder')}
              />
            ) : null}
            <FieldDescription>{t('agents.chatRoles.hint')}</FieldDescription>
            {submitted && rolesMissing ? (
              <FieldError>{t('agents.chatRoles.required')}</FieldError>
            ) : null}
          </Field>
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
          {agent.personalOnly ? (
            <p className='rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground'>
              {t('agents.enable.personalOnly')}
            </p>
          ) : null}
        </FieldGroup>
      </form>
      <div className='flex shrink-0 justify-end gap-2 border-t p-4'>
        <Button variant='outline' type='button' onClick={onClose}>
          {t('actions.cancel')}
        </Button>
        <Button
          type='submit'
          form='agent-dialog-form'
          disabled={save.isPending}
          data-testid='agent-dialog-save'
        >
          {t('actions.save')}
        </Button>
      </div>
    </>
  );
}
