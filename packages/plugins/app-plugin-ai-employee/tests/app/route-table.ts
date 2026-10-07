import type { AIRouteAccess } from '../../server/route/index.js';

/**
 * Every route the plugin registers under `/api`, and who may call it: `signedIn` any signed-in user, otherwise a user
 * granted any one of the listed AI settings permissions. The route tests compare the router against this table, so a
 * new route has to be added here with the permission it deliberately requires.
 */
export const AI_ROUTES: ReadonlyArray<
  readonly [method: string, path: string, access: AIRouteAccess]
> = [
  ['GET', '/aiEmployees/roster', 'signedIn'],
  ['GET', '/aiEmployees', ['ai.employees:read', 'ai.conversations:read']],
  ['GET', '/aiEmployees/:username', ['ai.employees:read']],
  ['PATCH', '/aiEmployees/:username', ['ai.employees:manage']],
  ['PUT', '/aiEmployees/:username/userPrompt', 'signedIn'],

  ['GET', '/aiEmployee/managedConversations', ['ai.conversations:read']],
  [
    'GET',
    '/aiEmployee/managedConversations/:sessionId/messages',
    ['ai.conversations:read'],
  ],
  ['GET', '/aiEmployee/conversationOwners', ['ai.conversations:read']],
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

  ['GET', '/aiEmployee/tools', ['ai.tools:read', 'ai.employees:read']],
  ['GET', '/aiEmployee/tools/:name', ['ai.tools:read']],

  ['GET', '/aiEmployee/skills', ['ai.skills:read', 'ai.employees:read']],
  ['GET', '/aiEmployee/skills/:name', ['ai.skills:read']],

  ['GET', '/aiEmployee/models', 'signedIn'],
  ['GET', '/aiEmployee/llmProviders', 'signedIn'],
  ['GET', '/aiEmployee/llmServices', ['ai.llmServices:read']],
  ['POST', '/aiEmployee/llmServices/:name/enable', ['ai.llmServices:manage']],
  ['POST', '/aiEmployee/llmServices/:name/disable', ['ai.llmServices:manage']],
  [
    'PUT',
    '/aiEmployee/llmServices/:name/enabledModels',
    ['ai.llmServices:manage'],
  ],
  [
    'GET',
    '/aiEmployee/llmServices/:name/providerModels',
    ['ai.llmServices:manage'],
  ],

  ['GET', '/aiEmployee/mcpServers', ['ai.mcpServers:read']],
  ['GET', '/aiEmployee/mcpServers/tools', ['ai.mcpServers:read']],
  ['POST', '/aiEmployee/mcpServers/:name/enable', ['ai.mcpServers:manage']],
  ['POST', '/aiEmployee/mcpServers/:name/disable', ['ai.mcpServers:manage']],
  [
    'PATCH',
    '/aiEmployee/mcpServers/:name/tools/:toolName',
    ['ai.mcpServers:manage'],
  ],

  ['GET', '/aiEmployee/usage/summary', ['ai.usage:read']],
  ['GET', '/aiEmployee/usage/series', ['ai.usage:read']],
  ['GET', '/aiEmployee/usage/breakdown', ['ai.usage:read']],
  ['GET', '/aiEmployee/usage/filterOptions', ['ai.usage:read']],
];

/** A concrete URL for a route pattern, with every path parameter filled in. */
export function concretePath(path: string): string {
  return path.replace(/:(\w+)/g, (_match, name: string) => `any-${name}`);
}
