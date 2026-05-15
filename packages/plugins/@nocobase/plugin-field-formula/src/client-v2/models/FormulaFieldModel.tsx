/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { toJS } from '@formily/reactive';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Checkbox, DatePicker, Form, Input, InputNumber, theme } from 'antd';
import { EditableItemModel, DisplayItemModel, FilterableItemModel } from '@nocobase/flow-engine';
import { FieldModel, getDisplayNumber, resolveDynamicNamePath } from '@nocobase/client-v2';
import { Evaluator, evaluators } from '@nocobase/evaluators/client';
import { dayjs, getDefaultFormat, Registry, str2moment, toGmt, toLocal } from '@nocobase/utils/client';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';

import { tExpr } from '../locale';
import { toDbType } from '../../utils';

const resolveDayjs = (value: unknown) => {
  if (!value) return null;
  if (dayjs.isDayjs(value)) return value as dayjs.Dayjs;
  if (value instanceof Date) return dayjs(value);
  const parsed = dayjs(value as any);
  return parsed.isValid() ? parsed : null;
};

const getDateValueKey = (value: unknown) => {
  if (!value) return '';
  if (dayjs.isDayjs(value)) return `dayjs:${value.valueOf()}`;
  if (value instanceof Date) return `date:${value.getTime()}`;
  return String(value);
};

const getShowTimeKey = (showTime: any) => {
  if (!showTime || showTime === true) {
    return String(!!showTime);
  }
  return [
    getDateValueKey(showTime.defaultValue),
    getDateValueKey(showTime.defaultOpenValue),
    showTime.format,
    showTime.hourStep,
    showTime.minuteStep,
    showTime.secondStep,
    showTime.use12Hours,
  ].join('|');
};

const toStringByPicker = (value: dayjs.Dayjs, picker = 'date', timezone: 'gmt' | 'local') => {
  if (timezone === 'local') {
    const offset = new Date().getTimezoneOffset();
    return dayjs(toStringByPicker(value, picker, 'gmt'))
      .add(offset, 'minutes')
      .toISOString();
  }
  if (picker === 'year') {
    return `${value.format('YYYY')}-01-01T00:00:00.000Z`;
  }
  if (picker === 'month') {
    return `${value.format('YYYY-MM')}-01T00:00:00.000Z`;
  }
  if (picker === 'quarter') {
    return `${value.startOf('quarter').format('YYYY-MM')}-01T00:00:00.000Z`;
  }
  if (picker === 'week') {
    return `${value.startOf('week').add(1, 'day').format('YYYY-MM-DD')}T00:00:00.000Z`;
  }
  return `${value.format('YYYY-MM-DDTHH:mm:ss.SSS')}Z`;
};

