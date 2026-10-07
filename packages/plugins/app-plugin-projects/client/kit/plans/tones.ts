/** The hues of a plan's statuses and risk flags, as the projects plugin's tags show them. */
import type { PlanRiskFlag, PlanStatus } from '../../../shared/plans.js';
import type { PmTone } from '../../components/pm-tones.js';

/** The hue of a plan's status or a risk flag: `grey`, `blue`, `violet`, `amber`, `green`, `slate`, `red` or `orange`. */
export type PlanTone = PmTone;

export const PLAN_STATUS_TONE: Readonly<Record<PlanStatus, PlanTone>> = {
  pending: 'amber',
  executing: 'blue',
  executed: 'green',
  failed: 'red',
  stale: 'orange',
  voided: 'slate',
  expired: 'slate',
  undone: 'slate',
};

export const FLAG_TONE: Readonly<Record<PlanRiskFlag, PlanTone>> = {
  startsRun: 'violet',
  finalStatus: 'red',
  ownerChange: 'amber',
  createsProject: 'amber',
  agentExecutor: 'violet',
};
