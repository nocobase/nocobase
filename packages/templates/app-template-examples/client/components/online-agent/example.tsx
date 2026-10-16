import { useChatPanel } from '@nocobase/app-plugin-agents/client/chat';
import { useTranslation } from '@nocobase/i18n/client';
import { BotMessageSquare, ArrowUpRight } from 'lucide-react';
import type { ReactElement } from 'react';
import { Button } from '#components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '#components/ui/card';
import { ModelsLink } from './models-link.js';

export function OnlineAgentExample(): ReactElement {
  const panel = useChatPanel();
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <BotMessageSquare className='size-5 text-primary' aria-hidden='true' />
        <CardTitle>
          <h2>{t('examples.onlineAgent.title')}</h2>
        </CardTitle>
        <CardDescription>
          {t('examples.onlineAgent.description')}
        </CardDescription>
      </CardHeader>
      <CardFooter className='flex flex-wrap gap-2'>
        <Button disabled={!panel.available} onClick={() => panel.openChat()}>
          {t('examples.onlineAgent.open')}
          <ArrowUpRight data-icon='inline-end' />
        </Button>
        {panel.available ? <ModelsLink /> : null}
      </CardFooter>
    </Card>
  );
}
