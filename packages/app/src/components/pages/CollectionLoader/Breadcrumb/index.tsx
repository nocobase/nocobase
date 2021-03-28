import React from 'react';
import { PageHeader, Tabs, Button, Statistic, Descriptions } from 'antd';
import './style.less';

export function Breadcrumb(props) {
  return <div className={'breadcrumb'}>{props.children}</div>;
}

Breadcrumb.Item = props => {
  return <div className={'breadcrumb-item'}>标题一</div>;
};

export default Breadcrumb;
