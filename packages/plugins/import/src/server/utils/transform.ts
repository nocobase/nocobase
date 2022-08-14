export function _({ value, field }) {
  return value;
}

export function o2o({ value, field }) {
  return value;
}
export const oho = o2o;
export function o2m({ value, field }) {
  return value?.split(',');
}

export function m2o({ value, field }) {}

export function m2m({ value, field }) {}
export function datetime({ value, field }) {}
export function percent({ value, field }) {
  if (value) {
    const numberValue = Number(value.split('%')[0]);
    return numberValue / 100;
  }
  return 0;
}
export function boolean({ value, field }) {}
export const checkbox = boolean;

export function select({ value, field }) {}
export const radio = select;

export const radioGroup = select;

export function multipleSelect({ value, field }) {
  const { enum: enumData } = field.options.uiSchema;
  const item = enumData.find((item) => item.label === value);
  return item?.value;
}

export const checkboxes = multipleSelect;

export const checkboxGroup = multipleSelect;
export function linkTo({ value, field }) {}
export function chinaRegion({ value, field }) {}
