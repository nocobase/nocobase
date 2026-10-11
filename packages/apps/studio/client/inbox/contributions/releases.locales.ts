/**
 * The wording of release management's inbox entries, in their own namespace (`releases.ts`), and how the entries read
 * their data.
 */
import type { InboxEntry } from '@/extensions/nocobase-inbox/model';

/** A string value of the item's data, or null: data is the sender's, so nothing else is trusted. */
export function field(entry: InboxEntry, key: string): string | null {
  const value = entry.notice?.data?.[key];
  return typeof value === 'string' && value !== '' ? value : null;
}

export const RELEASES_NAMESPACE = 'studio-inbox-releases';

const enUS = {
  types: {
    deployment_requested: 'Deployment request',
    deployment_request_decided: 'Deployment request decided',
    deployment_failed: 'Deployment failed',
  },
  headings: {
    deployment_requested: 'Deployment waiting for approval',
    deployment_request_decided: 'Your deployment request was decided',
    deployment_failed: 'A deployment failed',
  },
  title: 'Deploy {{release}} of {{app}} to {{environment}}',
  rollbackTitle: 'Roll {{app}} back to {{release}} on {{environment}}',
  sentence: '{{requester}} asks to deploy it.',
  rollbackSentence: '{{requester}} asks to roll it back.',
  approvedTitle: '{{decider}} approved deploying {{release}} of {{app}}',
  rejectedTitle: '{{decider}} rejected deploying {{release}} of {{app}}',
  failedTitle: 'Deploying {{release}} of {{app}} failed',
  approve: 'Approve',
  reject: 'Reject',
  cancel: 'Cancel',
  confirmTitle: 'Approve a deployment to a protected environment?',
  confirmDescription:
    'This environment is protected. Type {{appId}} to approve the deployment.',
  confirmLabel: 'Type {{appId}} to confirm',
  approved: 'Approved: {{title}}',
  rejected: 'Rejected: {{title}}',
  open: 'Open the App',
  app: 'App',
  release: 'Release',
  environment: 'Environment',
  requester: 'Requested by',
  requestedAt: 'Requested',
  note: 'Note',
  error: 'Error',
  agent: 'through an agent',
  apiKey: 'API key',
  commit: 'Commit',
  builtFrom: 'Built from',
  ciLog: 'CI log',
  pinned: 'Approving deploys exactly this release (checksum {{checksum}}).',
  unknown: 'Unknown',
  someone: 'Someone',
  outcomes: {
    approved: 'Approved',
    rejected: 'Rejected',
    withdrawn: 'Cancelled by the requester',
  },
};

const zhCN: typeof enUS = {
  types: {
    deployment_requested: '部署申请',
    deployment_request_decided: '部署申请已处理',
    deployment_failed: '部署失败',
  },
  headings: {
    deployment_requested: '等待审批的部署',
    deployment_request_decided: '你的部署申请已处理',
    deployment_failed: '有一次部署失败了',
  },
  title: '将 {{app}} 的 {{release}} 部署到 {{environment}}',
  rollbackTitle: '将 {{environment}} 上的 {{app}} 回滚到 {{release}}',
  sentence: '{{requester}} 申请部署。',
  rollbackSentence: '{{requester}} 申请回滚。',
  approvedTitle: '{{decider}} 批准了部署 {{app}} 的 {{release}}',
  rejectedTitle: '{{decider}} 拒绝了部署 {{app}} 的 {{release}}',
  failedTitle: '部署 {{app}} 的 {{release}} 失败',
  approve: '批准',
  reject: '拒绝',
  cancel: '取消',
  confirmTitle: '批准部署到受保护的环境？',
  confirmDescription: '这是受保护的环境。输入 {{appId}} 以批准这次部署。',
  confirmLabel: '输入 {{appId}} 以确认',
  approved: '已批准：{{title}}',
  rejected: '已拒绝：{{title}}',
  open: '打开应用',
  app: '应用',
  release: '版本',
  environment: '环境',
  requester: '申请人',
  requestedAt: '申请时间',
  note: '备注',
  error: '错误',
  agent: '通过 Agent',
  apiKey: 'API 密钥',
  commit: '提交',
  builtFrom: '构建来源',
  ciLog: 'CI 日志',
  pinned: '批准后部署的正是这个版本（校验和 {{checksum}}）。',
  unknown: '未知',
  someone: '有人',
  outcomes: {
    approved: '已批准',
    rejected: '已拒绝',
    withdrawn: '申请人已撤回',
  },
};

export const releasesResources: Readonly<Record<string, object>> = {
  'en-US': enUS,
  'zh-CN': zhCN,
};
