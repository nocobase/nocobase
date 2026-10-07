/**
 * Links that open the chat panel (`chatLinkRoutes`): the base path opens the history, `<base>/new` a new conversation
 * and `<base>/:conversationId` that conversation. They are not pages: they open the chat panel there, then the URL goes
 * back to the page the person came from, or to the landing page when the link opened the application.
 */
import { useEffect, useRef, type ReactElement } from 'react';
import { useNavigate, useParams } from 'react-router';

import { useChatPanel } from './provider.js';

export default function ChatRedirect(): ReactElement | null {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { available, openChat } = useChatPanel();
  const handledRef = useRef(false);

  useEffect(() => {
    if (!available || handledRef.current) return;
    handledRef.current = true;
    if (conversationId === undefined) openChat({ view: 'history' });
    else
      openChat({
        view: 'chat',
        conversationId: conversationId === 'new' ? null : conversationId,
      });
    // React Router numbers its history entries: above 0 the person navigated here inside the application.
    const index = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (index > 0) void navigate(-1);
    else void navigate('/', { replace: true });
  }, [available, conversationId, openChat, navigate]);

  return null;
}
