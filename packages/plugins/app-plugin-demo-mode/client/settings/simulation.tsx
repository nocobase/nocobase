import { useContext, useState, type ReactElement } from 'react';

import type { DemoChatConfiguration } from '../../shared/configuration.js';
import { Alert, AlertTitle } from '../components/ui/alert.js';
import { Badge } from '../components/ui/badge.js';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '../components/ui/empty.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.js';
import { Switch } from '../components/ui/switch.js';
import {
  DemoSettingsContext,
  useDraft,
  useLabel,
  useT,
  type Configuration,
} from './context.js';
import { SettingRow, SettingsCard } from './shared.js';
import { ModelConnection } from './model-connection.js';

/**
 * The application's simulations of outside work, such as the demo model or a Runner. A disabled one fails closed:
 * the work is refused, never sent to the real service.
 */
export function MocksCard({
  configuration,
}: {
  readonly configuration: Configuration;
}): ReactElement {
  const t = useT();
  const label = useLabel();
  const { view } = configuration;
  const draft = useDraft('mocks', 'mocks', view.mocks, configuration);
  const mocks = draft.draft;
  const disabled = !configuration.canEdit || draft.saving || view.busy;
  const changed = view.adapters.filter(
    (adapter) => Boolean(mocks[adapter.id]) !== Boolean(view.mocks[adapter.id]),
  );
  return (
    <SettingsCard
      title={t('simulation.mocks.title')}
      description={t('simulation.mocks.description')}
      draft={draft}
      canEdit={configuration.canEdit}
      busy={view.busy}
      confirmation={{
        title: t('simulation.mocks.confirmTitle'),
        description: t('simulation.mocks.confirmDescription'),
        changes: changed.map(
          (adapter) =>
            `${label('adapter', adapter.id, adapter.title)}: ${t(mocks[adapter.id] ? 'switch.on' : 'switch.off')}`,
        ),
        destructive: changed.some((adapter) => !mocks[adapter.id]),
      }}
    >
      {!view.adapters.length ? (
        <Empty className='border border-dashed'>
          <EmptyHeader>
            <EmptyTitle>{t('simulation.mocks.empty')}</EmptyTitle>
            <EmptyDescription>
              {t('simulation.mocks.emptyHelp')}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className='divide-y rounded-lg border'>
          {view.adapters.map((adapter) => (
            <li key={adapter.id} className='px-4 py-3'>
              <SettingRow
                htmlFor={`demo-mock-${adapter.id}`}
                label={
                  <span className='inline-flex flex-wrap items-center gap-2'>
                    {label('adapter', adapter.id, adapter.title)}
                    <Badge variant='outline'>
                      {t(`simulation.kind.${adapter.kind}`)}
                    </Badge>
                  </span>
                }
                description={
                  mocks[adapter.id]
                    ? t('simulation.mocks.onHelp')
                    : t('simulation.mocks.offHelp')
                }
              >
                <Switch
                  id={`demo-mock-${adapter.id}`}
                  checked={mocks[adapter.id] === true}
                  disabled={disabled}
                  onCheckedChange={(enabled) =>
                    draft.setDraft({ ...mocks, [adapter.id]: enabled })
                  }
                />
              </SettingRow>
            </li>
          ))}
        </ul>
      )}
    </SettingsCard>
  );
}

type Policy = 'read' | 'mock' | 'deny';

