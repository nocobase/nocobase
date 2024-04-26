import React from 'react';
import { FormV2 } from '../form-v2';
import _ from 'lodash';
import { Empty } from 'antd';
import { useDataBlockRequest } from '../../../data-source';
import { withDynamicSchemaProps } from '../../../application/hoc/withDynamicSchemaProps';
import { FormProps } from '../form-v2/Form';

export type DetailsProps = FormProps;

export const Details = withDynamicSchemaProps(
  (props: DetailsProps) => {
    const request = useDataBlockRequest();

    if (!request?.loading && _.isEmpty(request?.data?.data)) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    return <FormV2 {...props} />;
  },
  { displayName: 'Details' },
);
