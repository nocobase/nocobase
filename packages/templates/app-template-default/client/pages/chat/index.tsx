import type { ReactElement } from 'react';
import { useParams } from 'react-router';
import { ChatConversationPage } from '#extensions/nocobase-agent-chat/conversation-page';
export default function ConversationPage(): ReactElement {
  const { conversationId } = useParams();
  return (
    <ChatConversationPage
      conversationId={conversationId!}
      newConversationPath='/'
    />
  );
}
