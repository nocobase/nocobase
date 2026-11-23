/**
 * `/chat/:conversationId` (route `agentChat`): one conversation as a page of its own, in the panel's lazy chunk.
 * Starting a new conversation opens a draft on the My conversations page. Replace it with the application's own page through `routeComponentOverrides`
 * (`@nocobase/app-plugin-agents:agentChat`).
 */
import { useContext, type ReactElement } from 'react';
import { AgentsOptionsContext } from '../../shell/options.js';
import { useParams } from 'react-router';

import { ChatConversationPage } from '../../panel/index.js';

export default function AgentChatPage(): ReactElement {
  const { conversationId = '' } = useParams();
  const { chatPath } = useContext(AgentsOptionsContext);
  return (
    <ChatConversationPage
      conversationId={conversationId}
      newConversationPath={chatPath + '?draft=1'}
    />
  );
}
