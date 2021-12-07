import React, { createContext, useContext, useEffect, useState } from 'react';
import { isArr, isValid } from '@formily/shared';
import { observer, useField } from '@formily/react';
import { InputProps } from 'antd/lib/input';
import { InputNumberProps } from 'antd/lib/input-number';
import { SelectProps } from 'antd/lib/select';
import { TreeSelectProps } from 'antd/lib/tree-select';
import { CascaderProps } from 'antd/lib/cascader';
import { DatePickerProps, RangePickerProps as DateRangePickerProps } from 'antd/lib/date-picker';
import { TimePickerProps, TimeRangePickerProps } from 'antd/lib/time-picker';
import { Tag, Space, Popover } from 'antd';
import cls from 'classnames';
import { formatMomentValue, usePrefixCls } from '@formily/antd/esm/__builtins__';
import { FullscreenOutlined } from '@ant-design/icons';
import moment from 'moment';
import { useCompile } from '../../hooks/useCompile';
import { Field } from '@formily/core';
import './index.less';

const PlaceholderContext = createContext<string>('');

const Placeholder = PlaceholderContext.Provider;

const usePlaceholder = (value?: any) => {
  const placeholder = useContext(PlaceholderContext) || '';
  return isValid(value) && value !== '' ? value : placeholder;
};

const Input: React.FC<InputProps & { ellipsis: any }> = (props) => {
  const prefixCls = usePrefixCls('description-input', props);
  const domRef = React.useRef<HTMLInputElement>(null);
  const compile = useCompile();
  const [ellipsis, setEllipsis] = useState(false);
  const content = compile(usePlaceholder(props.value));
  const ellipsisContent = (
    <Popover content={usePlaceholder(props.value)} style={{ width: 100 }}>
      <span className={'input-ellipsis'}>{content}</span>
    </Popover>
  );
  useEffect(() => {
    if (domRef.current?.scrollWidth > domRef.current?.clientWidth) {
      setEllipsis(true);
    }
  }, []);
  return (
    <div className={cls(prefixCls, props.className)} style={props.style}>
      {props.addonBefore}
      {props.prefix}
      <span ref={domRef}>{ellipsis ? ellipsisContent : content}</span>
      {props.suffix}
      {props.addonAfter}
    </div>
  );
};

const URL: React.FC<InputProps> = (props) => {
  const prefixCls = usePrefixCls('description-url', props);
  const content = props.value && (
    <a target={'_blank'} href={props.value as any}>
      {props.value}
    </a>
  );
  return (
    <div className={cls(prefixCls, props.className)} style={props.style}>
      {props.addonBefore}
      {props.prefix}
      {content}
      {props.suffix}
      {props.addonAfter}
    </div>
  );
};

const InputNumber: React.FC<InputProps & InputNumberProps> = (props) => {
  const prefixCls = usePrefixCls('description-input-number', props);
  const value = usePlaceholder(props.value);
  return (
    <div className={cls(prefixCls, props.className)} style={props.style}>
      {props.addonBefore}
      {props.prefix}
      {props.formatter ? props.formatter(value) : value}
      {props.suffix}
      {props.addonAfter}
    </div>
  );
};

const TextArea: React.FC<any> = (props) => {
  const prefixCls = usePrefixCls('description-textarea', props);
  const domRef = React.useRef<HTMLInputElement>(null);
  const [ellipsis, setEllipsis] = useState(false);
  const ellipsisProp = props.ellipsis === true ? {} : props.ellipsis;
  const content = usePlaceholder(props.value);
  const ellipsisContent = (
    <Popover content={usePlaceholder(props.value)}>
      <span
        className={'input-ellipsis'}
        style={{
          ...ellipsisProp,
        }}
      >
        {usePlaceholder(props.text || props.value)}
      </span>
    </Popover>
  );
  useEffect(() => {
    if (domRef.current?.scrollWidth > domRef.current?.clientWidth) {
      setEllipsis(true);
    }
  }, []);
  return (
    <div className={cls(prefixCls, props.className)} style={props.style}>
      {props.addonBefore}
      {props.prefix}
      <span ref={domRef}>{ellipsis ? ellipsisContent : content}</span>
      {props.suffix}
      {props.addonAfter}
    </div>
  );
};

