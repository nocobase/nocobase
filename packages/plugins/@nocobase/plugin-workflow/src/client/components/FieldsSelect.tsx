import { observer, useForm } from '@formily/react';
import { Select } from 'antd';
import React from 'react';

import { useCollectionManager, useCompile } from '@nocobase/client';

function defaultFilter() {
  return true;
}

export const FieldsSelect = observer(
  (props: any) => {
    const { filter = defaultFilter, ...others } = props;
    const compile = useCompile();
    const { getCollectionFields } = useCollectionManager();
    const { values } = useForm();
    const fields = getCollectionFields(values?.collection);

    return (
      <Select
        data-testid="antd-select"
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
