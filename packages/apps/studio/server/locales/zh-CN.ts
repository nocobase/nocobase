import type { AppServerResource } from './en-US.js';

const zhCN: AppServerResource = {
  knowledge: {
    manual: {
      updated: '手册：已更新 <slug>, <slug>',
      none: '手册：无影响',
    },
  },
  ci: {
    taskTitle: '接入部署：{{repo}}',
  },
  studioAgents: {
    templateMessages: {
      inReview:
        '审阅改动并合并它的 Pull request：合并后任务会变为已完成（如有必填检查项，需先勾选）。也可以附上评论，把任务退回进行中。',
    },
  },
};

export default zhCN;
