import { ArrayField } from '@formily/core';
import { observer, useField } from '@formily/react';
import { useCollection } from '@nocobase/client';
import { uid } from '@nocobase/utils';
import { cloneDeep } from 'lodash';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FieldItem } from './FieldItem';
import { useFields } from './useFields';

export const ExportSettings = observer((props: any) => {
  const field = useField<ArrayField>();
  const { initialValues = [] } = props;
  const { name } = useCollection();
  const fields = useFields(name);
  const { t } = useTranslation();

  useEffect(() => {
    field.value = initialValues;
  }, []);

  const removeFieldItemHandler = (index) => {
    return () => {
      const values = cloneDeep(field.value);
      values.splice(index, 1);
      field.value = values;
    };
  };

  return (
    <>
      {field.value?.map((val, index) => {
        return (
          <FieldItem
            key={uid()}
            fields={fields}
            index={index}
            value={val}
            values={field.value}
            removeFieldItem={removeFieldItemHandler(index)}
          />
        );
      })}
      <div style={{ marginTop: 8, marginBottom: 8 }}>
        <a
          onClick={() => {
            const items = field.value ?? [];
            items.push({});
            field.value = items;
          }}
        >
          {t('Add exported field')}
        </a>
      </div>
    </>
  );
});
