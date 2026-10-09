import type { ApprovalUiLocale } from './en-US.js';

const zhCN: ApprovalUiLocale = {
  approvalUi: {
    timeline: {
      onBehalf: '代 {{name}}',
      showEvents: '具体变化（{{count}}）',
      system: '{{count}} 条系统记录',
      empty: '还没有任何记录。',
    },
    progress: {
      empty: '尚未发起审批。',
      copies: '抄送给',
      read: '已读',
      unread: '未读',
      step: {
        current: '处理中',
        rejected: '已驳回',
        returned: '已退回',
        ended: '已结束',
        skipped: '已跳过',
      },
      tally: {
        answered: '已答复 {{count}}/{{total}}',
        needed: '需 {{count}} 票通过',
      },
    },
    branches: {
      done: '已完成 {{count}}/{{total}}',
      blocked: '正在阻塞整个申请',
    },
    receipts: {
      read: '已读',
      confirmed: '已确认',
      empty: '还没有人收到。',
    },
    preview: {
      title: '谁来审批',
      loading: '正在计算审批路径…',
      submit: '提交',
      finished: '完成',
      automatic: '无需审批直接通过',
      parallel: '并行',
      optional: '可选',
      nobody: '暂无合适人选',
      none: '此申请不经过审批。',
      skipped: '无需经过：{{stages}}',
    },
    actions: {
      more: '更多',
      all: '操作',
      admin: '管理',
      confirm: '确定要{{action}}吗？',
      loading: '加载中…',
      loadFailed: '加载失败，请关闭后重试。',
      cancel: '取消',
    },
  },
};

export default zhCN;
