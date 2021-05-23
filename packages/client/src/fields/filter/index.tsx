import React, { useEffect } from 'react'
import { connect, mapProps, mapReadPretty, useFieldSchema } from '@formily/react'
import { LoadingOutlined } from '@ant-design/icons'
import { useDynamicList } from 'ahooks';
import { Group, FilterSourceFieldsContext } from './Group'

export const Filter = connect(
  (props) => {
    const schema = useFieldSchema();
    return (
      <FilterSourceFieldsContext.Provider value={schema['x-source-fields']}>
        <Group/>
      </FilterSourceFieldsContext.Provider>
    );
  },
  mapProps((props, field) => {
    return {
      ...props,
      suffix: (
        <span>
          {field?.['loading'] || field?.['validating'] ? (
            <LoadingOutlined />
          ) : (
            props.suffix
          )}
        </span>
      ),
    }
  }),
  mapReadPretty((props) => {
    return null;
  })
)

export default Filter;

