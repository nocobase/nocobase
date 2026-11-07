/**
 * The static capability catalog shared by the capability guide and the application home page. It holds only what is
 * the same in every language: ids, groups, documentation paths, related entries and the developer reference. Titles,
 * descriptions and prompts live in `./content/<locale>.ts`, typed by `GuideContent` against the ids declared here, so a
 * language file that misses a capability or a prompt does not compile.
 */

export const CAPABILITY_GROUP_IDS = [
  'access',
  'data',
  'process',
  'messages',
  'experience',
  'ai',
] as const;

export type CapabilityGroupId = (typeof CAPABILITY_GROUP_IDS)[number];

/** What a builder needs before the agent can use a capability. */
export type CapabilityPrerequisite =
  /** Registered in the default template; nothing to install. */
  | 'builtIn'
  /** Registered, but needs a provider or an account configured first. */
  | 'config'
  /** Needs a plugin added to the application. */
  | 'plugin'
  /**
   * No runtime package provides it: the agent builds it for the business, following a Skill or the documentation.
   */
  | 'agentBuilt'
  /** Needs a commercial plugin and its license. */
  | 'commercial';

export interface CapabilityReference {
  /** Packages the agent wires in. */
  readonly packages: readonly string[];
  /** Skills the agent reads for this capability. */
  readonly skills: readonly string[];
}

export interface GuideCapability {
  readonly id: CapabilityId;
  readonly group: CapabilityGroupId;
  /** Path on the documentation site, without the language prefix. */
  readonly docs: string;
  /** Prompt ids, in display order; their wording is in the content files. */
  readonly prompts: readonly string[];
  readonly related: readonly CapabilityId[];
  readonly prerequisite: CapabilityPrerequisite;
  /** App-relative path of a runnable demonstration in the Examples template. */
  readonly demo?: string;
  /** Shown on the home page. */
  readonly featured?: boolean;
  readonly reference: CapabilityReference;
}

/**
 * Every capability's prompt ids, in display order. The ids type the content files: a language that misses a
 * capability or one of its prompts does not compile.
 */
export const CAPABILITY_PROMPTS = {
  auth: ['disableSignUp', 'companySso', 'apiKeys'],
  authorization: ['jobs', 'dataScopes', 'restrictions'],
  dataSources: ['postgres', 'externalDatabase'],
  file: ['attachments', 'avatar'],
  templatePrint: ['orderPdf'],
  workflow: ['stages', 'backgroundExport', 'history'],
  approval: ['multiLevel', 'handover'],
  taskCenter: ['myTasks', 'approvals'],
  notification: ['inApp', 'email'],
  mail: ['providers', 'mailCenter', 'correspondence'],
  scheduler: ['reminder', 'weeklyReport'],
  theme: ['changeTheme', 'newTheme'],
  i18n: ['addLanguage', 'defaultLanguage'],
  aiEmployee: ['assistant'],
  aiKnowledgeBase: ['policies'],
} as const;

export type CapabilityId = keyof typeof CAPABILITY_PROMPTS;

/** The prompt ids one capability declares. */
export type PromptIdOf<K extends CapabilityId> =
  (typeof CAPABILITY_PROMPTS)[K][number];