const Select: React.FC<SelectProps<any>> = observer((props) => {
  const field = useField<Field>();
  const prefixCls = usePrefixCls('description-select', props);
  const dataSource: any[] = field?.dataSource?.length ? field.dataSource : props?.options?.length ? props.options : [];
  const placeholder = usePlaceholder();
  const getSelected = () => {
    const value = props.value;
    if (props.mode === 'multiple' || props.mode === 'tags') {
      if (props.labelInValue) {
        return isArr(value) ? value : [];
      } else {
        return isArr(value) ? value.map((val) => ({ label: val, value: val })) : [];
      }
    } else {
      if (props.labelInValue) {
        return isValid(value) ? [value] : [];
      } else {
        return isValid(value) ? [{ label: value, value }] : [];
      }
    }
  };

  const getLabels = () => {
    const selected = getSelected();
    if (!selected.length) return <Tag>{placeholder}</Tag>;
    return selected.map(({ value, label }, key) => {
      const text = dataSource?.find((item) => item.value == value)?.label || label;
      return <Tag key={key}>{text || placeholder}</Tag>;
    });
  };
  return (
    <div className={cls(prefixCls, props.className)} style={props.style}>
      {getLabels()}
    </div>
  );
});

const ObjectSelect: React.FC<SelectProps<any>> = observer((props) => {
  const field = useField<Field>();
  const prefixCls = usePrefixCls('description-select', props);
  const dataSource: any[] = field?.dataSource?.length ? field.dataSource : props?.options?.length ? props.options : [];
  const placeholder = usePlaceholder();
  const getSelected = () => {
    const value = props.value;
    if (props.mode === 'multiple' || props.mode === 'tags') {
      if (props.labelInValue) {
        return isArr(value) ? value : [];
      } else {
        return isArr(value) ? value.map((val) => ({ label: val, value: val })) : [];
      }
    } else {
      if (props.labelInValue) {
        return isValid(value) ? [value] : [];
      } else {
        return isValid(value) ? [{ label: value, value }] : [];
      }
    }
  };

  const getLabels = () => {
    const selected = getSelected();
    if (!selected.length) return <Tag>{placeholder}</Tag>;
    return selected.map(({ value, label }, key) => {
      const text = dataSource?.find((item) => item.value == value)?.label || label;
      return <Tag key={key}>{text || placeholder}</Tag>;
    });
  };
  return (
    <div className={cls(prefixCls, props.className)} style={props.style}>
      {getLabels()}
    </div>
  );
});

const TreeSelect: React.FC<TreeSelectProps<any>> = observer((props) => {
  const field = useField<Field>();
  const placeholder = usePlaceholder();
  const prefixCls = usePrefixCls('description-tree-select', props);
  const dataSource = field?.dataSource?.length ? field.dataSource : props?.options?.length ? props.options : [];
  const getSelected = () => {
    const value = props.value;
    if (props.multiple) {
      if (props.labelInValue) {
        return isArr(value) ? value : [];
      } else {
        return isArr(value) ? value.map((val) => ({ label: val, value: val })) : [];
      }
    } else {
      if (props.labelInValue) {
        return value ? [value] : [];
      } else {
        return value ? [{ label: value, value }] : [];
      }
    }
  };

  const findLabel = (value: any, dataSource: any[]) => {
    for (let i = 0; i < dataSource?.length; i++) {
      const item = dataSource[i];
      if (item?.value === value) {
        return item?.label;
      } else {
        const childLabel = findLabel(value, item?.children);
        if (childLabel) return childLabel;
      }
    }
  };

  const getLabels = () => {
    const selected = getSelected();
    if (!selected?.length) return <Tag>{placeholder}</Tag>;
    return selected.map(({ value, label }, key) => {
      return <Tag key={key}>{findLabel(value, dataSource) || label || placeholder}</Tag>;
    });
  };
  return (
    <div className={cls(prefixCls, props.className)} style={props.style}>
      {getLabels()}
    </div>
  );
});

