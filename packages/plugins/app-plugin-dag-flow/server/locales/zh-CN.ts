import type { WorkflowServerResource } from './en-US.js';

const zhCN: WorkflowServerResource = {
  nav: { automation: '自动化' },
  authorization: { title: '工作流', manage: '管理' },
  errors: {
    forbidden: '需要工作流管理权限。',
    notConfigured: '工作流服务尚未配置。',
    workflowNotFound: '未找到请求的工作流。',
    sourceNotFound: '未找到请求的工作流源码。',
    runNotFound: '未找到请求的工作流运行记录。',
    nodeRunNotFound: '未找到请求的节点运行记录。',
    invalidWorkflowId: '工作流需以正整数 id 或 64 位 Artifact 哈希标识。',
    invalidParameterValues: '工作流参数值无效。',
    workflowDisabled: '工作流已停用。',
    invalidInput: '工作流输入无效。',
    parentRunNotFound: '未找到父工作流运行记录。',
    stackLimitExceeded: '工作流调用栈超出限制。',
    inputTooLarge: '工作流输入过大。',
  },
};

export default zhCN;
