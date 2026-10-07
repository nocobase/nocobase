import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  authorization: {
    section: 'AI',
    items: {
      employees: 'AI Employees',
      skills: 'Skills',
      tools: 'Tools',
      llmServices: 'LLM services',
      mcpServers: 'MCP services',
      usage: 'Usage statistics',
      conversations: 'Conversations',
    },
    actions: { read: 'View', manage: 'Manage' },
  },
};

export type AIEmployeeServerResource = LocaleResource<typeof enUS>;
export default enUS;
