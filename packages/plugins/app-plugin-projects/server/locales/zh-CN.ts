import accessZhCN from '../../shared/locales/access.zh-CN.js';
import type { ProjectsResource } from './en-US.js';

const zhCN: ProjectsResource = {
  ...accessZhCN,
  notifications: {
    approval: {
      approved: '已批准：{{identifier}} 已改为“{{status}}”',
      rejected: '{{identifier}} 改为“{{status}}”的申请被驳回',
      stale: '{{identifier}} 改为“{{status}}”的申请已批准，但已不再适用',
    },
    approvalRequested: '{{identifier}} 等待你审批：改为“{{status}}”',
    batchDone: '{{identifier}} 的子任务都已完成',
    batchDoneStage: '{{identifier}} 第 {{stage}} 阶段的子任务都已完成',
    commented: '{{actor}} 评论了 {{identifier}}',
    dependencyReleased: '{{releasedBy}} 已完成，{{identifier}} 可以开始了',
    executorAssigned: '{{actor}} 把 {{identifier}} 交给你执行',
    mentioned: {
      comment: '{{actor}} 在 {{identifier}} 的评论里提到了你',
      description: '{{actor}} 在 {{identifier}} 的描述里提到了你',
    },
    ownerAssigned: '{{actor}} 让你负责 {{identifier}}',
    someone: '有人',
    statusChanged: '{{identifier}} 已改为“{{status}}”',
    ownerNotified: '{{identifier}} 已进入“{{status}}”',
  },
  status: {
    analysis: '分析中',
    backlog: '待规划',
    blocked: '受阻',
    cancelled: '已取消',
    done: '已完成',
    in_progress: '进行中',
    in_review: '代码评审',
    proposal_review: '方案评审',
    todo: '待处理',
  },
};

export default zhCN;
