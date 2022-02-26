import { LoadingOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import React from 'react';
import { FilterAction } from './Filter.Action';
import { FilterDynamicValue } from './Filter.DynamicValue';
import { FilterGroup } from './FilterGroup';
import './style.less';

export const Filter: any = connect(
  (props) => {
    return <FilterGroup bordered={false} {...props} />;
  },
  mapProps((props, field) => {
    return {
      ...props,
      suffix: <span>{field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffix}</span>,
    };
  }),
  mapReadPretty((props) => {
    return null;
  }),
);

Filter.DynamicValue = FilterDynamicValue;
Filter.Action = FilterAction;

export default Filter;
