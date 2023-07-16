import { Card, Space } from 'antd';
import React from 'react';

import Button from '../component-demos/button/button-icon';
import Menu from '../component-demos/menu/menu';
import Pagination from '../component-demos/pagination/outline';
import Popconfirm from '../component-demos/popconfirm/popconfirm';
import Radio from '../component-demos/radio/radio';
import Steps from '../component-demos/steps/steps';
import Tabs from '../component-demos/tabs/tabs';

export const Primary = ({ id }: { id?: string }) => {
  return (
    <Card size={'small'} bordered={false} id={id}>
      <Space direction={'vertical'}>
        <Space align={'start'} size={'large'}>
          {Menu.demo}
          <Space direction={'vertical'} size={'large'}>
            <Space size={'large'} align={'start'}>
              <Space direction={'vertical'} size={'large'}>
                <div>{Button.demo}</div>
                <div>
                  <span>{Radio.demo}</span>
                  {/* {Checkbox.demo} */}
                  {/* {Switch.demo} */}
                </div>
                {/* <div>{RadioButton.demo}</div> */}
                {Tabs.demo}
                {Popconfirm.demo}
              </Space>
              {/* {SelectTag.demo} */}
            </Space>
            {Pagination.demo}
            <div style={{ padding: 12 }}>{Steps.demo}</div>
            <Space size={'large'} align={'start'}>
              {/* {Timeline.demo} */}
            </Space>
          </Space>
        </Space>
        {/* {Table.demo} */}
      </Space>
    </Card>
  );
};

Primary.displayName = 'Primary';
