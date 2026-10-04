/**
 * Every route the plugin registers under `/api`, and who may call it: `settings` needs the AI settings page,
 * `signedIn` any signed-in user. The route tests compare the router against this table, so a new route has to be added
 * here, deliberately placed in one group.
 */
export const AI_ROUTES: ReadonlyArray<
  readonly [method: string, path: string, access: 'settings' | 'signedIn']
> = [
  ['GET', '/aiEmployees/roster', 'signedIn'],
  ['GET', '/aiEmployees/templates', 'settings'],
  ['GET', '/aiEmployees', 'settings'],
  ['POST', '/aiEmployees', 'settings'],
  ['GET', '/aiEmployees/:username', 'settings'],
  ['PATCH', '/aiEmployees/:username', 'settings'],
  ['DELETE', '/aiEmployees/:username', 'settings'],
  ['PUT', '/aiEmployees/:username/userPrompt', 'signedIn'],

  ['GET', '/aiEmployee/managedConversations', 'settings'],
  ['GET', '/aiEmployee/managedConversations/:sessionId/messages', 'settings'],
  ['GET', '/aiEmployee/conversationOwners', 'settings'],
  ['GET', '/aiEmployee/conversations', 'signedIn'],
  ['POST', '/aiEmployee/conversations', 'signedIn'],
  ['GET', '/aiEmployee/conversations/unreadCount', 'signedIn'],
  ['GET', '/aiEmployee/conversations/:sessionId', 'signedIn'],
  ['PATCH', '/aiEmployee/conversations/:sessionId', 'signedIn'],
  ['DELETE', '/aiEmployee/conversations/:sessionId', 'signedIn'],
  ['PUT', '/aiEmployee/conversations/:sessionId/options', 'signedIn'],
  ['GET', '/aiEmployee/conversations/:sessionId/messages', 'signedIn'],
  ['POST', '/aiEmployee/conversations/:sessionId/markRead', 'signedIn'],
  ['POST', '/aiEmployee/conversations/:sessionId/abort', 'signedIn'],
  [
    'PUT',
    '/aiEmployee/conversations/:sessionId/messages/:messageId/toolCalls/:toolCallId/userDecision',
    'signedIn',
  ],
  [
    'PATCH',
    '/aiEmployee/conversations/:sessionId/messages/:messageId/toolCalls/:toolCallId',
    'signedIn',
  ],
  ['POST', '/aiEmployee/conversations/:sessionId/send', 'signedIn'],
  ['POST', '/aiEmployee/conversations/:sessionId/resend', 'signedIn'],
  ['POST', '/aiEmployee/conversations/:sessionId/resumeToolCall', 'signedIn'],
  ['POST', '/aiEmployee/conversations/:sessionId/resumeStream', 'signedIn'],

  ['POST', '/aiEmployee/files', 'signedIn'],
  ['GET', '/aiEmployee/files/:fileId/preview', 'signedIn'],

  ['GET', '/aiEmployee/tools', 'settings'],
  ['POST', '/aiEmployee/tools', 'settings'],
  ['GET', '/aiEmployee/tools/:name', 'settings'],
  ['PATCH', '/aiEmployee/tools/:name', 'settings'],
  ['DELETE', '/aiEmployee/tools/:name', 'settings'],

  ['GET', '/aiEmployee/skills', 'settings'],
  ['POST', '/aiEmployee/skills', 'settings'],
  ['GET', '/aiEmployee/skills/:name', 'settings'],
  ['PATCH', '/aiEmployee/skills/:name', 'settings'],
  ['DELETE', '/aiEmployee/skills/:name', 'settings'],

  ['GET', '/aiEmployee/models', 'signedIn'],
  ['GET', '/aiEmployee/llmProviders', 'signedIn'],
  ['GET', '/aiEmployee/llmServices', 'settings'],
  ['GET', '/aiEmployee/llmServices/:name', 'settings'],
  ['POST', '/aiEmployee/llmServices/:name/enable', 'settings'],
  ['POST', '/aiEmployee/llmServices/:name/disable', 'settings'],
  ['PUT', '/aiEmployee/llmServices/:name/enabledModels', 'settings'],
  ['GET', '/aiEmployee/llmServices/:name/providerModels', 'settings'],

  ['GET', '/aiEmployee/mcpServers', 'settings'],
  ['GET', '/aiEmployee/mcpServers/tools', 'settings'],
  ['POST', '/aiEmployee/mcpServers/testConnection', 'settings'],
  ['GET', '/aiEmployee/mcpServers/:name', 'settings'],
  ['POST', '/aiEmployee/mcpServers/:name/testConnection', 'settings'],
  ['POST', '/aiEmployee/mcpServers/:name/enable', 'settings'],
  ['POST', '/aiEmployee/mcpServers/:name/disable', 'settings'],
  ['PATCH', '/aiEmployee/mcpServers/:name/tools/:toolName', 'settings'],

  ['GET', '/aiEmployee/usage/summary', 'settings'],
  ['GET', '/aiEmployee/usage/series', 'settings'],
  ['GET', '/aiEmployee/usage/breakdown', 'settings'],
  ['GET', '/aiEmployee/usage/filterOptions', 'settings'],
];

/** A concrete URL for a route pattern, with every path parameter filled in. */
export function concretePath(path: string): string {
  return path.replace(/:(\w+)/g, (_match, name: string) => `any-${name}`);
}
