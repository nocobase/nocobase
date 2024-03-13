import React from 'react';
import { FormV2 } from '../form-v2';
import { useDetailsBlockContext } from '../../../block-provider/DetailsBlockProvider';
import _ from 'lodash';
import { Empty } from 'antd';
import { useDataBlockRequest } from '../../../data-source';

export const Details = (props) => {
  const request = useDataBlockRequest();

  if (!request?.loading && _.isEmpty(request?.data?.data)) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return <FormV2 {...props} />;
};
