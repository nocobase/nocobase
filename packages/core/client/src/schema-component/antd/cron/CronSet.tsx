import { connect, mapReadPretty, useFieldSchema } from '@formily/react';
import { Select, SelectProps } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useCollection } from '../../../collection-manager';
import { useCompile } from '../../hooks';
import { EllipsisWithTooltip } from '../input';
import Cron from './Cron';

interface CronSetProps extends SelectProps {
  onChange: (v: string) => void;
}

const CronSetInternal = (props: CronSetProps) => {
  const { onChange, value } = props;
  const { getField } = useCollection();
  const fieldSchema = useFieldSchema();
  const uiSchemaOptions = getField(fieldSchema?.name)?.uiSchema.enum;
  const compile = useCompile();

  const [customizeOption, setCustomizeOption] = useState({
    label: "{{t('Custom')}}",
    value: '@daily',
  });

  const options = useMemo(() => {
    return (props.options || [])
      .concat((uiSchemaOptions as any[]) || [])
      .concat([customizeOption])
      .map((item) => {
        return {
          ...item,
          label: compile(item.label),
        };
      });
  }, [props.options, customizeOption]);

  useEffect(() => {
    if (typeof value === 'undefined' || value === null) {
      return;
    }
    const item = options.find((o) => o.value === value);
    if (!item) {
      setCustomizeOption({
        ...customizeOption,
        value,
      });
    }
  }, [options, value]);

  const isCustomize = useMemo(() => {
    return value === customizeOption.value;
  }, [value, customizeOption]);

  const onCronChange = (value, customize = false) => {
    if (customize) {
      setCustomizeOption({
        ...customizeOption,
        value,
      });
    }
    onChange(value);
  };

  return (
    <fieldset>
      <Select
        data-testid="antd-select"
        popupMatchSelectWidth={false}
        allowClear
        {...props}
        value={value}
        options={options}
        onChange={(value) => onCronChange(value)}
      ></Select>
      {isCustomize ? (
        <Cron
          value={value}
          onChange={(v) => onCronChange(v, true)}
          allowedDropdowns={['period', 'week-days', 'months', 'month-days']}
          allowedPeriods={['year', 'month', 'week', 'day']}
        />
      ) : null}
    </fieldset>
  );
};

const ReadPretty = (props: CronSetProps) => {
  const { value } = props;
  const compile = useCompile();
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection();
  const uiSchemaOptions = getField(fieldSchema?.name)?.uiSchema.enum;

  const options = useMemo(() => {
    return (props.options || []).concat((uiSchemaOptions as any[]) || []);
  }, [props.options]);

  const label = useMemo(() => {
    return value && options?.find((o) => o.value === value)?.label;
  }, [options, value]);

  return (
    <EllipsisWithTooltip ellipsis>
      {value && (label ? compile(label) : <Cron.ReadPretty {...props} />)}
    </EllipsisWithTooltip>
  );
};

export const CronSet = connect(CronSetInternal, mapReadPretty(ReadPretty));
