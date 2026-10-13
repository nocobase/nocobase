/**
 * The wording of the person's settings (`studio/client/account`, `pages/account`), under `accountSettings` and
 * `preferences` in the application's locales (`client/locales/en-US.ts` and `zh-CN.ts` spread these in).
 */
export const accountSettingsEnUS = {
  title: 'Account settings',
  description: 'Your profile, sign-in, preferences and API keys.',
  menu: 'Account settings',
  categoriesLabel: 'Account settings categories',
  groups: { account: 'Account', integrations: 'Integrations' },
  categories: {
    profile: {
      title: 'Profile',
      description: 'Your name and username as others see them.',
    },
    security: {
      title: 'Account and security',
      description: 'Your password. Signed-in devices will be listed here.',
    },
    preferences: {
      title: 'Preferences',
      description:
        'Language, theme, sounds and your default chat agent. They are saved with your account and follow you to every browser.',
    },
    apiKeys: { title: 'API keys' },
    git: {
      title: 'Git',
      description:
        'Once you connect your own GitHub account, pull requests your agents open and merges you make in Studio are done as you; until then, the workspace’s connection is used.',
    },
  },
};

export const preferencesEnUS = {
  display: {
    title: 'Display',
    description: 'How Studio looks and which language it speaks.',
  },
  language: 'Language',
  sounds: {
    title: 'Sounds',
    description: 'What Studio plays to get your attention.',
  },
  chime: 'Inbox sound reminder',
  agents: {
    title: 'Agents',
    description: 'Who answers when you start a conversation.',
  },
};

export const accountSettingsZhCN: typeof accountSettingsEnUS = {
  title: '个人设置',
  description: '你的资料、登录、偏好和 API 密钥。',
  menu: '个人设置',
  categoriesLabel: '个人设置分类',
  groups: { account: '账号', integrations: '集成' },
  categories: {
    profile: {
      title: '个人资料',
      description: '其他人看到的你的姓名和用户名。',
    },
    security: {
      title: '账号与安全',
      description: '你的密码。以后这里还会列出已登录的设备。',
    },
    preferences: {
      title: '偏好设置',
      description:
        '语言、主题、提示音和默认对话 Agent。它们随账号保存，在任何浏览器里都一样。',
    },
    apiKeys: { title: 'API 密钥' },
    git: {
      title: 'Git',
      description:
        '连接你自己的 GitHub 账号后，Agent 开的 PR 和你在 Studio 里的合并都以你的身份进行；未连接时使用工作区的连接。',
    },
  },
};

export const preferencesZhCN: typeof preferencesEnUS = {
  display: {
    title: '显示',
    description: 'Studio 的外观和界面语言。',
  },
  language: '语言',
  sounds: {
    title: '声音',
    description: 'Studio 用来提醒你的声音。',
  },
  chime: '收件箱提示音',
  agents: {
    title: 'Agent',
    description: '你发起对话时由谁来回答。',
  },
};
