/** The full-page view of a conversation (`pages/chat`, route `chat`), where the home page and the chat panel open one. */
export function conversationPath(conversationId: string): string {
  return `/chat/${encodeURIComponent(conversationId)}`;
}
