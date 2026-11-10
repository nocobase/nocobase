import type enUS from './i18n-overview-en-US.js';

const i18nOverview: typeof enUS = {
  statusTitle: '当前应用',
  current: '你的界面语言',
  clientDefault: '界面默认语言',
  serverDefault: '服务端默认语言',
  loading: '正在检查…',
  unknown: '无法确认',
  refresh: '刷新服务端语言',
  failed: '暂时无法读取服务端语言，下面仍可查看界面端的语言信息。',
  expired: '登录已过期，请重新登录后查看服务端语言信息。',
  forbidden: '你没有查看服务端语言信息的权限。',
  signIn: '重新登录',
  sourceNote:
    '这里展示运行时的生效值，无法据此判断默认语言来自 config.yml、环境变量还是应用默认值。',
  languageTitle: '可用语言',
  languageCount: '界面 {{client}} 种 · 服务端 {{server}} 种',
  clientCount: '界面 {{count}} 种 · 服务端语言暂时无法确认',
  browser: '界面',
  server: '服务端',
  supported: '已提供',
  unsupported: '未声明',
  empty: '前后端均未返回可用语言。',
  coverageNote:
    '声明了某种语言，不代表每个页面和插件都已翻译完整；缺少的翻译可能回退到英语。插件自带翻译，也不会自动把语言加入应用的切换菜单。',
  fallbackNote:
    '服务端未声明你当前使用的界面语言。同步语言时，服务端回复会回退到英语。',
  switchTitle: '切换你使用的语言',
  switchHint:
    '在右上角账号菜单中选择「语言」。这只修改你的语言偏好，不会修改应用默认语言；界面只有一种语言时，不显示切换菜单。',
  persistence:
    '接入用户偏好后，选择会跟随账号保存；否则保存在当前浏览器。应用也会同步服务端回复所使用的语言。',
  setupTitle: '增加或配置语言',
  add: {
    title: '增加一种语言',
    steps: {
      translate:
        '确定语言代码，例如 ja-JP。参照英文资源结构补充应用界面的翻译，保留翻译键、插值变量和复数规则。',
      declare:
        '在 client/locales/index.ts 声明对应语言的加载器。需要翻译服务端消息时，也要在 server/locales/index.ts 中补充翻译和声明，尽量保持前后端语言一致。',
      plugins:
        '检查应用使用的插件和公共组件，为缺失内容补充翻译或应用级文案覆盖，避免新语言下出现部分内容仍是英文的情况。',
      verify:
        '运行 pnpm nocobase locales check 和应用的类型检查。切换到新语言，检查菜单、页面、错误提示和通知；部署时重新构建并重启。',
    },
    prompt:
      '请帮我为当前 NocoBase 应用增加一种语言。\n\n目标语言和语言代码：【例如，日语 / ja-JP】。\n需要覆盖的业务页面：【说明范围】。\n\n请先阅读已安装的 nocobase-app-plugin-i18n Skill，检查前后端已有语言声明和插件翻译，保留现有语言、翻译键及定制文案。\n\n按需在应用的 client/locales 和 server/locales 中补充翻译与懒加载声明，正确处理插值、复数和命名空间；检查插件的翻译回退，必要时通过应用级覆盖补齐。不要尝试通过 config.yml 增加可选语言，也不要擅自修改默认语言。\n\n运行 pnpm nocobase locales check、类型检查及相关测试。切换语言，验证菜单、业务页面、服务端错误和按收件人语言发送的通知，并列出尚未翻译的内容。',
  },
  default: {
    title: '修改默认语言',
    steps: {
      check: '先确认目标语言已经在应用前后端的语言列表中声明，并具备所需翻译。',
      configure:
        '通过应用配置中的 i18n.defaultLocale 设置默认语言。APP_DEFAULT_LOCALE 环境变量可以覆盖该值，也需要检查部署环境。',
      verify:
        '运行 pnpm nocobase config check，然后重启应用。在本页核对前后端生效值，并使用没有保存语言偏好的账号或浏览器验证。',
      preference:
        '修改默认语言不会覆盖用户已保存的语言偏好。已经选择过语言的用户仍会使用自己的选择。',
    },
    prompt:
      '请帮我将当前 NocoBase 应用的默认语言调整为【语言代码，例如 zh-CN】。\n\n请先阅读已安装的 nocobase-app-plugin-i18n Skill，确认前后端语言声明均支持目标语言。如果翻译不完整，请列出缺项，不要把修改配置当成已经完成翻译。\n\n检查 i18n.defaultLocale、APP_DEFAULT_LOCALE 的环境映射和部署覆盖，只修改相关默认值，保留现有语言、其他配置和用户已保存的语言偏好。\n\n运行 pnpm nocobase config check，按需重启应用。使用没有保存语言偏好的账号或浏览器，验证前后端实际生效的默认语言，并说明仍存在的环境覆盖或翻译缺项。',
  },
  agentTab: '通过 Agent',
  manualTab: '手动步骤',
  promptHint:
    '替换括号中的需求，编辑后复制给开发 Agent。本页不会直接修改配置。',
  promptLabel: '可编辑的需求',
  copy: '复制需求',
  copied: '已复制',
  copyFailed: '复制失败，请选中上面的需求手动复制。',
  exampleHint:
    '以下仅为配置格式示例，不是当前应用配置的导出。目标语言必须已经声明。',
};

export default i18nOverview;
