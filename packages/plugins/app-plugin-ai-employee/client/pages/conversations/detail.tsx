import type { ReactElement } from 'react';
import { useOutletContext, useParams } from 'react-router';
import { ConversationDetailsDrawer } from '../../components/conversation-details-drawer.js';
import type { ManagedConversation } from '../../conversation-center-service.js';

export default function ConversationDetailPage(): ReactElement {
  const { sessionId = '' } = useParams<'sessionId'>();
  const rows = useOutletContext<ManagedConversation[] | undefined>();
  return (
    <ConversationDetailsDrawer
      key={sessionId}
      sessionId={sessionId}
      summary={rows?.find((row) => row.sessionId === sessionId)}
    />
  );
}
