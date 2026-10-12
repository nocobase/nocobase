/**
 * `/chat/:conversationId`: one conversation as a page of its own, inside the application's shell. A conversation started
 * from the chat composer lands here, and so do the chat composer's recent conversations and the chat panel's "Open full
 * screen". The agent-chat block renders it (`ChatConversationPage`, the panel's conversation view in its page form); a
 * new conversation goes back to the chat composer to pick the agent.
 */
import type { ReactElement } from 'react';
import { Navigate, useParams } from 'react-router';

import { ChatConversationPage } from '@/extensions/nocobase-agent-chat/conversation-page';

export default function ChatPage(): ReactElement {
  const { conversationId } = useParams();
  if (!conversationId) return <Navigate to='/chat' replace />;
  return (
    <ChatConversationPage
      conversationId={conversationId}
      newConversationPath='/chat'
    />
  );
}
