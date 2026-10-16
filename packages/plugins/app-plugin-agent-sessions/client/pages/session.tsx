/** `/agent-sessions/:sessionId`: one session. */
import type { ReactElement } from 'react';
import { Navigate, useParams } from 'react-router';

import { SessionView } from '../components/session-view.js';

export default function AgentSessionPage(): ReactElement {
  const { sessionId } = useParams();
  if (!sessionId) return <Navigate to='/agent-sessions' replace />;
  return <SessionView key={sessionId} sessionId={sessionId} />;
}
