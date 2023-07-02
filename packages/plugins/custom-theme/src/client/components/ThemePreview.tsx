import { Card, Space } from 'antd';
import React from 'react';

import Button from './button/button-icon';
import Menu from './menu/menu';
import Pagination from './pagination/outline';
import Popconfirm from './popconfirm/popconfirm';
import Radio from './radio/radio';
import Steps from './steps/steps';
import Tabs from './tabs/tabs';

export const ThemePreview = ({ id }: { id?: string }) => {
  return (
    <Card size={'small'} id={id}>
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

ThemePreview.displayName = 'ThemePreview';
