import React, { useEffect, useMemo, useState } from 'react';
import { Select, SelectProps } from 'antd';
import Cron, { ReadPretty as CronReadPretty } from './Cron';
import { connect, mapReadPretty, useField, useFieldSchema } from '@formily/react';
import { useCollection } from '../../../collection-manager';
import { useCompile } from '../../hooks';

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
    label: "{{t('Customize')}}",
    value: '* * * * *',
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
      <Select {...props} value={value} options={options} onChange={(value) => onCronChange(value)}></Select>
      {isCustomize ? <Cron value={value} setValue={(v) => onCronChange(v, true)} clearButton={false} /> : null}
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

  return <>{value && (label ? compile(label) : <CronReadPretty {...props} />)}</>;
};

export const CronSet = connect(CronSetInternal, mapReadPretty(ReadPretty));
