import { useAPIClient, useRequest } from '@nocobase/client';
import { Button, Table } from 'antd';
import { saveAs } from 'file-saver';
import React from 'react';
import { DuplicatorSteps } from './DuplicatorSteps';

export const DuplicatorDump = () => {
  const api = useAPIClient();
  const { data, loading } = useRequest({
    resource: 'duplicator',
    action: 'getDict',
  });

  const steps = [
    {
      title: '选择功能模块',
      buttonText: '下一步',
      showButton: true,
      handler: async () => {
        const response = await api.request({
          url: 'duplicator:dump',
          method: 'post',
          responseType: 'blob',
        });
        const match = /filename="(.+)"/.exec(response?.headers?.['content-disposition'] || '');
        const filename = match ? match[1] : 'duplicator.nbdump';
        let blob = new Blob([response.data]);
        saveAs(blob, filename);
      },
    },
    {
      title: '选择自定义数据表',
      buttonText: '确认导出',
      showButton: true,
    },
    {
      title: '确认导出',
      buttonText: '',
      showButton: false,
    },
  ];

  const handleChange = (current) => {};

  return (
    <DuplicatorSteps steps={steps} onChange={handleChange}>

    </DuplicatorSteps>
  );
};
