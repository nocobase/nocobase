import authUi from '../extensions/nocobase-auth-ui/locales/zh-CN.js';
import type { AppResource } from './en-US.js';

const zhCN: AppResource = {
  ...authUi,
  'auth.welcome': '欢迎回来',
  'auth.loginDescription': '使用用户名或邮箱和密码登录。',
  'auth.registerTitle': '创建账户',
  'auth.registerDescription': '创建账户以开始使用。',
  'auth.forgotTitle': '忘记密码',
  'auth.forgotDescription': '输入邮箱，如果账户存在，我们将发送重置链接。',
  'auth.resetDescription': '为账户设置新密码。',
  'status.loading': '加载中',
  'status.loadingPage': '正在加载页面',
  'status.loadingSettings': '正在加载设置',
  'status.loadingDev': '正在加载开发工具',
  'status.denied': '无权访问',
  'status.pageFailed': '无法加载页面',
  'status.retry': '重试',
  'navigation.brandHome': 'NocoBase 首页',
  'navigation.brandApps': 'NocoBase 应用',
  'routeOverlay.close': '关闭',
  'status.deniedDescription': '你没有访问 {{label}} 的权限。',
  'status.routeFailedDescription':
    '无法加载 {{packageName}} 的路由 {{label}}。',
  shell: {
    workspace: 'AI 应用工作区',
    buildFreely: 'AI 自由构建。',
    reliability: '<brand>NocoBase</brand> 保障可靠。',
  },
  surface: {
    backToApp: '返回应用',
    loading: '正在加载{{title}}',
    navigation: '{{title}}导航',
    page: '{{title}}页面',
  },
  settings: {
    title: '设置',
    emptyTitle: '暂无可用设置',
    emptyDescription: '没有已启用的插件提供你有权访问的设置页面。',
  },
  dev: {
    componentExamples: '组件示例',
    title: '开发工具',
    emptyTitle: '暂无可用开发工具',
    emptyDescription: '没有已启用的插件提供你有权访问的开发页面。',
  },
  home: {
    title: '开始构建你的应用',
    description: '向 AI 助手描述你的需求，逐步构建页面、数据模型和业务流程。',
  },

  appearance: {
    title: '外观',
    mode: '颜色模式',
    preset: '主题',
    light: '浅色',
    dark: '深色',
    system: '跟随系统',
    themes: { default: '宽松', compact: '紧凑' },
  },
  app: {
    title: 'NocoBase',
  },
  actions: {
    close: '关闭',
    save: '保存',
    cancel: '取消',
    confirm: '确认',
    language: '语言',
  },
  notices: {
    serverLocaleFallback: '服务端不支持该语言，服务端内容已回落为英文。',
    languageChangeFailed: '未能完成语言切换，请重试。',
  },
  account: {
    signOutFailed: '退出登录失败，请重试。',
    openMenu: '打开账户菜单',
    fallback: '账户',
    signOut: '退出登录',
    signingOut: '正在退出…',
  },
  navigation: {
    home: '首页',
    open: '打开导航',
    close: '关闭导航',
    expand: '展开导航',
    collapse: '收起导航',
    label: '应用导航',
    breadcrumb: '面包屑',
    back: '返回',
  },
  dataTable: {
    noResults: '暂无数据。',
    sortAscending: '升序',
    sortDescending: '降序',
    hideColumn: '隐藏',
    view: '视图',
    toggleColumns: '显示列',
    selectedCount: '已选择 {{selected}} / {{total}} 行。',
    rowsPerPage: '每页行数',
    pageOf: '第 {{page}} 页，共 {{pageCount}} 页',
    firstPage: '第一页',
    previousPage: '上一页',
    nextPage: '下一页',
    lastPage: '最后一页',
  },
  datePicker: {
    placeholder: '选择日期',
    rangePlaceholder: '选择日期范围',
  },
};

export default zhCN;
