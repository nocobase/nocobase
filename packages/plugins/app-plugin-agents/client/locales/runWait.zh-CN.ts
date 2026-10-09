import type { RunWaitLocale } from './runWait.en-US.js';

/** 排队任务的等待原因，按服务端给的原因代码，用 `params` 填入（`formatRunWait`）。 */
const runWaitZhCN: RunWaitLocale = {
  runWait: {
    reasons: {
      agentArchived: 'Agent 已归档',
      delayed: '计划于 {{until}} 开始',
      noRunnerOnline: '没有在线的运行环境',
      runnersOffline: '它的运行环境都不在线',
      toolUnavailable: '没有运行环境登录了 {{tool}}',
      noSharedRunner: '在线的只有别人的运行环境',
      missingFeatures: '没有运行环境支持 {{features}}',
      secretsNotAllowed: '需要团队运行环境：{{variables}} 仅限团队运行环境',
      sameWorkActive: '等前一个运行结束',
      concurrencyFull: '并发已满（{{active}}/{{limit}}）',
      runnersBusy: '合适的运行环境都在忙',
      toolSlotsFull: '{{tool}} 的槽位已满（{{used}}/{{limit}}）',
      setupRetrying: '准备失败，正在重试：{{detail}}',
      next: '下一个，等空闲的运行环境',
    },
    unknown: '排队中（{{reason}}）',
    unknownValue: '—',
  },
};

export default runWaitZhCN;
