/**
 * `/chat/:conversationId` (route `agentChat`): one conversation as a page of its own, in the panel's lazy chunk.
 * Starting a new conversation from it goes back to the home page, where the panel offers one. Replace it with the application's own page through `routeComponentOverrides`
 * (`@nocobase/app-plugin-agents:agentChat`).
 */
import type { ReactElement } from 'react';
import { useParams } from 'react-router';

import { ChatConversationPage } from '../../panel/index.js';

export default function AgentChatPage(): ReactElement {
  const { conversationId = '' } = useParams();
  return (
    <ChatConversationPage
      conversationId={conversationId}
      newConversationPath='/'
    />
  );
}
