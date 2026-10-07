/**
 * Route `/runtimes/connect` ("Add runtime"): choose which coding tools the runtime may run (all by default) and how many
 * runs it takes at once (1 by default), get a
 * one-line install command carrying a one-time token, run it on the host, and watch it show up connected with the
 * coding tools it found and whether each is on and signed in. The tool choice and the concurrency travel with the
 * token, so the command stays one line, and both can be changed on the runtimes page afterwards. A runtime added this way is personal (it runs
 * only its owner's work); someone who manages runners may add one shared with the team instead.
 *
 * Installing the runner, creating its credential and starting it at login are one command here.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2Icon } from 'lucide-react';
import { useState, type FormEvent, type ReactElement } from 'react';

import { AGENT_TOOLS, type AgentTool } from '@nocobase/agent-protocol';

import type {
  RegistrationToken,
  RunnerSummary,
  RunnerTrust,
} from '../../../shared/runners.js';
import { RUNNERS_TOPIC } from '../../../shared/realtime.js';
import { agentsKeys } from '../../api/keys.js';
import { CommandLine } from '../../components/command-line.js';
import { RouteDialog } from '../../components/route-dialog.js';
import { Button } from '../../components/ui/button.js';
import { Checkbox } from '../../components/ui/checkbox.js';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '../../components/ui/field.js';
import { Input } from '../../components/ui/input.js';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group.js';
import { Spinner } from '../../components/ui/spinner.js';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs.js';
import { useRouteOverlay } from '../../components/use-route-overlay.js';
import { useSetting } from '../../hooks/use-access.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { useNotify } from '../../hooks/use-notify.js';
import { useRealtimeTopic } from '../../hooks/use-realtime-topic.js';
import { useServerUrl } from '../../hooks/use-server-url.js';
import { useFormatters } from '../../lib/format.js';
import {
  guessSystem,
  installCommand,
  INSTALL_SYSTEMS,
  registerCommand,
} from '../../lib/install.js';
import { RunnerToolsCell } from './runner-cells.js';

/** How often the dialog asks for runners while it waits, besides the realtime announcement. */
const WAIT_POLL_MS = 3000;

const TRUST_LEVELS: readonly RunnerTrust[] = ['ownerOnly', 'team'];

export default function ConnectRuntimePage(): ReactElement {
  const { t } = useTranslation();
  return (
    <RouteDialog
      title={t('connect.title')}
      description={t('connect.description')}
      className='sm:max-w-2xl'
    >
      <AddRunnerSteps />
    </RouteDialog>
  );
}

function AddRunnerSteps(): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const notify = useNotify();
  const { close } = useRouteOverlay();
  const canShare = useSetting('agents.runners', 'manage');
  const [trust, setTrust] = useState<RunnerTrust>('ownerOnly');
  const [tools, setTools] = useState<readonly AgentTool[]>(AGENT_TOOLS);
  const [toolsMissing, setToolsMissing] = useState(false);
  const [slots, setSlots] = useState('1');
  const [slotsInvalid, setSlotsInvalid] = useState(false);
  // The runners that existed when the token was made: a runner not among them is the one that just registered.
  const [known, setKnown] = useState<ReadonlySet<string>>();

  const create = useMutation({
    mutationFn: async () => {
      const before = await api.runners();
      const token = await api.createRegistrationToken({
        trust: canShare ? trust : 'ownerOnly',
        // Every tool is no choice at all, so a tool the protocol adds later is offered too.
        enabledTools: tools.length === AGENT_TOOLS.length ? null : tools,
        slots: Number(slots),
      });
      setKnown(new Set(before.map((runner) => runner.id)));
      return token;
    },
    onError: (error) => notify.error(error),
  });

  if (create.data && known)
    return (
      <InstallStep
        token={create.data}
        known={known}
        onClose={() => void close()}
      />
    );

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const count = Number(slots);
    const badSlots = !(Number.isInteger(count) && count >= 1 && count <= 64);
    setToolsMissing(tools.length === 0);
    setSlotsInvalid(badSlots);
    if (tools.length === 0 || badSlots) return;
    create.mutate();
  }

  return (
    <form onSubmit={submit} className='space-y-4'>
      {canShare ? (
        <FieldSet>
          <FieldLegend variant='label'>{t('runtimes.trust.label')}</FieldLegend>
          <RadioGroup
            value={trust}
            onValueChange={(value) => {
              const next = TRUST_LEVELS.find((level) => level === value);
              if (next) setTrust(next);
            }}
          >
            {TRUST_LEVELS.map((level) => (
              <Field key={level} orientation='horizontal'>
                <RadioGroupItem value={level} id={`ag-add-trust-${level}`} />
                <FieldContent>
                  <FieldLabel htmlFor={`ag-add-trust-${level}`}>
                    {t(`runtimes.trust.${level}`)}
                  </FieldLabel>
                  <FieldDescription>
                    {t(`runtimes.trust.${level}Hint`)}
                  </FieldDescription>
                </FieldContent>
              </Field>
            ))}
          </RadioGroup>
        </FieldSet>
      ) : (
        <p className='text-sm text-muted-foreground'>
          {t('runtimes.trust.personalOnly')}
        </p>
      )}
      <FieldSet data-invalid={toolsMissing ? true : undefined}>
        <FieldLegend variant='label'>{t('connect.tools')}</FieldLegend>
        <FieldDescription>{t('connect.toolsHint')}</FieldDescription>
        <div className='grid gap-2 sm:grid-cols-2'>
          {AGENT_TOOLS.map((tool) => (
            <Field key={tool} orientation='horizontal'>
              <Checkbox
                id={`ag-add-tool-${tool}`}
                checked={tools.includes(tool)}
                onCheckedChange={(checked) => {
                  setToolsMissing(false);
                  setTools(
                    AGENT_TOOLS.filter((candidate) =>
                      candidate === tool ? checked : tools.includes(candidate),
                    ),
                  );
                }}
              />
              <FieldLabel
                htmlFor={`ag-add-tool-${tool}`}
                className='font-normal'
              >
                {t(`tools.${tool}`)}
              </FieldLabel>
            </Field>
          ))}
        </div>
        {toolsMissing ? (
          <FieldError>{t('connect.toolsRequired')}</FieldError>
        ) : null}
      </FieldSet>
      <Field data-invalid={slotsInvalid ? true : undefined}>
        <FieldLabel htmlFor='ag-add-slots'>{t('connect.slots')}</FieldLabel>
        <Input
          id='ag-add-slots'
          inputMode='numeric'
          className='w-24'
          value={slots}
          aria-invalid={slotsInvalid ? true : undefined}
          onChange={(event) => {
            setSlotsInvalid(false);
            setSlots(event.target.value);
          }}
        />
        {slotsInvalid ? (
          <FieldError>{t('runtimes.edit.slotsInvalid')}</FieldError>
        ) : (
          <FieldDescription>{t('connect.slotsHint')}</FieldDescription>
        )}
      </Field>
      <div className='flex justify-end gap-2'>
        <Button type='button' variant='outline' onClick={() => void close()}>
          {t('actions.cancel')}
        </Button>
        <Button type='submit' disabled={create.isPending}>
          {create.isPending ? <Spinner data-icon='inline-start' /> : null}
          {t('connect.createCredential')}
        </Button>
      </div>
    </form>
  );
}

