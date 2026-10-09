/**
 * The data usage request form: which fields exist, which options they offer
 * and when they appear. The page renders from these rules and the server
 * validates with them, so the two cannot drift apart.
 */

export const VOLUMES: readonly string[] = [
  'x<50',
  '50≤x<2万',
  '2万≤x<50万',
  'x≥50万',
];

export type Frequency =
  'once' | 'quarterly' | 'monthly' | 'weekly' | 'daily' | 'other';

export const FREQUENCIES: readonly { value: Frequency; label: string }[] = [
  { value: 'once', label: '一次性' },
  { value: 'quarterly', label: '每季度' },
  { value: 'monthly', label: '每月' },
  { value: 'weekly', label: '每周' },
  { value: 'daily', label: '每日' },
  { value: 'other', label: '其他固定频次' },
];

export type UsageScope = 'external' | 'internal';

export const SCOPES: readonly { value: UsageScope; label: string }[] = [
  { value: 'external', label: '对外交付' },
  { value: 'internal', label: '内部离线使用' },
];

export const CONSUMERS: Readonly<Record<UsageScope, readonly string[]>> = {
  external: [
    '监管机构',
    '第三方合作',
    '客户',
    '公检法',
    '股东',
    '外部合规风险审计',
  ],
  internal: ['内部合规风险审计', '内部管理及分析'],
};

export const WEEKDAYS: readonly string[] = [
  '周一',
  '周二',
  '周三',
  '周四',
  '周五',
  '周六',
  '周日',
];

export const INTERNAL_ANALYSIS = '内部管理及分析';
export const THIRD_PARTY = '第三方合作';

/** The fields an applicant fills in, as the server stores them. */
export interface DataRequestForm {
  subject: string;
  reason: string;
  volume: string;
  frequency: Frequency | '';
  deliveryDate: string;
  firstUseDate: string;
  lastDeliveryDate: string;
  /** 1–92: the day of the quarter, counted from its first day. */
  quarterDay: number | null;
  /** 1–31; a shorter month uses its last day. */
  monthDay: number | null;
  /** 1 (Monday) – 7 (Sunday). */
  weekDay: number | null;
  frequencyNote: string;
  scope: UsageScope | '';
  consumers: string[];
  fileShieldAccepted: boolean | null;
  fileShieldScope: string;
  fileShieldCopy: boolean | null;
  fileShieldValidUntil: string;
  ndaFiles: string[];
  securityFiles: string[];
}

export function emptyDataRequest(): DataRequestForm {
  return {
    subject: '',
    reason: '',
    volume: '',
    frequency: '',
    deliveryDate: '',
    firstUseDate: '',
    lastDeliveryDate: '',
    quarterDay: null,
    monthDay: null,
    weekDay: null,
    frequencyNote: '',
    scope: '',
    consumers: [],
    fileShieldAccepted: null,
    fileShieldScope: '',
    fileShieldCopy: null,
    fileShieldValidUntil: '',
    ndaFiles: [],
    securityFiles: [],
  };
}

/** Which conditional parts of the form are showing for these values. */
export interface DataRequestVisibility {
  readonly deliveryDate: boolean;
  readonly periodDates: boolean;
  readonly quarterDay: boolean;
  readonly monthDay: boolean;
  readonly weekDay: boolean;
  readonly frequencyNote: boolean;
  readonly fileShield: boolean;
  readonly thirdParty: boolean;
}

export function visibility(form: DataRequestForm): DataRequestVisibility {
  const periodic = form.frequency !== '' && form.frequency !== 'once';
  return {
    deliveryDate: form.frequency === 'once',
    periodDates: periodic,
    quarterDay: form.frequency === 'quarterly',
    monthDay: form.frequency === 'monthly',
    weekDay: form.frequency === 'weekly',
    frequencyNote: form.frequency === 'other',
    fileShield: form.consumers.includes(INTERNAL_ANALYSIS),
    thirdParty: form.consumers.includes(THIRD_PARTY),
  };
}

