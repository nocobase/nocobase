import { NAMESPACE } from '../locale';

export const unitOptions = [
  { label: `{{t('Year', { ns: "${NAMESPACE}" })}}`, value: 'year' },
  { label: `{{t('Quarter', { ns: "${NAMESPACE}" })}}`, value: 'quarter' },
  { label: `{{t('Month', { ns: "${NAMESPACE}" })}}`, value: 'month' },
  { label: `{{t('Week', { ns: "${NAMESPACE}" })}}`, value: 'week' },
  { label: `{{t('Day', { ns: "${NAMESPACE}" })}}`, value: 'day' },
  { label: `{{t('Hour', { ns: "${NAMESPACE}" })}}`, value: 'hour' },
  { label: `{{t('Minute', { ns: "${NAMESPACE}" })}}`, value: 'minute' },
  { label: `{{t('Second', { ns: "${NAMESPACE}" })}}`, value: 'second' },
  { label: `{{t('Millisecond', { ns: "${NAMESPACE}" })}}`, value: 'millisecond' },
];

const DATA_TYPES = [
  { label: `{{t('Date', { ns: "${NAMESPACE}" })}}`, value: 'date', color: 'blue' },
  { label: `{{t('Number', { ns: "${NAMESPACE}" })}}`, value: 'number', color: 'geekblue' },
  { label: `{{t('Boolean', { ns: "${NAMESPACE}" })}}`, value: 'boolean', color: 'cyan' },
  { label: `{{t('String', { ns: "${NAMESPACE}" })}}`, value: 'string', color: 'orange' },
];

export const DATA_TYPES_OPTION_MAP = DATA_TYPES.reduce(
  (result, option) => ({
    ...result,
    [option.value]: option,
  }),
  {},
);