const Cascader: React.FC<CascaderProps> = observer((props) => {
  const field = useField<Field>();
  const placeholder = usePlaceholder();
  const prefixCls = usePrefixCls('description-cascader', props);
  const dataSource: any[] = field?.dataSource?.length ? field.dataSource : props?.options?.length ? props.options : [];
  const getSelected = () => {
    return isArr(props.value) ? props.value : [];
  };
  const findLabel = (value: any, dataSource: any[]) => {
    for (let i = 0; i < dataSource?.length; i++) {
      const item = dataSource[i];
      if (item?.value === value) {
        return item?.label;
      } else {
        const childLabel = findLabel(value, item?.children);
        if (childLabel) return childLabel;
      }
    }
  };
  const getLabels = () => {
    const selected = getSelected();
    if (!selected?.length) {
      return placeholder;
    }
    return selected
      .map((value) => {
        return findLabel(value, dataSource) || placeholder;
      })
      .join('/');
  };
  return (
    <div className={cls(prefixCls, props.className)} style={props.style}>
      {getLabels()}
    </div>
  );
});

const DatePicker: React.FC<DatePickerProps> = (props: any) => {
  if (!props.value) {
    return <div></div>;
  }
  const placeholder = usePlaceholder();
  const prefixCls = usePrefixCls('description-date-picker', props);
  const getDefaultFormat = () => {
    const { dateFormat, showTime, timeFormat } = props;
    let format = dateFormat;
    if (showTime) {
      format += ` ${timeFormat}`;
    }
    return format || props.format;
  };
  const getLabels = () => {
    const d = moment(props.value);
    const labels = formatMomentValue(d.isValid() ? d : null, getDefaultFormat(), placeholder);
    return isArr(labels) ? labels.join('~') : labels;
  };
  return <div className={cls(prefixCls, props.className)}>{getLabels()}</div>;
};

const DateRangePicker: React.FC<DateRangePickerProps> = (props) => {
  const placeholder = usePlaceholder();
  const prefixCls = usePrefixCls('description-text', props);
  const getLabels = () => {
    const labels = formatMomentValue(props.value, props.format, placeholder);
    return isArr(labels) ? labels.join('~') : labels;
  };
  return (
    <div className={cls(prefixCls, props.className)} style={props.style}>
      {getLabels()}
    </div>
  );
};

const TimePicker: React.FC<TimePickerProps> = (props) => {
  const placeholder = usePlaceholder();
  const prefixCls = usePrefixCls('description-text', props);
  const getLabels = () => {
    const labels = formatMomentValue(props.value, props.format, placeholder);
    return isArr(labels) ? labels.join('~') : labels;
  };
  return (
    <div className={cls(prefixCls, props.className)} style={props.style}>
      {getLabels()}
    </div>
  );
};

const TimeRangePicker: React.FC<TimeRangePickerProps> = (props) => {
  const placeholder = usePlaceholder();
  const prefixCls = usePrefixCls('description-text', props);
  const getLabels = () => {
    const labels = formatMomentValue(props.value, props.format, placeholder);
    return isArr(labels) ? labels.join('~') : labels;
  };
  return (
    <div className={cls(prefixCls, props.className)} style={props.style}>
      {getLabels()}
    </div>
  );
};

export const Display = {
  Input,
  URL,
  TextArea,
  Select,
  ObjectSelect,
  TreeSelect,
  Cascader,
  DatePicker,
  DateRangePicker,
  TimePicker,
  TimeRangePicker,
  Placeholder,
  InputNumber,
  usePlaceholder,
};

export default Display;
