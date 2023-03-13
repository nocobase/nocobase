import { Empty } from 'antd';
import React from 'react';
import { useDetailsBlockContext } from '../../../block-provider/DetailsBlockProvider';
import { FormV2 } from '../form-v2';

export const Details = (props = {}) => {
  const ctx = useDetailsBlockContext();
  const count = ctx.service?.data?.meta?.count || 0;

  return count ? <FormV2 {...props} /> : <Empty />;
};
