import { RightOutlined } from '@ant-design/icons';
import { Plugin } from '@nocobase/client';
import { Button, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import React, { lazy } from 'react';
import { NAMESPACE } from '../locale';

const CalendarProvider = React.memo((props) => {
  return <div></div>;
});
CalendarProvider.displayName = 'CalendarProvider';

export class CalendarPlugin extends Plugin {
  async load() {
    this.app.use(CalendarProvider);
  }
}

export default CalendarPlugin;