function InstallStep({
  token,
  known,
  onClose,
}: {
  readonly token: RegistrationToken;
  readonly known: ReadonlySet<string>;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const format = useFormatters();
  const server = useServerUrl();
  const [system, setSystem] = useState(() =>
    guessSystem(typeof navigator === 'undefined' ? '' : navigator.userAgent),
  );
  // Polled while waiting, and fetched again as soon as the server announces a runner.
  const runners = useQuery({
    queryKey: agentsKeys.runners,
    queryFn: () => api.runners(),
    refetchInterval: (query) =>
      connectedRunner(query.state.data, known) ? false : WAIT_POLL_MS,
  });
  const connected = connectedRunner(runners.data, known);
  useRealtimeTopic(connected ? null : RUNNERS_TOPIC, () => {
    void runners.refetch();
  });

  return (
    <div className='space-y-4'>
      <Tabs
        value={system}
        onValueChange={(value) => {
          const next = INSTALL_SYSTEMS.find((candidate) => candidate === value);
          if (next) setSystem(next);
        }}
      >
        <TabsList variant='line'>
          {INSTALL_SYSTEMS.map((candidate) => (
            <TabsTrigger key={candidate} value={candidate}>
              {t(`connect.system.${candidate}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        {INSTALL_SYSTEMS.map((candidate) => {
          const command = installCommand(candidate, server, token.token);
          return (
            <TabsContent key={candidate} value={candidate} className='pt-3'>
              {command ? (
                <div className='space-y-3'>
                  <p className='text-sm'>{t('connect.run')}</p>
                  <CommandLine command={command} />
                  <p className='text-xs text-muted-foreground'>
                    {t('connect.installed')}
                  </p>
                  <CommandLine command={registerCommand(server, token.token)} />
                </div>
              ) : (
                <p className='text-sm text-muted-foreground'>
                  {t('connect.unsupported')}
                </p>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
      <p className='text-xs text-muted-foreground'>
        {t('connect.tokenOnce', {
          trust: t(`runtimes.trust.${token.trust}`),
          time: format.dateTime(token.expiresAt),
        })}{' '}
        {t('connect.tokenTools', {
          tools: (token.enabledTools ?? AGENT_TOOLS)
            .map((tool) => t(`tools.${tool}`))
            .join(', '),
        })}
        {token.slots
          ? ` ${t('connect.tokenSlots', { slots: token.slots })}`
          : null}
      </p>
      <div
        role='status'
        aria-live='polite'
        className='flex min-h-12 items-start gap-2 rounded-lg border p-3'
      >
        {connected ? (
          <>
            <CheckCircle2Icon className='mt-0.5 size-4 shrink-0 text-[oklch(0.5_0.12_155)]' />
            <div className='min-w-0 space-y-1.5'>
              <p className='text-sm font-medium'>
                {t('connect.connected', { name: connected.name })}
              </p>
              <RunnerToolsCell runner={connected} />
            </div>
          </>
        ) : (
          <>
            <Spinner className='mt-0.5' />
            <p className='text-sm text-muted-foreground'>
              {t('connect.after')}
            </p>
          </>
        )}
      </div>
      <div className='flex justify-end'>
        <Button onClick={onClose}>
          {connected ? t('connect.done') : t('actions.close')}
        </Button>
      </div>
    </div>
  );
}

/** The runner that registered after the token was made, if one has. */
function connectedRunner(
  runners: readonly RunnerSummary[] | undefined,
  known: ReadonlySet<string>,
): RunnerSummary | undefined {
  return runners?.find((runner) => !known.has(runner.id));
}
