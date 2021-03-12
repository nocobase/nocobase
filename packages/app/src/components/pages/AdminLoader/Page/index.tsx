import React from 'react';
import { PageHeader, Card, Row, Col, Modal, message } from 'antd';
import './style.less';
import { Helmet, useHistory } from 'umi';
import { Spin } from '@nocobase/client';
import { useRequest, useLocation } from 'umi';
import api from '@/api-client';
import View from '../View';
import get from 'lodash/get';
import { markdown } from '@/components/views/Field';

export function Page(props: any) {
  const { currentRowId, pageName, children, ...restProps } = props;

  const { data = {}, loading, error } = useRequest(() => api.resource('menus').getInfo({
    resourceKey: pageName,
  }), {
    refreshDeps: [pageName],
  });

  const history = useHistory();

  if (error) {
    return null;
  }

  if (loading) {
    return <Spin/>
  }

  const views = data.views || [];

  return (
    <div>
      <Helmet>
        <title>{data.title}</title>
      </Helmet>
      <PageHeader
        title={data.title}
        ghost={false}
        {...restProps}
      />
      <div className={'page-content'}>
        <Row gutter={24}>
        {views.map(view => {
          let viewName: string;
          let span = 24;
          if (typeof view === 'string') {
            viewName = view;
          } if (typeof view === 'object') {
            viewName = `${view.name}`;
            if (view.width === '50%') {
              span = 12;
            } else if (view.width === '100%') {
              span = 24;
            }
          }
          return (
            <Col style={{marginBottom: 24}} span={span}>
              <Card bordered={false}>
                <View 
                  currentRowId={currentRowId}
                  onDraft={() => {
                    message.success('草稿保存成功');
                  }}
                  onFinish={() => {
                    if (view.returnType === 'message' && view.message) {
                      Modal.success({
                        title: '提交成功',
                        content: markdown(view.message),
                      });
                    } else if (view.returnType === 'redirect') {
                      const path = get(view, 'redirect.name');
                      path && history.push(`${path}`);
                    }
                  }} 
                  viewName={viewName}
                />
              </Card>
            </Col>
          );
        })}
        </Row>
      </div>
    </div>
  );
};

export default Page;
