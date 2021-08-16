import React, { createContext, useContext } from 'react';
import { isArr, isValid } from '@formily/shared';
import { observer, useField } from '@formily/react';
import { InputProps } from 'antd/lib/input';
import { InputNumberProps } from 'antd/lib/input-number';
import { SelectProps } from 'antd/lib/select';
import { TreeSelectProps } from 'antd/lib/tree-select';
import { CascaderProps } from 'antd/lib/cascader';
import {
  DatePickerProps,
  RangePickerProps as DateRangePickerProps,
} from 'antd/lib/date-picker';
import { TimePickerProps, TimeRangePickerProps } from 'antd/lib/time-picker';
import { Tag, Space, Popover } from 'antd';
import cls from 'classnames';
import {
  formatMomentValue,
  usePrefixCls,
} from '@formily/antd/esm/__builtins__';
import { FullscreenOutlined } from '@ant-design/icons';
import moment from 'moment';

const PlaceholderContext = createContext<string>('N/A');

const Placeholder = PlaceholderContext.Provider;

const usePlaceholder = (value?: any) => {
  const placeholder = useContext(PlaceholderContext) || 'N/A';
  return isValid(value) && value !== '' ? value : placeholder;
};

const Input: React.FC<InputProps> = (props) => {
  const prefixCls = usePrefixCls('description-text', props);
  return (
    <Space className={cls(prefixCls, props.className)} style={props.style}>
      {props.addonBefore}
      {props.prefix}
      {usePlaceholder(props.value)}
      {props.suffix}
      {props.addonAfter}
    </Space>
  );
};

const URL: React.FC<InputProps> = (props) => {
  const prefixCls = usePrefixCls('description-text', props);
  const content = props.value && (
    <a target={'_blank'} href={props.value as any}>
      {props.value}
    </a>
  );
  return (
    <Space className={cls(prefixCls, props.className)} style={props.style}>
      {props.addonBefore}
      {props.prefix}
      {content}
      {props.suffix}
      {props.addonAfter}
    </Space>
  );
};

const InputNumber: React.FC<InputProps & InputNumberProps> = (props) => {
  const prefixCls = usePrefixCls('description-text', props);
  const value = usePlaceholder(props.value);
  return (
    <Space className={cls(prefixCls, props.className)} style={props.style}>
      {props.addonBefore}
      {props.prefix}
      {props.formatter ? props.formatter(value) : value}
      {props.suffix}
      {props.addonAfter}
    </Space>
  );
};

const TextArea: React.FC<any> = (props) => {
  const prefixCls = usePrefixCls('description-text', props);
  const ellipsis = props.ellipsis === true ? {} : props.ellipsis;
  const content = props.ellipsis ? (
    <div>
      <Popover content={usePlaceholder(props.value)}>
        <div
          style={{
            display: 'inline-block',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            width: 100,
            verticalAlign: 'middle',
            marginRight: 10,
            ...ellipsis,
          }}
        >
          {usePlaceholder(props.text || props.value)}
        </div>
      </Popover>
    </div>
  ) : (
    usePlaceholder(props.value)
  );
  return (
    <Space className={cls(prefixCls, props.className)} style={props.style}>
      {props.addonBefore}
      {props.prefix}
      {content}
      {props.suffix}
      {props.addonAfter}
    </Space>
  );
};

const Select: React.FC<SelectProps<any>> = observer((props) => {
  const field = useField<Formily.Core.Models.Field>();
  const prefixCls = usePrefixCls('description-text', props);
  const dataSource: any[] = field?.dataSource?.length
    ? field.dataSource
    : props?.options?.length
    ? props.options
    : [];
  const placeholder = usePlaceholder();
  const getSelected = () => {
    const value = props.value;
    if (props.mode === 'multiple' || props.mode === 'tags') {
      if (props.labelInValue) {
        return isArr(value) ? value : [];
      } else {
        return isArr(value)
          ? value.map((val) => ({ label: val, value: val }))
          : [];
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
      const text =
        dataSource?.find((item) => item.value == value)?.label || label;
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
  const field = useField<Formily.Core.Models.Field>();
  const prefixCls = usePrefixCls('description-text', props);
  const dataSource: any[] = field?.dataSource?.length
    ? field.dataSource
    : props?.options?.length
    ? props.options
    : [];
  const placeholder = usePlaceholder();
  const getSelected = () => {
    const value = props.value;
    if (props.mode === 'multiple' || props.mode === 'tags') {
      if (props.labelInValue) {
        return isArr(value) ? value : [];
      } else {
        return isArr(value)
          ? value.map((val) => ({ label: val, value: val }))
          : [];
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
      const text =
        dataSource?.find((item) => item.value == value)?.label || label;
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
  const field = useField<Formily.Core.Models.Field>();
  const placeholder = usePlaceholder();
  const prefixCls = usePrefixCls('description-text', props);
  const dataSource = field?.dataSource?.length
    ? field.dataSource
    : props?.options?.length
    ? props.options
    : [];
  const getSelected = () => {
    const value = props.value;
    if (props.multiple) {
      if (props.labelInValue) {
        return isArr(value) ? value : [];
      } else {
        return isArr(value)
          ? value.map((val) => ({ label: val, value: val }))
          : [];
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
      return (
        <Tag key={key}>
          {findLabel(value, dataSource) || label || placeholder}
        </Tag>
      );
    });
  };
  return (
    <div className={cls(prefixCls, props.className)} style={props.style}>
      {getLabels()}
    </div>
  );
});

const Cascader: React.FC<CascaderProps> = observer((props) => {
  const field = useField<Formily.Core.Models.Field>();
  const placeholder = usePlaceholder();
  const prefixCls = usePrefixCls('description-text', props);
  const dataSource: any[] = field?.dataSource?.length
    ? field.dataSource
    : props?.options?.length
    ? props.options
    : [];
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
    return <div>N/A</div>;
  }
  const placeholder = usePlaceholder();
  const prefixCls = usePrefixCls('description-text', props);
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
    const labels = formatMomentValue(
      d.isValid() ? d : null,
      getDefaultFormat(),
      placeholder,
    );
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
