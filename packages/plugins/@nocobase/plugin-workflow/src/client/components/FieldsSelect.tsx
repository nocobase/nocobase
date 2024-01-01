import { observer, useForm } from '@formily/react';
import { Select } from 'antd';
import React from 'react';

import { useCollectionManagerV2, useCompile } from '@nocobase/client';

function defaultFilter() {
  return true;
}

export const FieldsSelect = observer(
  (props: any) => {
    const { filter = defaultFilter, ...others } = props;
    const compile = useCompile();
    const cm = useCollectionManagerV2();
    const { values } = useForm();
    const fields = cm.getCollectionFields(values?.collection);

    return (
      <Select
        popupMatchSelectWidth={false}
        {...others}
        options={fields.filter(filter).map((field) => ({
          label: compile(field.uiSchema?.title),
          value: field.name,
        }))}
      />
    );
  },
  { displayName: 'FieldsSelect' },
);
