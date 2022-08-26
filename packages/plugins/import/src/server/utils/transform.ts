import { str2moment } from '@nocobase/utils';

export function _({ value, field }) {
  return value;
}

export function o2o({ value, field }) {
  return value;
}
export const oho = o2o;
export function o2m({ value, field }) {
  return value?.split(';');
}

export function m2o({ value, field }) {}

export function m2m({ value, field }) {}
export function datetime({ value, field, ctx }) {
  if (!value) {
    return '';
  }
  const utcOffset = ctx.get('X-Timezone');
  const props = field.options?.uiSchema?.['x-component-props'] ?? {};
  const m = str2moment(value, { ...props, utcOffset });
  console.log(m);
  return m.toDate();
}
export const time = datetime;
export function percent({ value, field }) {
  if (value) {
    const numberValue = Number(value.split('%')[0]);
    return numberValue / 100;
  }
  return 0;
}
export function boolean({ value, field }) {}
export const checkbox = boolean;

export function select({ value, field }) {
  const { enum: enumData } = field.options.uiSchema;
  const item = enumData.find((item) => item.label === value);
  return item?.value;
}
export const radio = select;

export const radioGroup = select;

export function multipleSelect({ value, field }) {
  const { enum: enumData } = field.options.uiSchema;
  const item = enumData.find((item) => item.label === value);
  return [item?.value];
}

export const checkboxes = multipleSelect;

export const checkboxGroup = multipleSelect;
export function linkTo({ value, field }) {}
export function chinaRegion({ value, field }) {
  const values = value?.split('/');
  return values;
}
