import React from 'react';
import { Select } from 'antd';
import { observer, useForm } from '@formily/react';

import {
  useCollectionManager,
  useCompile
} from '@nocobase/client';



export const FieldsSelect = observer((props: any) => {
  const { filter = () => true, ...others } = props;
  const compile = useCompile();
  const { getCollectionFields } = useCollectionManager();
  const { values } = useForm();
  const fields = getCollectionFields(values?.collection);

  return (
    <Select
      className="full-width"
      {...others}
      options={fields
        .filter(filter)
        .map(field => ({
          label: compile(field.uiSchema?.title),
          value: field.name
        }))
      }
    />
  );
});
