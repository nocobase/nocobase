import { AskAgentButton } from '@nocobase/app-plugin-agents/client';
import { useChatPanel } from '@nocobase/app-plugin-agents/client/chat';
import { useTranslation } from '@nocobase/i18n/client';
import { BotMessageSquare } from 'lucide-react';
import type { ReactElement } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '#components/ui/card';
import { ModelsLink } from './models-link.js';

/** The home page's Agent card: opens the panel `@nocobase/app-plugin-agents` puts beside the content. */
export function AgentExample(): ReactElement {
  const panel = useChatPanel();
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <BotMessageSquare className='size-5 text-primary' aria-hidden='true' />
        <CardTitle>
          <h2>{t('examples.agent.title')}</h2>
        </CardTitle>
        <CardDescription>{t('examples.agent.description')}</CardDescription>
      </CardHeader>
      {panel.available ? (
        <CardFooter className='flex flex-wrap gap-2'>
          <AskAgentButton variant='default' size='default'>
            {t('examples.agent.open')}
          </AskAgentButton>
          <ModelsLink />
        </CardFooter>
      ) : null}
    </Card>
  );
}
