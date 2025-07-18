/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DatePicker, Picker } from 'antd-mobile';
import { Space, Select } from 'antd';
import {
  mapDatePicker,
  DatePicker as NBDatePicker,
  useDatePickerContext,
  useCompile,
  inferPickerType,
  TimePicker as NBTimePicker,
  mapTimeFormat,
  useVariables,
  isVariable,
  useLocalVariables,
} from '@nocobase/client';
import { autorun } from '@formily/reactive';
import dayjs from 'dayjs';
import { connect, mapProps, mapReadPretty, useField, useFieldSchema } from '@formily/react';
import { getPickerFormat } from '@nocobase/utils/client';
import { useTranslation } from 'react-i18next';

function getPrecision(timeFormat: string): 'hour' | 'minute' | 'second' {
  const lowerFormat = timeFormat.toLowerCase();

  if (/\bss?\b/.test(lowerFormat)) {
    return 'second';
  } else if (/\bmm?\b/.test(lowerFormat)) {
    return 'minute';
  } else if (/\bhh?\b/.test(lowerFormat)) {
    return 'hour';
  } else {
    throw new Error('Invalid time format');
  }
}

const MobileDateTimePicker = connect(
  (props) => {
    const { t } = useTranslation();
    const {
      value,
      onChange,
      dateFormat = 'YYYY-MM-DD',
      timeFormat = 'HH:mm',
      showTime = false,
      picker,
      disabled,
      ...rest
    } = props;
    const [visible, setVisible] = useState(false);
    const { parseVariable } = useVariables() || {};
    const localVariables = useLocalVariables();
    const [minDate, setMinDate] = useState(null);
    const [maxDate, setMaxDate] = useState(null);
    const disposeRef = useRef(null);

    useEffect(() => {
      if (disposeRef.current) {
        disposeRef.current();
      }
      disposeRef.current = autorun(() => {
        limitDate();
      });
      return () => {
        disposeRef.current();
      };
    }, [props._maxDate, props._minDate, localVariables, parseVariable]);

    const limitDate = async () => {
      // dayjs() 如果传入 undefined 可能会被解析成当前时间
      let minDateTimePromise = props._minDate ? Promise.resolve(dayjs(props._minDate)) : Promise.resolve(null);
      let maxDateTimePromise = props._maxDate ? Promise.resolve(dayjs(props._maxDate)) : Promise.resolve(null);

      if (isVariable(props._maxDate)) {
        maxDateTimePromise = parseVariable(props._maxDate, localVariables).then((result) => dayjs(result.value));
      }
      if (isVariable(props._minDate)) {
        minDateTimePromise = parseVariable(props._minDate, localVariables).then((result) => dayjs(result.value));
      }

      const [minDateTime, maxDateTime] = await Promise.all([minDateTimePromise, maxDateTimePromise]);
      setMinDate(minDateTime ? minDateTime.toDate() : null);
      setMaxDate(maxDateTime ? maxDateTime.toDate() : null);
    };

    const handleConfirm = useCallback(
      (value) => {
        setVisible(false);
        const selectedDateTime = new Date(value);
        onChange(selectedDateTime);
      },
      [showTime, onChange],
    );

    // 清空选择的日期和时间
    const handleClear = useCallback(() => {
      setVisible(false);
      onChange(null);
    }, [onChange]);

    const labelRenderer = useCallback((type: string, data: number) => {
      switch (type) {
        case 'year':
          return data;
        case 'quarter':
          return data;
        default:
          return data;
      }
    }, []);
    return (
      <>
        <div contentEditable="false" onClick={() => !disabled && setVisible(true)}>
          <NBDatePicker
            onClick={() => setVisible(true)}
            value={value}
            picker={picker}
            disabled={disabled}
            {...rest}
            popupStyle={{ display: 'none' }}
            style={{ pointerEvents: 'none', width: '100%' }}
          />
        </div>
        <DatePicker
          {...rest}
          cancelText={t('Cancel')}
          confirmText={t('Confirm')}
          visible={visible}
          title={<a onClick={handleClear}>{t('Clear')}</a>}
          onClose={() => {
            setVisible(false);
          }}
          precision={showTime && picker === 'date' ? getPrecision(timeFormat) : picker === 'date' ? 'day' : picker}
          renderLabel={labelRenderer}
          min={minDate || rest.min || new Date(1950, 0, 1)}
          max={maxDate || rest.max || new Date(2050, 11, 31)}
          onConfirm={(val) => {
            handleConfirm(val);
          }}
        />
      </>
    );
  },
  mapProps(mapDatePicker()),
  mapReadPretty(NBDatePicker.ReadPretty),
);