function normalizeDatePickerChange(value: dayjs.Dayjs | null, props: any) {
  const { dateOnly, gmt, picker = 'date', showTime, utc = true, underFilter } = props;
  if (!value) {
    return value;
  }
  if (underFilter) {
    return value.format(showTime && picker === 'date' ? 'YYYY-MM-DD HH:mm:ss' : getDefaultFormat({ picker }));
  }
  if (dateOnly) {
    return value.format('YYYY-MM-DD');
  }
  if (!utc) {
    return value.format(showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD');
  }
  if (showTime) {
    return gmt ? toGmt(value) : toLocal(value);
  }
  return gmt ? toStringByPicker(value, picker, 'gmt') : toStringByPicker(value, picker, 'local');
}

const EditableDatePicker = React.memo((props: any) => {
  const { value, onChange, picker = 'date', showTime, ...others } = props;
  const valueKey = getDateValueKey(value);
  const dateValue = React.useMemo(() => {
    return str2moment(value, { ...props, picker }) || null;
  }, [valueKey, picker, props.dateOnly, props.gmt, props.utc]);

  const showTimeKey = getShowTimeKey(showTime);
  const stableShowTime = React.useMemo(() => {
    if (!showTime || showTime === true) {
      return showTime;
    }
    return {
      ...showTime,
      defaultValue: resolveDayjs(showTime.defaultValue),
      defaultOpenValue: resolveDayjs(showTime.defaultOpenValue),
    };
  }, [showTimeKey]);

  const format = React.useMemo(
    () => getDefaultFormat({ ...props, picker }),
    [props.dateFormat, props.format, picker, showTimeKey, props.timeFormat],
  );

  const handleChange = React.useCallback(
    (next: dayjs.Dayjs | null) => {
      const nextValue = normalizeDatePickerChange(next, { ...props, picker });
      if (areValuesEqual(value, nextValue)) {
        return;
      }
      onChange?.(nextValue);
    },
    [onChange, picker, props.dateOnly, props.gmt, props.showTime, props.underFilter, props.utc, value],
  );

  return (
    <DatePicker
      {...others}
      format={format}
      picker={picker}
      showTime={stableShowTime}
      value={dateValue as any}
      onChange={handleChange}
    />
  );
});

const ReadPrettyBoolean = ({ value, showUnchecked }: { value?: boolean; showUnchecked?: boolean }) => {
  const { token } = theme.useToken();
  if (value) {
    return <CheckOutlined style={{ color: token.colorSuccess }} />;
  }
  return showUnchecked ? <CloseOutlined style={{ color: token.colorError }} /> : <Checkbox disabled checked={false} />;
};

const ReadPrettyText = ({
  value,
  className,
  style,
}: {
  value: any;
  className?: string;
  style?: React.CSSProperties;
}) => {
  if (value == null || value === '') return null;
  return (
    <span className={className} style={style}>
      {String(value)}
    </span>
  );
};

const ReadPrettyDate = ({
  value,
  format,
  className,
  style,
}: {
  value: any;
  format?: string;
  className?: string;
  style?: React.CSSProperties;
}) => {
  if (!value) return null;
  const d = resolveDayjs(value);
  if (!d) {
    return (
      <span className={className} style={style}>
        {String(value)}
      </span>
    );
  }
  return (
    <span className={className} style={style}>
      {d.format(format || 'YYYY-MM-DD')}
    </span>
  );
};

function renderEditableValue(dataType: string, value: any, others: any) {
  switch (dataType) {
    case 'boolean':
      return (
        <Checkbox
          {...others}
          checked={!!value}
          onChange={(ev) => {
            others?.onChange?.(ev);
          }}
        />
      );
    case 'integer':
    case 'bigInt':
    case 'double':
    case 'decimal':
    case 'number':
      return (
        <InputNumber
          {...others}
          value={value as any}
          onChange={(v) => {
            others?.onChange?.(v);
          }}
        />
      );
    case 'date': {
      return <EditableDatePicker {...others} value={value} />;
    }
    default:
      return (
        <Input
          {...others}
          value={value ?? ''}
          onChange={(ev) => {
            others?.onChange?.(ev);
          }}
        />
      );
  }
}

function renderReadPrettyValue(dataType: string, value: any, others: any) {
  switch (dataType) {
    case 'boolean':
      return (
        <span className={others?.className} style={others?.style}>
          <ReadPrettyBoolean value={!!value} showUnchecked={others?.showUnchecked} />
        </span>
      );
    case 'date':
      return (
        <ReadPrettyDate
          value={value}
          format={others?.format || others?.dateFormat}
          className={others?.className}
          style={others?.style}
        />
      );
    case 'integer':
    case 'bigInt':
    case 'double':
    case 'decimal':
    case 'number': {
      const result = getDisplayNumber({
        ...others,
        value,
        numberStep: others?.numberStep ?? others?.step ?? '1',
      });
      if (result == null || result === '') {
        return null;
      }
      return (
        <span className={others?.className} style={others?.style}>
          {others?.addonBefore}
          <span dangerouslySetInnerHTML={{ __html: String(result) }} />
          {others?.addonAfter}
        </span>
      );
    }
    default:
      return <ReadPrettyText value={value} className={others?.className} style={others?.style} />;
  }
}

function getValuesByPath(values, key, index?) {
  const targetValue = values?.[key];
  if (Array.isArray(targetValue)) {
    return targetValue[index];
  }
  if (targetValue && typeof targetValue === 'object') {
    return targetValue;
  } else {
    return values;
  }
}

function getValuesByFullPath(values, fieldPath) {
  const fieldPaths = Array.isArray(fieldPath)
    ? fieldPath.map((part) => (typeof part === 'number' ? part : String(part)))
    : String(fieldPath || '')
        .split('.')
        .filter(Boolean);
  let currentKeyIndex = 0;
  let value = values || {};
  while (currentKeyIndex < fieldPaths.length) {
    const fieldName = fieldPaths[currentKeyIndex];
    const nextPart = fieldPaths?.[currentKeyIndex + 1];
    const index = typeof nextPart === 'number' ? nextPart : parseInt(nextPart);
    value = getValuesByPath(value, fieldName, index);
    currentKeyIndex = currentKeyIndex + (index >= 0 ? 2 : 1);
  }
  return value;
}

function getScopeByFullPath(values, fieldPath) {
  const fieldPaths = Array.isArray(fieldPath)
    ? fieldPath.map((part) => (typeof part === 'number' ? part : String(part)))
    : String(fieldPath || '')
        .split('.')
        .filter(Boolean);
  const parentPath = fieldPaths.slice(0, -1);
  return parentPath.length ? getValuesByFullPath(values, parentPath) : values || {};
}

function normalizeIdPath(id) {
  if (Array.isArray(id)) {
    return id.map((part) => {
      if (typeof part === 'number') {
        return part;
      }
      const n = Number(part);
      return Number.isInteger(n) && String(n) === String(part) ? n : part;
    });
  }
  if (_.isString(id) && id.includes('.')) {
    return id
      .split('.')
      .filter(Boolean)
      .map((part) => {
        const n = Number(part);
        return Number.isInteger(n) && String(n) === part ? n : part;
      });
  }
  if (id == null || id === '') {
    return [];
  }
  return [id];
}

function getDateTimestamp(value) {
  if (dayjs.isDayjs(value)) {
    return value.isValid() ? value.valueOf() : undefined;
  }
  if (_.isDate(value)) {
    const timestamp = value.getTime();
    return Number.isNaN(timestamp) ? undefined : timestamp;
  }
  if (_.isString(value)) {
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? undefined : timestamp;
  }
}

function areValuesEqual(value1, value2) {
  const timestamp1 = getDateTimestamp(value1);
  const timestamp2 = getDateTimestamp(value2);
  if (timestamp1 !== undefined || timestamp2 !== undefined) {
    return timestamp1 === timestamp2;
  }

  return _.isEqual(value1, value2);
}

const resolveFormulaUsageFlags = (form: any, ctx?: any) => {
  const flags = form?.props?.['x-flag'] || ctx?.flags || {};
  const hasFlags = !!flags && Object.keys(flags).length > 0;
  const isFilterContext = !!(flags?.isInFilterFormBlock || flags?.isInFilterAction);
  const isDefaultValueDialog = !!flags?.isInSetDefaultValueDialog;
  return { flags, hasFlags, isFilterContext, isDefaultValueDialog };
};

function FormulaCalculatedResult(props) {
  const { value, collectionField, form, id, context, ...others } = props;
  const { dataType, expression, engine = 'math.js' } = collectionField?.options || {};
  const [editingValue, setEditingValue] = useState(value);
  const { evaluate } = (evaluators as Registry<Evaluator>).get(engine);
  const antdForm = typeof form?.getFieldsValue === 'function' ? form : undefined;
  const watchedValues = Form.useWatch([], antdForm);
  const fieldPath = React.useMemo(() => {
    const resolved = resolveDynamicNamePath(context?.fieldPath || normalizeIdPath(id), context?.fieldIndex);
    return (resolved?.length ? resolved : normalizeIdPath(id)) as Array<string | number>;
  }, [context?.fieldIndex, context?.fieldPath, id]);

  const { flags, isFilterContext, isDefaultValueDialog } = resolveFormulaUsageFlags(form, context);

  useEffect(() => {
    setEditingValue(value);
  }, [value]);

  useEffect(() => {
    const constantOrNull = isDefaultValueDialog && (flags?.constant || flags?.null || flags?.root === 'constant');

    if (form?.readPretty || isFilterContext || isDefaultValueDialog || constantOrNull) {
      return;
    }
    const formValues = typeof form?.getFieldsValue === 'function' ? form.getFieldsValue() : form?.values || {};
    const scope = toJS(getScopeByFullPath(formValues, fieldPath));
    let v;
    try {
      v = evaluate(expression, scope);
      v = v && toDbType(v, dataType);
    } catch (error) {
      v = null;
    }
    setEditingValue((prev) => (areValuesEqual(prev, v) ? prev : v));
  }, [watchedValues]);

  useEffect(() => {
    if (!areValuesEqual(value, editingValue) && !isFilterContext && !isDefaultValueDialog) {
      setTimeout(() => {
        if (typeof form?.setFieldValue === 'function') {
          const currentValue =
            typeof form?.getFieldValue === 'function'
              ? form.getFieldValue(fieldPath)
              : getValuesByFullPath(form?.values, fieldPath);
          if (areValuesEqual(currentValue, editingValue)) {
            return;
          }
          form.setFieldValue(fieldPath, editingValue);
        }
      });
    }
  }, [editingValue, fieldPath, form, isFilterContext, isDefaultValueDialog, value]);

  if (!collectionField) {
    return;
  }
  return <>{renderReadPrettyValue(dataType, editingValue, others)}</>;
}

export function FormulaResult(props) {
  const { value, collectionField, form, context, ...others } = props;
  const { dataType } = collectionField?.options || {};
  const { isFilterContext, isDefaultValueDialog } = resolveFormulaUsageFlags(form, context);

  if (isFilterContext || isDefaultValueDialog) {
    return renderEditableValue(dataType, value, others);
  }

  return <FormulaCalculatedResult {...props} />;
}

export class FormulaFieldModel extends FieldModel {
  render() {
    return (
      <FormulaResult
        {...this.props}
        collectionField={this.context.collectionField}
        form={this.context.form}
        context={this.context}
      />
    );
  }
}

FormulaFieldModel.registerFlow({
  key: 'formulaNumberSettings',
  sort: 500,
  title: tExpr('Number settings'),
  steps: {
    format: {
      title: tExpr('Number format'),
      use: 'numberFormat',
      hideInSettings(ctx) {
        const dataType = ctx?.collectionField?.dataType;
        return !['double', 'bigInt', 'integer', 'number', 'decimal'].includes(dataType);
      },
    },
    dateFormat: {
      use: 'dateDisplayFormat',
      title: tExpr('Date display format'),
      hideInSettings(ctx) {
        const dataType = ctx?.collectionField?.dataType;
        return dataType !== 'date';
      },
    },
  },
});

EditableItemModel.bindModelToInterface('FormulaFieldModel', ['formula'], { isDefault: true });

DisplayItemModel.bindModelToInterface('DisplayCheckboxFieldModel', ['formula'], {
  isDefault: true,
  when(ctx, fieldInstance) {
    if (fieldInstance.type === 'formula') {
      return fieldInstance.dataType === 'boolean';
    }
    return true;
  },
});

DisplayItemModel.bindModelToInterface('DisplayDateTimeFieldModel', ['formula'], {
  isDefault: true,
  when(ctx, fieldInstance) {
    if (fieldInstance.type === 'formula') {
      return fieldInstance.dataType === 'date';
    }
    return true;
  },
});

DisplayItemModel.bindModelToInterface('DisplayTextFieldModel', ['formula'], {
  isDefault: true,
  when(ctx, fieldInstance) {
    if (fieldInstance.type === 'formula') {
      return fieldInstance.dataType === 'string';
    }
    return true;
  },
});

DisplayItemModel.bindModelToInterface('DisplayNumberFieldModel', ['formula'], {
  isDefault: true,
  when(ctx, fieldInstance) {
    if (fieldInstance.type === 'formula') {
      return ['double', 'bigInt', 'integer'].includes(fieldInstance.dataType);
    }
    return true;
  },
});

FilterableItemModel.bindModelToInterface('FormulaFieldModel', ['formula'], {
  isDefault: true,
  when(ctx) {
    const { hasFlags, isFilterContext } = resolveFormulaUsageFlags(ctx?.form, ctx);
    return hasFlags && !isFilterContext;
  },
});

FilterableItemModel.bindModelToInterface('InputFieldModel', ['formula'], {
  isDefault: false,
  when(ctx, fieldInstance) {
    const { isFilterContext } = resolveFormulaUsageFlags(ctx?.form, ctx);
    if (!isFilterContext) return false;
    const dataType = fieldInstance?.dataType;
    return !['date', 'boolean', 'integer', 'bigInt', 'double', 'decimal', 'number'].includes(dataType);
  },
});

FilterableItemModel.bindModelToInterface('DateTimeFilterFieldModel', ['formula'], {
  isDefault: false,
  when(ctx, fieldInstance) {
    const { isFilterContext } = resolveFormulaUsageFlags(ctx?.form, ctx);
    return isFilterContext && fieldInstance?.dataType === 'date';
  },
});

FilterableItemModel.bindModelToInterface('CheckboxFieldModel', ['formula'], {
  isDefault: false,
  when(ctx, fieldInstance) {
    const { isFilterContext } = resolveFormulaUsageFlags(ctx?.form, ctx);
    return isFilterContext && fieldInstance?.dataType === 'boolean';
  },
});
