import { onFormValuesChange } from '@formily/core';
import { connect, mapReadPretty, useFieldSchema, useFormEffects } from '@formily/react';
import { Input  } from 'antd';
import _ from 'lodash';
import React from 'react';
import { useCollection } from '../../../collection-manager/hooks';
import { ReadPretty } from '../input-number/ReadPretty';
import { getHotExcelParser } from '@nocobase/utils/client';

const AntdCompute = (props) => {
  const { onChange, ...others } = props;
  const { getField } = useCollection();
  const fieldSchema = useFieldSchema();
  const options = getField(fieldSchema.name);
  const { expression } = options;

  useFormEffects(() => {
    onFormValuesChange((form) => {
      const scope = _.cloneDeep(form.values);
      let result;
      try {
        let parser = getHotExcelParser(scope)
        let response = parser.parse(expression)
        if (!response.error) {
          result = response.result
        }
      } catch{}
      if (onChange) {
        onChange(result);
      }
    });
  });

  return <Input {...others} readOnly disabled stringMode={true} />;
};

export const Compute = connect(AntdCompute, mapReadPretty(ReadPretty));

export default Compute;