/** In the order of the documentation's Capabilities chapter within each group. */
export const CAPABILITIES: readonly GuideCapability[] = [
  {
    id: 'auth',
    group: 'access',
    docs: '/capabilities/auth/',
    prompts: CAPABILITY_PROMPTS.auth,
    related: ['authorization'],
    prerequisite: 'builtIn',
    reference: {
      packages: [
        '@nocobase/app-plugin-authentication',
        '@nocobase/app-plugin-users',
        '@nocobase/app-plugin-api-keys',
      ],
      skills: [
        'nocobase-app-plugin-authentication',
        'nocobase-app-plugin-users',
        'nocobase-app-plugin-api-keys',
      ],
    },
  },
  {
    id: 'authorization',
    group: 'access',
    docs: '/capabilities/authorization/',
    prompts: CAPABILITY_PROMPTS.authorization,
    related: ['auth', 'workflow'],
    prerequisite: 'builtIn',
    featured: true,
    demo: '/authorization-example',
    reference: {
      packages: [
        '@nocobase/app-plugin-authorization',
        '@nocobase/app-plugin-authz-default-access',
        '@nocobase/app-plugin-authz-sharing-rules',
        '@nocobase/app-plugin-authz-restriction-rules',
      ],
      skills: ['nocobase-app-plugin-authorization'],
    },
  },
  {
    id: 'dataSources',
    group: 'data',
    docs: '/capabilities/data-sources',
    prompts: CAPABILITY_PROMPTS.dataSources,
    related: ['authorization'],
    prerequisite: 'builtIn',
    reference: {
      packages: ['@nocobase/db', '@nocobase/app-plugin-database-explorer'],
      skills: ['nocobase-db', 'nocobase-app-plugin-database-explorer'],
    },
  },
  {
    id: 'file',
    group: 'data',
    docs: '/capabilities/file',
    prompts: CAPABILITY_PROMPTS.file,
    related: ['templatePrint', 'authorization'],
    prerequisite: 'builtIn',
    featured: true,
    demo: '/file-repository',
    reference: {
      packages: ['@nocobase/app-plugin-file', '@nocobase/drive'],
      skills: ['nocobase-app-plugin-file', 'nocobase-drive'],
    },
  },
  {
    id: 'templatePrint',
    group: 'data',
    docs: '/capabilities/template-print/',
    prompts: CAPABILITY_PROMPTS.templatePrint,
    related: ['file'],
    prerequisite: 'agentBuilt',
    demo: '/template-print-example',
    reference: {
      packages: ['@nocobase/app-plugin-template-print'],
      skills: ['nocobase-app-plugin-template-print'],
    },
  },
  {
    id: 'workflow',
    group: 'process',
    docs: '/capabilities/workflow/',
    prompts: CAPABILITY_PROMPTS.workflow,
    related: ['approval', 'notification', 'scheduler'],
    prerequisite: 'builtIn',
    featured: true,
    demo: '/lifecycle-example/tickets',
    reference: {
      packages: [
        '@nocobase/lifecycle',
        '@nocobase/jobs',
        '@nocobase/queue',
        '@nocobase/concurrency',
      ],
      skills: [],
    },
  },
  {
    id: 'approval',
    group: 'process',
    docs: '/capabilities/approval/',
    prompts: CAPABILITY_PROMPTS.approval,
    related: ['workflow', 'taskCenter', 'notification'],
    prerequisite: 'commercial',
    reference: {
      packages: ['@nocobase/app-plugin-approval'],
      skills: [],
    },
  },
  {
    id: 'taskCenter',
    group: 'process',
    docs: '/capabilities/task-center',
    prompts: CAPABILITY_PROMPTS.taskCenter,
    related: ['approval', 'notification'],
    prerequisite: 'agentBuilt',
    reference: { packages: [], skills: [] },
  },
  {
    id: 'notification',
    group: 'messages',
    docs: '/capabilities/notification',
    prompts: CAPABILITY_PROMPTS.notification,
    related: ['workflow', 'scheduler', 'mail'],
    prerequisite: 'builtIn',
    featured: true,
    demo: '/notification-example',
    reference: {
      packages: [
        '@nocobase/app-plugin-notification',
        '@nocobase/app-plugin-notification-in-app',
        '@nocobase/app-plugin-notification-providers',
        '@nocobase/realtime',
      ],
      skills: [
        'nocobase-app-plugin-notification',
        'nocobase-app-plugin-notification-in-app',
        'nocobase-realtime',
      ],
    },
  },
  {
    id: 'mail',
    group: 'messages',
    docs: '/capabilities/mail/',
    prompts: CAPABILITY_PROMPTS.mail,
    related: ['notification'],
    prerequisite: 'config',
    demo: '/mail-example',
    reference: {
      packages: ['@nocobase/app-plugin-mail'],
      skills: ['nocobase-app-plugin-mail'],
    },
  },
  {
    id: 'scheduler',
    group: 'messages',
    docs: '/capabilities/scheduler',
    prompts: CAPABILITY_PROMPTS.scheduler,
    related: ['notification', 'workflow'],
    prerequisite: 'builtIn',
    featured: true,
    demo: '/jobs-example/jobs',
    reference: {
      packages: ['@nocobase/app-plugin-scheduler', '@nocobase/jobs'],
      skills: ['nocobase-app-plugin-scheduler'],
    },
  },
  {
    id: 'theme',
    group: 'experience',
    docs: '/capabilities/theme',
    prompts: CAPABILITY_PROMPTS.theme,
    related: ['i18n'],
    prerequisite: 'builtIn',
    reference: { packages: [], skills: ['nocobase-app-development'] },
  },
  {
    id: 'i18n',
    group: 'experience',
    docs: '/capabilities/i18n',
    prompts: CAPABILITY_PROMPTS.i18n,
    related: ['theme'],
    prerequisite: 'builtIn',
    reference: {
      packages: ['@nocobase/i18n', '@nocobase/app-plugin-i18n'],
      skills: ['nocobase-app-plugin-i18n'],
    },
  },
  {
    id: 'aiEmployee',
    group: 'ai',
    docs: '/capabilities/ai-employee/',
    prompts: CAPABILITY_PROMPTS.aiEmployee,
    related: ['aiKnowledgeBase', 'authorization'],
    prerequisite: 'plugin',
    featured: true,
    reference: {
      packages: [
        '@nocobase/app-plugin-agents',
        '@nocobase/app-plugin-agent-sessions',
      ],
      skills: ['nocobase-app-plugin-agents'],
    },
  },
  {
    id: 'aiKnowledgeBase',
    group: 'ai',
    docs: '/capabilities/ai-knowledge-base/',
    prompts: CAPABILITY_PROMPTS.aiKnowledgeBase,
    related: ['aiEmployee', 'file'],
    prerequisite: 'plugin',
    reference: { packages: ['@nocobase/app-plugin-knowledge'], skills: [] },
  },
];

export function findCapability(id: string): GuideCapability | undefined {
  return CAPABILITIES.find((capability) => capability.id === id);
}

export const FEATURED_CAPABILITIES: readonly GuideCapability[] =
  CAPABILITIES.filter((capability) => capability.featured);

/** App-relative path of the guide, and of one capability in it. */
export const CAPABILITY_GUIDE_PATH = '/capabilities';
export function capabilityPath(id: string): string {
  return `${CAPABILITY_GUIDE_PATH}/${id}`;
}

/** Absolute documentation URL for a page path, in the closest documented language. */
export function docsUrl(path: string, locale: string): string {
  const prefix = locale.startsWith('zh') ? '/zh-CN' : '';
  return `https://docs.nocobase.com${prefix}${path}`;
}
