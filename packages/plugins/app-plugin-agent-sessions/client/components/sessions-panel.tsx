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

import {
  attachedKey,
  automaticKey,
  type Attachment,
  type AutomaticAttachmentState,
} from '../lib/attachments.js';
import type { SessionLink } from '../../shared/api.js';
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
import { sessionMemoryKey, useSessionMemory } from '../use-session-memory.js';

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
  /** Replace only automatic attachments in an unsent new draft; manual attachments survive. Default: append. */
  readonly mode?: 'append' | 'replace';
  /** One following lifetime. Keep it stable for page changes; change it for a deliberate new start. */
  readonly scope?: string;
  /** An application-specific hint for this new draft. Never inserted into the message. */
  readonly placeholder?: string;
}

export interface AgentSessionsPanelProps extends AgentSessionsRouteOptions {
  /** Let the host show the text or resolve the reference carried by a context tag. */
  readonly onInspectAttachment?: ((attachment: Attachment) => void) | undefined;
  readonly view: AgentSessionsPanelView;
  readonly onViewChange: (view: AgentSessionsPanelView) => void;
  readonly attach?: AgentSessionsPanelAttach | undefined;
  /** The record currently shown in the host's main page, highlighted in the panel's task list. */
  readonly activeLink?: Pick<SessionLink, 'kind' | 'refId'> | null | undefined;
  /** After the panel's own buttons, such as the host's close button. */
  readonly actions?: ReactNode;
  /** Show the existing session history beside the current content without remounting its draft. */
  readonly showHistory?: boolean;
  /** Replace panel header controls, retaining session commands in the host menu. */
  readonly renderHeaderActions?:
    ((menuItems: ReactNode) => ReactNode) | undefined;
  /** Opens the full page at `path`; left out, it navigates there. */
  readonly onFullScreen?: ((path: string) => void) | undefined;
}

/** Where the attachment last applied is kept, so it is applied once. */
const APPLIED = 'panel:attach';

function Panel({
  view: requestedView,
  showHistory = false,
  onViewChange,
  attach,
  activeLink,
  actions,
  onFullScreen,
  onInspectAttachment,
  renderHeaderActions,
}: Omit<
  AgentSessionsPanelProps,
  keyof AgentSessionsRouteOptions
>): ReactElement {
  const view =
    showHistory && requestedView.kind === 'list'
      ? { kind: 'new' as const }
      : requestedView;
  const { t } = useTranslation();
  const navigate = useNavigate();
  const client = useQueryClient();
  const draftKey =
    view.kind === 'session'
      ? `session:${view.sessionId}`
      : view.kind === 'new'
        ? 'new-session'
        : null;
  const [automatic] = useSessionMemory<AutomaticAttachmentState | null>(
    automaticKey('new-session'),
    null,
  );

  useEffect(() => {
    if (!attach || !draftKey) return;
    // Page context never waits on a list and then leaks into a session chosen from that list.
    if (attach.mode === 'replace' && view.kind !== 'new') return;
    const applied = sessionMemoryKey(APPLIED);
    if (client.getQueryData(applied) === attach.id) return;
    if (attach.mode === 'replace') {
      const key = sessionMemoryKey(automaticKey(draftKey));
      const previous = client.getQueryData<AutomaticAttachmentState>(key);
      const scope = attach.scope ?? attach.id;
      if (previous?.scope === scope && previous.stopped) return;
      // Freeze while an uncertain submission still owns this draft, even if another entry requests a new intent.
      if (client.getQueryData(sessionMemoryKey(`submission:${draftKey}`)))
        return;
      if (previous?.scope !== scope) {
        client.setQueryData(sessionMemoryKey(`text:${draftKey}`), '');
        client.setQueryData(sessionMemoryKey(`mentions:${draftKey}`), []);
      }
      client.setQueryData(key, {
        scope,
        stopped: false,
        projectId: attach.projectId,
      });
    }
    client.setQueryData(applied, attach.id);
    client.setQueryData<Attachment[]>(
      sessionMemoryKey(attachedKey(draftKey)),
      (held = []) => [
        ...held.filter(
          (attachment) => attach.mode !== 'replace' || !attachment.automatic,
        ),
        ...attach.attachments
          .filter(
            (attachment) =>
              !held.some(
                (other) =>
                  (attach.mode !== 'replace' || !other.automatic) &&
                  other.id === attachment.id,
              ),
          )
          .map((attachment) =>
            attach.mode === 'replace'
              ? { ...attachment, automatic: true }
              : attachment,
          ),
      ],
    );
  }, [attach, draftKey, client, view.kind]);

  const fullPath =
    view.kind === 'session'
      ? `/agent-sessions/${encodeURIComponent(view.sessionId)}`
      : view.kind === 'new'
        ? '/agent-sessions?new'
        : '/agent-sessions';
  const defaultButtons = (
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
  const buttons = renderHeaderActions
    ? renderHeaderActions(null)
    : defaultButtons;
  const surface: SessionSurface = {
    renderHeaderActions,
    panel: true,
    onInspectAttachment,
    actions: buttons,
    onCreated: (sessionId) => onViewChange({ kind: 'session', sessionId }),
    onOpenSession: (sessionId) => onViewChange({ kind: 'session', sessionId }),
    projectId:
      attach?.mode === 'replace' ? automatic?.projectId : attach?.projectId,
    activeLink,
    placeholder: attach?.placeholder,
  };

  return (
    <SessionSurfaceContext.Provider value={surface}>
      <div className='flex h-full min-h-0 min-w-0'>
        {showHistory && (
          <SessionSurfaceContext.Provider value={{ ...surface, actions: null }}>
            <div className='w-[18rem] shrink-0 border-r' data-panel-history=''>
              <SessionList
                activeId={view.kind === 'session' ? view.sessionId : undefined}
                className='min-h-0'
              />
            </div>
          </SessionSurfaceContext.Provider>
        )}
        <div
          key='content'
          className='@container/agent-session flex min-h-0 min-w-0 flex-1 flex-col'
        >
          {view.kind === 'session' && (
            <SessionView key={view.sessionId} sessionId={view.sessionId} />
          )}
          {view.kind === 'new' && (
            <>
              <header className='flex items-center gap-2 border-b px-3.5 py-2'>
                <h2 className='min-w-0 flex-1 truncate text-sm font-semibold'>
                  {t('list.new')}
                </h2>
                {buttons}
              </header>
              <div className='min-h-0 flex-1'>
                <NewSession />
              </div>
            </>
          )}
          {view.kind === 'list' && (
            <SessionList activeId={undefined} className='min-h-0 flex-1' />
          )}
        </div>
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
  sessionMarks,
  ...props
}: AgentSessionsPanelProps): ReactElement {
  const settings = useMemo(
    () => ({
      cli,
      connectPrompt: connectPrompt ?? null,
      linkPanels: linkPanels ?? {},
      ...(sessionMarks ? { sessionMarks } : {}),
    }),
    [cli, connectPrompt, linkPanels, sessionMarks],
  );
  return (
    <AgentSessionsConfigContext.Provider value={settings}>
      <Bound {...props} />
    </AgentSessionsConfigContext.Provider>
  );
}
