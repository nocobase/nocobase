/* eslint-disable react-refresh/only-export-components -- recovery provider and consumers */
import {
  createContext,
  useContext,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Link } from 'react-router';
import { useChatPanel } from '@nocobase/app-plugin-agents/client/chat';
import {
  IntakeDraftProvider,
  emptyIntakeDraft,
  useIntakeDraft,
} from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '@/components/ui/button';

interface Handoff {
  readonly conversationId: string;
  readonly returnTo: string;
}
interface Recovery {
  readonly handoff: Handoff | null;
  readonly setHandoff: (value: Handoff | null) => void;
  readonly agentId: string | null;
  readonly setAgentId: (value: string | null) => void;
}
const RecoveryContext = createContext<Recovery | null>(null);
export const useIntakeRecovery = (): Recovery | null =>
  useContext(RecoveryContext);
export function IntakeRecoveryProvider({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  const [handoff, setHandoff] = useState<Handoff | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  return (
    <RecoveryContext.Provider
      value={{ handoff, setHandoff, agentId, setAgentId }}
    >
      <IntakeDraftProvider>{children}</IntakeDraftProvider>
    </RecoveryContext.Provider>
  );
}

/** A manual return to the retained source; no reply text is interpreted and no request is retried. */
export function IntakeReturn({
  conversationId,
}: {
  readonly conversationId: string;
}): ReactElement | null {
  const recovery = useIntakeRecovery();
  const panel = useChatPanel();
  const { t } = useTranslation();
  const [, setDraft] = useIntakeDraft();
  if (recovery?.handoff?.conversationId !== conversationId) return null;
  return (
    <div
      className='flex flex-wrap items-center gap-2 rounded-md border p-3'
      data-testid='intake-return'
    >
      <span className='text-sm text-muted-foreground'>
        {t('pmChat.intake.retained')}
      </span>
      <Button
        variant='outline'
        size='sm'
        render={<Link to={recovery.handoff.returnTo} />}
        onClick={() => panel.closeChat()}
      >
        {t('pmChat.intake.returnToEdit')}
      </Button>
      <Button
        variant='ghost'
        size='sm'
        onClick={() => {
          setDraft(emptyIntakeDraft());
          recovery.setHandoff(null);
          recovery.setAgentId(null);
        }}
      >
        {t('pmChat.intake.clearDraft')}
      </Button>
    </div>
  );
}
