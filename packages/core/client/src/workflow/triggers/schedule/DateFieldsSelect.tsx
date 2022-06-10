import React from "react";
import { observer, useForm } from "@formily/react";
import { Select } from "antd";

import { useCollectionManager, useCompile } from "@nocobase/client";

export const DateFieldsSelect: React.FC<any> = observer((props) => {
  const compile = useCompile();
  const { getCollectionFields } = useCollectionManager();
  const { values } = useForm();
  const fields = getCollectionFields(values?.config?.collection);

  return (
    <Select {...props}>
      {fields
        .filter(field => (
          !field.hidden
          && (field.uiSchema ? field.type === 'date' : false)
        ))
        .map(field => (
          <Select.Option key={field.name} value={field.name}>{compile(field.uiSchema?.title)}</Select.Option>
        ))}
    </Select>
  );
});