/** The consumer types the chosen scope offers. */
export function consumerOptions(scope: UsageScope | ''): readonly string[] {
  return scope === '' ? [] : CONSUMERS[scope];
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** A `YYYY-MM-DD` that names a real day: `2026-02-31` is refused, not moved to March. */
export function isDate(value: string): boolean {
  if (!DATE.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === value
  );
}

/**
 * Field → message for every problem; empty when the form may be submitted.
 * Fields that are hidden for these values are neither required nor checked.
 */
export function validateDataRequest(
  form: DataRequestForm,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const shown = visibility(form);
  if (!form.subject.trim()) errors.subject = '请填写主题';
  if (!form.reason.trim()) errors.reason = '请填写原因';
  if (!VOLUMES.includes(form.volume)) errors.volume = '请选择预估数据量';
  if (!FREQUENCIES.some((item) => item.value === form.frequency))
    errors.frequency = '请选择数据使用频次';
  if (shown.deliveryDate && !isDate(form.deliveryDate))
    errors.deliveryDate = '请填写数据交付日期';
  if (shown.periodDates) {
    if (!isDate(form.firstUseDate))
      errors.firstUseDate = '请填写数据首次使用日期';
    if (!isDate(form.lastDeliveryDate))
      errors.lastDeliveryDate = '请填写最后一次交付日期';
    else if (
      isDate(form.firstUseDate) &&
      form.lastDeliveryDate < form.firstUseDate
    )
      errors.lastDeliveryDate = '最后一次交付日期不能早于首次使用日期';
  }
  if (
    shown.quarterDay &&
    !(
      Number.isInteger(form.quarterDay) &&
      form.quarterDay! >= 1 &&
      form.quarterDay! <= 92
    )
  )
    errors.quarterDay = '请填写每季度的第几天（1–92）';
  if (
    shown.monthDay &&
    !(
      Number.isInteger(form.monthDay) &&
      form.monthDay! >= 1 &&
      form.monthDay! <= 31
    )
  )
    errors.monthDay = '请填写每月几号（1–31）';
  if (
    shown.weekDay &&
    !(
      Number.isInteger(form.weekDay) &&
      form.weekDay! >= 1 &&
      form.weekDay! <= 7
    )
  )
    errors.weekDay = '请选择周几';
  if (shown.frequencyNote && !form.frequencyNote.trim())
    errors.frequencyNote = '请填写其他频次描述';
  if (!SCOPES.some((item) => item.value === form.scope))
    errors.scope = '请选择数据使用范围';
  const allowed = consumerOptions(form.scope);
  if (!form.consumers.length) errors.consumers = '请选择使用方类型';
  else if (form.consumers.some((item) => !allowed.includes(item)))
    errors.consumers = '使用方类型与数据使用范围不符';
  if (shown.fileShield) {
    if (form.fileShieldAccepted === null)
      errors.fileShieldAccepted = '请选择是否接受使用文件盾';
    if (!form.fileShieldScope.trim())
      errors.fileShieldScope = '请填写授权人员范围';
    if (form.fileShieldCopy === null) errors.fileShieldCopy = '请选择复制权限';
    if (!isDate(form.fileShieldValidUntil))
      errors.fileShieldValidUntil = '请填写数据有效截至日期';
  }
  if (shown.thirdParty && !form.ndaFiles.length)
    errors.ndaFiles = '请上传第三方保密协议';
  return errors;
}

/**
 * Drops the values of fields the choices hide, so a stored request never
 * carries an answer to a question it did not ask.
 */
export function normalizeDataRequest(form: DataRequestForm): DataRequestForm {
  const shown = visibility(form);
  return {
    ...form,
    deliveryDate: shown.deliveryDate ? form.deliveryDate : '',
    firstUseDate: shown.periodDates ? form.firstUseDate : '',
    lastDeliveryDate: shown.periodDates ? form.lastDeliveryDate : '',
    quarterDay: shown.quarterDay ? form.quarterDay : null,
    monthDay: shown.monthDay ? form.monthDay : null,
    weekDay: shown.weekDay ? form.weekDay : null,
    frequencyNote: shown.frequencyNote ? form.frequencyNote : '',
    consumers: form.consumers.filter((item) =>
      consumerOptions(form.scope).includes(item),
    ),
    fileShieldAccepted: shown.fileShield ? form.fileShieldAccepted : null,
    fileShieldScope: shown.fileShield ? form.fileShieldScope : '',
    fileShieldCopy: shown.fileShield ? form.fileShieldCopy : null,
    fileShieldValidUntil: shown.fileShield ? form.fileShieldValidUntil : '',
    ndaFiles: shown.thirdParty ? form.ndaFiles : [],
    securityFiles: shown.thirdParty ? form.securityFiles : [],
  };
}
