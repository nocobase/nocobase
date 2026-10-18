import type { AgentSessionsResource } from './en-US.js';

const zhCN: AgentSessionsResource = {
  errors: {
    promptNotFound: '会话中没有找到这条消息。',
    promptStarted: '消息已开始处理，无法撤回。',
    withdrawalUnsupported:
      '此消息由旧执行端接收，无法安全撤回。请升级命令行并重启电脑连接。',
    bridgeReplaced: '另一连接已登记这台电脑，请重启当前连接。',
    submissionConflict: '该提交 ID 已用于另一项请求。',
    discoveryFailed: '无法加载智能体设置。请检查此电脑上的智能体后重试。',
    authenticationRequired: '请先登录。',
    computerNotFound: '你的账号下没有这台电脑。',
    sessionNotFound: '没有找到这个会话，或者它不属于你。',
    computerOffline: '这台电脑离线。请在电脑上启动连接后再试。',
    agentUnavailable: '这台电脑不能运行这个 Agent。',
    directoryNotAllowed: '这台电脑只允许在它的连接设定的目录下运行会话。',
    sessionArchived: '会话已归档，请先恢复。',
    permissionRequestNotFound: '这个请求已经处理过，或者已经不在等待。',
    choiceNotFound: 'Agent 不提供这个选项或取值。',
    linkNotFound: '这个会话没有关联这一项，或者不能从会话里开始它。',
    invalidPageToken: '分页标记不是这个列表给出的。',
    upgradeRequired: '这台电脑上的命令行版本和应用不匹配，请先更新命令行。',
    computerNotAnswering:
      '这台电脑没有及时回应。请确认电脑上的连接还在运行，然后再试。',
    folderUnavailable: '电脑上打不开这个文件夹。',
    projectNotFound: '没有这个项目，或者你看不到它。',
    referenceNotFound: '引用的内容不存在，或者你看不到它。',
    imageNotFound: '这个会话里没有发过这张图片。',
    computerKeyInvalid:
      '这台电脑已经断开：它被移除了，或者在别处重新连接过。在这台电脑上运行 `acp start` 重新连接。',
  },
};

export default zhCN;
