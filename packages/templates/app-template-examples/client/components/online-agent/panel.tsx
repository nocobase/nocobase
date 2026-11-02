import { useChatPanel } from '@nocobase/app-plugin-agents/client/chat';
import { useTranslation } from '@nocobase/i18n/client';
import { BrainCircuit } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { ChatPanel } from '#extensions/nocobase-agent-chat/chat-panel';
import { LoadError } from '#extensions/nocobase-agent-chat/chat-ui';
import { Alert, AlertDescription, AlertTitle } from '#components/ui/alert';
import { Spinner } from '#components/ui/spinner';
import { ModelsLink } from './models-link.js';
import { useModelCatalog } from './use-model-catalog.js';

export default function OnlineAgentPanel(): ReactElement {
  const { open } = useChatPanel();
  const { t } = useTranslation();
  const catalog = useModelCatalog(open);
  let notice: ReactNode = null;
  if (catalog.phase === 'loading') {
    notice = (
      <p
        role='status'
        className='flex items-center gap-2 text-sm text-muted-foreground'
      >
        <Spinner />
        {t('onlineAgent.checkingModels')}
      </p>
    );
  } else if (catalog.phase === 'error') {
    notice = (
      <LoadError
        title={t('onlineAgent.catalogFailed')}
        error={catalog.error}
        onRetry={catalog.refresh}
      />
    );
  } else if (!catalog.canSend) {
    notice = (
      <Alert>
        <BrainCircuit />
        <AlertTitle>{t('onlineAgent.noModels.title')}</AlertTitle>
        <AlertDescription className='flex flex-col items-start gap-2'>
          <p>{t('onlineAgent.noModels.description')}</p>
          <ModelsLink explain />
        </AlertDescription>
      </Alert>
    );
  }
  return <ChatPanel inputAvailability={{ canSend: catalog.canSend, notice }} />;
}
