import { Spin } from 'antd';
import React from 'react';
import { useRouteMatch } from 'react-router-dom';
import { useRequest } from '..';

export const WorkflowPage = () => {
  const { params } = useRouteMatch();
  const { loading, data } = useRequest(
    {
      resource: 'workflows',
      action: 'get',
      params: {
        filter: params,
        appends: ['nodes']
      },
    }
  );

  return loading
    ? (
      <Spin />
    )
    : (
      <div>{data.data.title}</div>
    );
};