/** Online chat for visitors: whether it is open, which model answers, and what each tool may do. */
export function ChatCard({
  configuration,
}: {
  readonly configuration: Configuration;
}): ReactElement {
  const t = useT();
  const label = useLabel();
  const { chatTools = [] } = useContext(DemoSettingsContext);
  const { view } = configuration;
  const draft = useDraft('chat', 'chat', view.chat, configuration);
  const chat: DemoChatConfiguration = draft.draft;
  const [connectionSaving, setConnectionSaving] = useState(false);
  const disabled =
    !configuration.canEdit || draft.saving || view.busy || connectionSaving;
  const set = (patch: Partial<DemoChatConfiguration>) =>
    draft.setDraft({ ...chat, ...patch });
  const tools = [
    ...chatTools,
    ...Object.keys(chat.tools)
      .filter((id) => !chatTools.some((tool) => tool.id === id))
      .map((id) => ({
        id,
        policies: [chat.tools[id]].filter(
          (policy): policy is 'read' | 'mock' => policy !== 'deny',
        ),
      })),
  ];
  const [connectionPending, setConnectionPending] = useState(false);
  const live = chat.model !== null;
  const incomplete =
    live &&
    (connectionPending ||
      !chat.model?.modelService.trim() ||
      !chat.model?.model.trim());
  return (
    <SettingsCard
      title={t('simulation.chat.title')}
      description={t('simulation.chat.description')}
      draft={draft}
      canEdit={configuration.canEdit}
      busy={view.busy || incomplete}
      confirmation={{
        title: t('simulation.chat.confirmTitle'),
        description: live
          ? t('simulation.chat.confirmLive')
          : t('simulation.chat.confirmDescription'),
        changes: [
          `${t('simulation.chat.enabled')}: ${t(chat.enabled ? 'switch.on' : 'switch.off')}`,
          live
            ? `${t('simulation.chat.model')}: ${chat.model?.modelService} / ${chat.model?.model}`
            : `${t('simulation.chat.model')}: ${t('simulation.chat.simulated')}`,
        ],
        destructive: live,
      }}
    >
      <SettingRow
        htmlFor='demo-chat-enabled'
        label={t('simulation.chat.enabled')}
        description={t('simulation.chat.enabledHelp')}
      >
        <Switch
          id='demo-chat-enabled'
          checked={chat.enabled}
          disabled={disabled}
          onCheckedChange={(enabled) => set({ enabled })}
        />
      </SettingRow>
      <SettingRow
        label={t('simulation.chat.model')}
        description={
          live
            ? t('simulation.chat.liveHelp')
            : t('simulation.chat.simulatedHelp')
        }
      >
        <Select
          value={live ? 'live' : 'simulated'}
          disabled={disabled}
          onValueChange={(mode) =>
            set({
              model:
                mode === 'live'
                  ? (view.chat.model ?? { modelService: '', model: '' })
                  : null,
            })
          }
        >
          <SelectTrigger
            aria-label={t('simulation.chat.model')}
            className='w-48'
          >
            <SelectValue>
              {t(live ? 'simulation.chat.live' : 'simulation.chat.simulated')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='simulated'>
              {t('simulation.chat.simulated')}
            </SelectItem>
            <SelectItem value='live'>{t('simulation.chat.live')}</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>
      {live && chat.model ? (
        <>
          <ModelConnection
            model={chat.model}
            onChange={(model) => set({ model })}
            disabled={disabled}
            configuration={configuration}
            onPending={setConnectionPending}
            onSaving={setConnectionSaving}
          />
          <Alert>
            <AlertTitle>{t('simulation.chat.cost')}</AlertTitle>
          </Alert>
        </>
      ) : null}
      <div className='flex flex-col gap-2'>
        <p className='text-sm font-medium'>{t('simulation.chat.tools')}</p>
        {!tools.length ? (
          <p className='text-sm text-muted-foreground'>
            {t('simulation.chat.noTools')}
          </p>
        ) : (
          <ul className='divide-y rounded-lg border'>
            {tools.map((tool) => {
              const policy: Policy = chat.tools[tool.id] ?? 'deny';
              return (
                <li
                  key={tool.id}
                  className='flex items-center justify-between gap-3 px-4 py-2.5'
                >
                  <span className='min-w-0 truncate text-sm'>
                    {label('chatTool', tool.id)}
                  </span>
                  <Select
                    value={policy}
                    disabled={disabled}
                    onValueChange={(next) => {
                      if (next !== null)
                        set({
                          tools: { ...chat.tools, [tool.id]: next },
                        });
                    }}
                  >
                    <SelectTrigger
                      size='sm'
                      className='w-40'
                      aria-label={label('chatTool', tool.id)}
                    >
                      <SelectValue>
                        {t(`simulation.chat.policy.${policy}`)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {(['deny', ...tool.policies] as Policy[]).map((item) => (
                        <SelectItem key={item} value={item}>
                          {t(`simulation.chat.policy.${item}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SettingsCard>
  );
}
