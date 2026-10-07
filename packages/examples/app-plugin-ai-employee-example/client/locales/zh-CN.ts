import type { AiEmployeeExampleResource } from './en-US.js';

const zhCN: AiEmployeeExampleResource = {
  navigation: {
    tasks: 'AI 员工任务',
  },
  fallback: {
    title: 'AI 员工任务',
    description:
      '这是插件自带的兜底页面。任务页面本身是应用拥有的源码：安装下面的 Registry 条目后，应用会用它替换本页面。',
    stepsTitle: '安装应用拥有的界面',
    chatStep:
      '把 AI 员工插件的 nocobase-ai 条目安装到 client/extensions/nocobase-ai，并在应用布局中挂载全局 AI 入口。',
    pageStep:
      '把本插件的 tasks-page 条目安装到 client/extensions/nocobase-ai-employee-example-tasks-page，它的 extension.ts 会替换本页面。',
    employeeTitle: '本插件注册的内容',
    employee:
      '服务端注册了 AI 员工“{{employee}}”和只读工具“{{tool}}”，任务页面会用到它们。',
  },
  tasksPage: {
    title: 'AI 员工任务',
    description:
      'AI 员工针对你眼前记录执行的预设请求。点击工单标题旁的员工打开该工单的任务，或用按钮发起队列分诊。',
    triage: '分诊队列',
    queue: '工单队列',
    ask: '问问 {{name}}',
    employeeUnavailable:
      '你无法使用 AI 员工“{{employee}}”。请确认服务端已注册示例插件，并在 设置 › AI 中启用了该员工。',
    requester: '提交方',
    created: '创建时间',
    status: {
      open: '待处理',
      pending: '等待回复',
    },
    priority: {
      high: '高',
      normal: '普通',
      low: '低',
    },
    howTitle: '任务如何运行',
    howDescription:
      '每个任务都带有用户消息、本次运行的指令以及可调用的工具。全局 AI 入口会以任务指定的员工打开，并把工单作为工作上下文。',
    modes: {
      autoSend:
        '选择后立即发送。员工会先用插件提供的工具读取工单的内部记录再回答。',
      fillComposer: '只填入输入框而不发送，你可以补充信息后再发送。',
      programmatic:
        '由页面按钮通过全局对话控制器发起，队列中的所有工单都作为工作上下文。',
    },
    tasks: {
      analyze: {
        title: '分析这个工单',
        message: '分析工单 {{id}}，并给出下一步建议。',
      },
      draftReply: {
        title: '起草回复',
        message: '就工单 {{id}} 起草一封给 {{requester}} 的回复。',
      },
      triage: {
        title: '分诊队列',
        message: '按紧急程度给待处理工单排序，并告诉我先处理哪一个。',
      },
    },
  },
};

export default zhCN;
