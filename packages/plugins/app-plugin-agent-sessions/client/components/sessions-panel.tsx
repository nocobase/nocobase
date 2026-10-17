/**
 * The agent sessions in a panel of the host application's own, beside whatever page is open: one session, a new one or
 * the list, laid out by the panel's width. The host keeps which of them shows (`view`) and draws the panel around it;
 * this draws the buttons between them and to the full page. What the host attaches, such as the record the panel was
 * opened beside, goes in the shown draft once, where the person can remove it before sending.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useQueryClient } from '@tanstack/react-query';
import { ListIcon, Maximize2Icon, PlusIcon } from 'lucide-react';
import { useEffect, useMemo, type ReactElement, type ReactNode } from 'react';
import { useNavigate } from 'react-router';

import { attachedKey, type Attachment } from '../lib/attachments.js';
import { NewSession } from './new-session.js';
import { SessionList } from './session-list.js';
import { SessionView } from './session-view.js';
import { Button } from './ui/button.js';
import {
  AgentSessionsConfigContext,
  SessionSurfaceContext,
  type AgentSessionsRouteOptions,
  type SessionSurface,
} from '../config.js';
import { withAgentSessions } from '../query.js';
import { sessionMemoryKey } from '../use-session-memory.js';

export type AgentSessionsPanelView =
  | { readonly kind: 'session'; readonly sessionId: string }
  | { readonly kind: 'new' }
  | { readonly kind: 'list' };

/** Goes in the shown draft once per `id`, so reopening the panel beside the same record does not add it again. */
export interface AgentSessionsPanelAttach {
  readonly id: string;
  readonly attachments: readonly Attachment[];
  /** The project a new session starts with; `null` for none. */
  readonly projectId?: string | null | undefined;
}

export interface AgentSessionsPanelProps extends AgentSessionsRouteOptions {
  readonly view: AgentSessionsPanelView;
  readonly onViewChange: (view: AgentSessionsPanelView) => void;
  readonly attach?: AgentSessionsPanelAttach | undefined;
  /** After the panel's own buttons, such as the host's close button. */
  readonly actions?: ReactNode;
  /** Opens the full page at `path`; left out, it navigates there. */
  readonly onFullScreen?: ((path: string) => void) | undefined;
}

/** Where the attachment last applied is kept, so it is applied once. */
const APPLIED = 'panel:attach';

function Panel({
  view,
  onViewChange,
  attach,
  actions,
  onFullScreen,
}: Omit<
  AgentSessionsPanelProps,
  keyof AgentSessionsRouteOptions
>): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const client = useQueryClient();
  const draftKey =
    view.kind === 'session'
      ? `session:${view.sessionId}`
      : view.kind === 'new'
        ? 'new-session'
        : null;

  useEffect(() => {
    if (!attach || !draftKey) return;
    const applied = sessionMemoryKey(APPLIED);
    if (client.getQueryData(applied) === attach.id) return;
    client.setQueryData(applied, attach.id);
    client.setQueryData<Attachment[]>(
      sessionMemoryKey(attachedKey(draftKey)),
      (held = []) => [
        ...held,
        ...attach.attachments.filter(
          (attachment) => !held.some((other) => other.id === attachment.id),
        ),
      ],
    );
  }, [attach, draftKey, client]);

  const fullPath =
    view.kind === 'session'
      ? `/agent-sessions/${encodeURIComponent(view.sessionId)}`
      : view.kind === 'new'
        ? '/agent-sessions?new'
        : '/agent-sessions';
  const buttons = (
    <div className='flex shrink-0 items-center gap-0.5'>
      {view.kind !== 'new' && (
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={t('list.new')}
          title={t('list.new')}
          onClick={() => onViewChange({ kind: 'new' })}
        >
          <PlusIcon />
        </Button>
      )}
      {view.kind !== 'list' && (
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={t('list.label')}
          title={t('list.label')}
          onClick={() => onViewChange({ kind: 'list' })}
        >
          <ListIcon />
        </Button>
      )}
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label={t('panel.fullScreen')}
        title={t('panel.fullScreen')}
        onClick={() =>
          onFullScreen ? onFullScreen(fullPath) : void navigate(fullPath)
        }
      >
        <Maximize2Icon />
      </Button>
      {actions}
    </div>
  );
  const surface: SessionSurface = {
    panel: true,
    actions: buttons,
    onCreated: (sessionId) => onViewChange({ kind: 'session', sessionId }),
    onOpenSession: (sessionId) => onViewChange({ kind: 'session', sessionId }),
    projectId: attach?.projectId,
  };

  return (
    <SessionSurfaceContext.Provider value={surface}>
      <div className='@container/agent-session flex h-full min-h-0 flex-col'>
        {view.kind === 'session' && (
          <SessionView key={view.sessionId} sessionId={view.sessionId} />
        )}
        {view.kind === 'new' && (
          <>
            <div className='flex items-center gap-2 border-b px-3.5 py-2'>
              <h2 className='min-w-0 flex-1 truncate text-sm font-semibold'>
                {t('list.new')}
              </h2>
              {buttons}
            </div>
            <div className='min-h-0 flex-1'>
              <NewSession />
            </div>
          </>
        )}
        {view.kind === 'list' && (
          <SessionList activeId={undefined} className='min-h-0 flex-1' />
        )}
      </div>
    </SessionSurfaceContext.Provider>
  );
}

const Bound = withAgentSessions(Panel);

/** The agent sessions in the host application's panel; give it the options its `agentSessionsRoute()` has. */
export function AgentSessionsPanel({
  cli,
  connectPrompt,
  linkPanels,
  ...props
}: AgentSessionsPanelProps): ReactElement {
  const settings = useMemo(
    () => ({
      cli,
      connectPrompt: connectPrompt ?? null,
      linkPanels: linkPanels ?? {},
    }),
    [cli, connectPrompt, linkPanels],
  );
  return (
    <AgentSessionsConfigContext.Provider value={settings}>
      <Bound {...props} />
    </AgentSessionsConfigContext.Provider>
  );
}
