import { CloseOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { Field, observer, useField } from '@formily/react';
import { uid } from '@formily/shared';
import { Popover } from 'antd';
import { isPlainObject } from 'lodash';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaComponent } from '../../..';
import { useOperator } from './hooks';

const toValue = (t) => {
  if (typeof t === 'string' && t.endsWith('Z')) {
    return t.replace(/Z$/, '');
  }
  return t;
};

const FilterWithPicker = observer((props: any) => {
  const { schema, operator, value, onChange } = props;
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const componentSchema = {
    [uid()]: {
      ...schema,
      'x-component-props': {
        ...schema?.['x-component-props'],
        open,
        onChange: (v) => {
          onChange(v);
          setOpen(false);
        },
      },
      'x-decorator-props': {
        ...schema?.['x-decorator-props'],
        style: {
          padding: 16,
        },
      },
      'x-decorator': 'FormV2',
      'x-component': operator.component || 'DatePicker.Filter',
    },
  };

  const renderValue = () => {
    if (!value) {
      return <span style={{ color: '#bfbfbf' }}>{t('Select date')}</span>;
    }
    if (Array.isArray(value)) {
      return value.join('~');
    }
    if (isPlainObject(value)) {
      return `{{t("${value.type}")}}`;
    }
    return toValue(value);
  };

  return (
    <div
      className={css`
        position: relative;
        .nb-filter-picker-result {
          cursor: pointer;
        }
        .nb-filter-picker-clear {
          position: absolute;
          right: 0;
          top: 0;
          opacity: 0;
          pointer-events: none;
          transition: all 0.3s;
        }
        &:hover {
          .nb-filter-picker-clear {
            opacity: 1;
            pointer-events: all;
          }
        }
      `}
    >
      <div className={'nb-filter-picker-result'} onClick={() => setOpen(true)}>
        {renderValue()}
      </div>
      {value && (
        <CloseOutlined
          className={'nb-filter-picker-clear'}
          onClick={() => {
            onChange(null);
          }}
        />
      )}
      <Popover
        open={open}
        onOpenChange={(open) => {
          setOpen(open);
        }}
        content={<SchemaComponent schema={componentSchema} />}
      >
        <div style={{ display: 'none' }}></div>
      </Popover>
    </div>
  );
});

export const Picker = observer(
  (props: any) => {
    const { schema } = props;
    const field = useField<Field>();
    const operator = useOperator();
    const value = field.value?.[operator.value];
    if (operator.noValue) {
      return null;
    }
    if (operator.component) {
      const componentSchema = {
        [uid()]: {
          ...schema,
          'x-component-props': {
            ...schema?.['x-component-props'],
            value: value,
            onChange(v) {
              field.value = {
                [operator.value]: v,
              };
            },
          },
          'x-component': operator.component,
        },
      };
      return <SchemaComponent schema={componentSchema} />;
    }
    return (
      <FilterWithPicker
        value={toValue(value)}
        onChange={(v) => {
          if (!v) {
            field.value = null;
            return;
          }
          field.value = {
            [operator.value]: v,
          };
        }}
        schema={schema}
        operator={operator}
      />
    );
  },
  {
    scheduler: (update) => {
      update();
    },
  },
);