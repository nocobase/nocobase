import type { RunWaitLocale } from './runWait.en-US.js';

/** Queued wait reasons by server code, filled from `params` (`formatRunWait`). */
const runWaitZhCN: RunWaitLocale = {
  runWait: {
    capacity:
      '本应用占用 {{used}}/{{limit}}；{{detail}}；跨应用报告空位 {{reportedFree}}',
    reasons: {
      updatePending: '运行环境等待升级，暂不接活',
      pruning: '运行环境清理共享缓存，暂不接活',
      toolNotInstalled: '在线运行环境未安装此工具',
      incompatible: '运行环境不支持本次负载，需要升级',
      restricted: '运行环境策略、目录或变量限制',
      unknown: '尚不能确认本次负载的可承接条件',

      agentArchived: 'Agent 已归档',
      delayed: '计划于 {{until}} 开始',
      noRunnerOnline: '没有在线的运行环境',
      runnersOffline: '它的运行环境都不在线',
      toolQuota: '工具额度用完；恢复时间：{{until}}',
      toolUnavailable: '工具未登录、被禁用或模型不可用（{{tool}}）',
      noSharedRunner: '仅他人的个人运行环境在线',
      missingFeatures: '没有运行环境支持 {{features}}',
      secretsNotAllowed: '需要共享运行环境：{{variables}} 仅限共享运行环境',
      sameWorkActive: '等前一个运行结束',
      concurrencyFull: '并发已满（{{active}}/{{limit}}）',
      runnersBusy: '可承接的运行环境满载',
      toolSlotsFull: '{{tool}} 的槽位已满（{{used}}/{{limit}}）',
      setupRetrying: '准备失败，正在重试：{{detail}}',
      next: '下一个，等空闲的运行环境',
    },
    unknown: '排队中（{{reason}}）',
    quotaResetUnknown: '未知',
    unknownValue: '—',
  },
};

export default runWaitZhCN;
