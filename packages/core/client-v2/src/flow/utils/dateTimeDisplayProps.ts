/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type DateTimeDisplayProps = {
  dateOnly?: boolean;
  dateFormat?: string;
  format?: string;
  picker?: string;
  showTime?: boolean;
  timeFormat?: string;
};

type DateTimeCollectionField = {
  type?: string;
  interface?: string;
  getComponentProps?: () => DateTimeDisplayProps;
  targetCollection?: {
    getField?: (name?: string) => DateTimeCollectionField | undefined;
  };
};

type DateTimeModel = {
  props?: DateTimeDisplayProps & {
    titleField?: string;
  };
  context?: {
    collectionField?: DateTimeCollectionField;
  };
  getStepParams?: (flowKey: string, stepKey: string) => DateTimeDisplayProps | undefined;
};

type ResolveDateTimeDisplayPropsOptions = {
  model?: DateTimeModel;
  collectionField?: DateTimeCollectionField;
  titleField?: string;
  currentProps?: DateTimeDisplayProps;
  params?: DateTimeDisplayProps;
  withDefaults?: boolean;
};

const dateTimeDisplayPropKeys: Array<keyof DateTimeDisplayProps> = [
  'dateOnly',
  'dateFormat',
  'format',
  'picker',
  'showTime',
  'timeFormat',
];

const pickDateTimeDisplayProps = (source?: DateTimeDisplayProps) => {
  if (!source) {
    return {};
  }

  const result: DateTimeDisplayProps = {};
  for (const key of dateTimeDisplayPropKeys) {
    if (key === 'dateOnly' || key === 'showTime') {
      if (typeof source[key] !== 'undefined') {
        result[key] = source[key];
      }
    } else if (typeof source[key] !== 'undefined') {
      result[key] = source[key];
    }
  }
  return result;
};

const stripUndefined = (props: DateTimeDisplayProps) =>
  Object.fromEntries(Object.entries(props).filter(([, value]) => typeof value !== 'undefined')) as DateTimeDisplayProps;

export const getDateTimeFormatCollectionField = (options: ResolveDateTimeDisplayPropsOptions) => {
  const collectionField = options.collectionField || options.model?.context?.collectionField;
  const titleField = options.titleField || options.model?.props?.titleField;
  return collectionField?.targetCollection?.getField?.(titleField) || collectionField;
};

export const isTimeCollectionField = (collectionField?: DateTimeCollectionField) =>
  collectionField?.type === 'time' || collectionField?.interface === 'time';

export const isDateOnlyCollectionField = (collectionField?: DateTimeCollectionField) =>
  collectionField?.type === 'dateOnly' || collectionField?.interface === 'dateOnly';

export const getSavedDateTimeFormatParams = (model?: DateTimeModel) =>
  model?.getStepParams?.('datetimeSettings', 'dateFormat') || model?.getStepParams?.('timeSettings', 'dateFormat');

export const resolveDateTimeDisplayProps = (options: ResolveDateTimeDisplayPropsOptions) => {
  const collectionField = options.collectionField || options.model?.context?.collectionField;
  const targetCollectionField = getDateTimeFormatCollectionField(options);
  const mergedProps = {
    ...pickDateTimeDisplayProps(collectionField?.getComponentProps?.()),
    ...pickDateTimeDisplayProps(
      targetCollectionField !== collectionField ? targetCollectionField?.getComponentProps?.() : undefined,
    ),
    ...pickDateTimeDisplayProps(options.currentProps || options.model?.props),
    ...pickDateTimeDisplayProps(getSavedDateTimeFormatParams(options.model)),
    ...pickDateTimeDisplayProps(options.params),
  };

  if (isTimeCollectionField(targetCollectionField)) {
    const timeFormat = mergedProps.timeFormat || mergedProps.format || 'HH:mm:ss';
    return stripUndefined({
      ...mergedProps,
      timeFormat,
      format: timeFormat,
    });
  }

  const picker = mergedProps.picker || (options.withDefaults ? 'date' : undefined);
  const dateFormat = mergedProps.dateFormat || (options.withDefaults ? 'YYYY-MM-DD' : undefined);
  const timeFormat = mergedProps.timeFormat || (options.withDefaults ? 'HH:mm:ss' : undefined);
  const showTime = isDateOnlyCollectionField(targetCollectionField) ? false : mergedProps.showTime;
  const finalDateFormat = dateFormat || 'YYYY-MM-DD';
  const finalTimeFormat = timeFormat || 'HH:mm:ss';

  return stripUndefined({
    ...mergedProps,
    picker,
    dateFormat,
    timeFormat,
    showTime,
    format: showTime ? `${finalDateFormat} ${finalTimeFormat}` : finalDateFormat,
  });
};