const MobileRangePicker = (props) => {
  const [startDate, setStartDate] = useState(props.value?.[0]);
  const [endDate, setEndDate] = useState(props.value?.[1]);
  const { t } = useTranslation();

  const handleStartDateChange = (value) => {
    const selectedDateTime = new Date(value);
    props.onChange([selectedDateTime, props.value?.[1]]);
    setStartDate(selectedDateTime);
    if (endDate && value > endDate) {
      setEndDate(null); // 重置结束日期
    }
  };

  const handleEndDateChange = (value) => {
    const selectedDateTime = new Date(value);
    props.onChange([props.value?.[0], selectedDateTime]);
    setEndDate(selectedDateTime);
  };
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}
    >
      <div style={{ flex: 1, marginRight: '8px' }}>
        <MobileDateTimePicker
          {...props}
          value={startDate}
          max={endDate}
          onChange={handleStartDateChange}
          style={{ width: '100%' }}
          placeholder={t('Start date')}
        />
      </div>
      <span
        style={{
          margin: '0px',
          fontSize: '16px',
          color: '#333',
        }}
      >
        ~
      </span>
      <div style={{ flex: 1, marginLeft: '8px' }}>
        <MobileDateTimePicker
          {...props}
          value={endDate}
          min={startDate}
          onChange={handleEndDateChange}
          style={{ width: '100%' }}
          placeholder={t('End date')}
        />
      </div>
    </div>
  );
};

const MobileDateFilterWithPicker = (props: any) => {
  const { picker = 'date', format } = props;
  const { utc = true } = useDatePickerContext();
  const value = Array.isArray(props.value) ? props.value[0] : props.value;
  const compile = useCompile();
  const fieldSchema = useFieldSchema();
  const targetPicker = value ? inferPickerType(value) : picker;
  const targetFormat = getPickerFormat(targetPicker) || format;
  const field: any = useField();
  const newProps = {
    utc,
    ...props,
    underFilter: true,
    showTime: props.showTime ? { defaultValue: dayjs('00:00:00', 'HH:mm:ss') } : false,
    format: targetFormat,
    picker: targetPicker,
    onChange: (val) => {
      props.onChange(undefined);
      setTimeout(() => {
        props.onChange(val);
      });
    },
  };
  const [stateProps, setStateProps] = useState(newProps);
  return (
    <Space.Compact>
      <Select
        // @ts-ignore
        role="button"
        data-testid="select-picker"
        style={{ width: '100px' }}
        popupMatchSelectWidth={false}
        defaultValue={targetPicker}
        options={compile([
          {
            label: '{{t("Date")}}',
            value: 'date',
          },

          {
            label: '{{t("Month")}}',
            value: 'month',
          },
          {
            label: '{{t("Quarter")}}',
            value: 'quarter',
          },
          {
            label: '{{t("Year")}}',
            value: 'year',
          },
        ])}
        onChange={(value) => {
          const format = getPickerFormat(value);
          field.setComponentProps({
            picker: value,
            format,
          });
          newProps.picker = value;
          newProps.format = format;
          setStateProps(newProps);
          fieldSchema['x-component-props'] = {
            ...props,
            picker: value,
            format,
          };
          field.value = null;
        }}
      />
      <MobileDateTimePicker {...stateProps} value={value} />
    </Space.Compact>
  );
};

type ComposedMobileTimePicker = React.FC<any> & {
  RangePicker?: React.FC<any>;
  ReadPretty?: React.FC<any>;
};

const MobileTimePicker: ComposedMobileTimePicker = connect(
  (props) => {
    const [visible, setVisible] = useState(false);
    // 小时、分钟和秒的数据
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
    const seconds = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    const timeData = [
      hours, // 小时
      minutes, // 分钟
      seconds, // 秒
    ];
    const handleTimeChange = (value: [string, string, string]) => {
      props.onChange(`${value[0]}:${value[1]}:${value[2]}`);
      setVisible(false);
    };

    return (
      <div contentEditable="false" onClick={() => setVisible(true)}>
        <NBTimePicker {...props} style={{ pointerEvents: 'none' }} />
        <Picker onConfirm={handleTimeChange} columns={timeData} visible={visible} />
      </div>
    );
  },
  mapProps(mapTimeFormat()),
  mapReadPretty(NBTimePicker.ReadPretty),
);

MobileDateTimePicker.displayName = 'MobileDateTimePicker';
MobileRangePicker.displayName = 'MobileRangePicker';
MobileDateFilterWithPicker.displayName = 'MobileDateFilterWithPicker';
MobileTimePicker.displayName = 'MobileTimePicker';

MobileTimePicker.RangePicker = NBTimePicker.RangePicker;
export { MobileDateTimePicker, MobileRangePicker, MobileDateFilterWithPicker, MobileTimePicker };
