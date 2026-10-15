import type { LocaleResource } from '@nocobase/i18n';

// The application's own server-side wording; most strings the server produces belong to a plugin's namespace. Use
// `overrides` to reword a plugin's.
const enUS = {
  'keyScopes.members.title': 'Members and roles',
  'keyScopes.members.description':
    'Read: see the members and roles. Read and write: also invite and give roles. Admin: also define roles.',
  'keyScopes.reports.title': 'Reports',
  'keyScopes.reports.description':
    'Read the team dashboard, the metrics and the usage of agent runs.',
  'keyScopes.knowledge.title': 'Knowledge',
  'keyScopes.knowledge.description':
    'Read the knowledge base; propose changes; edit it and open the system knowledge page.',
  'keyScopes.presets.readOnly.title': 'Read only',
  'keyScopes.presets.readOnly.description': 'Read everything you can read.',

  // The last line of a delivery comment about the user manual, which the agent's brief asks for in the
  // installation's language (`server/knowledge/brief.ts`); `<slug>` stays for the agent to fill in.
  knowledge: {
    manual: {
      updated: 'Manual: updated <slug>, <slug>',
      none: 'Manual: no impact',
    },
  },
  // The 软件开发 (software) template's owner notices, worded in the default language for the notification body; the
  // browser words them from the client locales (`studioAgents.templateMessages`).
  // The title of the issue an agent connects a repository's CI in, stored in the installation's language
  // (`server/builds/ci-provider.ts`).
  ci: {
    taskTitle: 'Set up deployment: {{repo}}',
  },
  studioAgents: {
    templateMessages: {
      inReview:
        'Review the change and merge its pull request: the issue moves to Done once it is merged (check any required checklist items first). Or move it back to In progress with a comment.',
    },
  },
  navigation: {
    config: 'Settings',
  },
  roles: {
    admin: 'Admin',
    contributor: 'Member',
    owner: 'Owner',
    related: {
      knowledgeSeen: 'System and projects I can see',
      knowledgeSeenHint:
        'The system knowledge, and the spaces of projects I can see',
      knowledgeLed: 'Projects I lead',
      knowledgeLedHint:
        'The spaces of projects I lead; the system knowledge needs All',
      appsSeen: 'Ones I created or in projects I can see',
      appsSeenHint:
        'Apps I created, Apps linked to projects I can see, and previews of issues I can see',
      appsLed: 'Ones I created or in projects I lead',
      appsLedHint:
        'Apps I created, Apps linked to projects I lead, and previews of issues I can edit',
    },
    capabilities: {
      apiKeys: {
        read: 'See the organization’s API keys',
        manage:
          'Create, change, rotate and delete the organization’s API keys, within one’s own permissions',
      },
      git: {
        read: 'See the connections to code hosts',
        manage: 'Add, change and remove connections to code hosts',
      },
      personalApiKeys: {
        create: 'Create API keys of one’s own',
      },
      knowledgeSearch: {
        read: 'See how the knowledge base is searched',
        manage:
          'Choose the knowledge base’s embedding, rerank and context models and its thresholds',
      },
    },
    items: {
      apiKeys: 'API keys',
      git: 'Git connections',
      knowledgeSearch: 'Knowledge search',
      personalApiKeys: 'Personal API keys',
    },
  },
};

export type AppServerResource = LocaleResource<typeof enUS>;

export default enUS;
