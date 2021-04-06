import React from 'react';
import { PageHeader, Card, Row, Col, Modal, message } from 'antd';
import './style.less';
import { Helmet, useHistory } from 'umi';
import { Spin } from '@/components/spin';
import { useRequest, useModel } from 'umi';
import api from '@/api-client';
import View from '@/components/views';
import get from 'lodash/get';
import { markdown } from '@/components/views/Field';

export function Page(props: any) {
  const { currentRowId, pageName, children, ...restProps } = props;
  const { initialState = {}, refresh, setInitialState } = useModel(
    '@@initialState',
  );
  const siteTitle = get(initialState, 'systemSettings.title') || 'NocoBase';

  const { data = {}, loading, error } = useRequest(
    () =>
      api.resource('menus').getInfo({
        resourceKey: pageName,
      }),
    {
      refreshDeps: [pageName],
    },
  );

  const history = useHistory();

  if (error) {
    return null;
  }

  if (loading) {
    return <Spin />;
  }

  const views = data.views || [];

  return (
    <div>
      <Helmet>
        <title>
          {data.title} - {siteTitle}
        </title>
      </Helmet>
      <PageHeader title={data.title} ghost={false} {...restProps} />
      <div className={'page-content'}>
        <div className={'noco-row'}>
          {views.map(view => {
            let viewName: string;
            let span = 24;
            let float = 'left';
            if (typeof view === 'string') {
              viewName = view;
            }
            if (typeof view === 'object') {
              viewName = `${view.name}`;
              if (view.width === '50%') {
                span = 12;
              } else if (view.width === '100%') {
                span = 24;
              }
              if (view.float == 'right') {
                float = 'right';
              }
            }
            return (
              <div key={view.__index} className={`noco-col noco-col-${span} float-${float}`}>
                <View
                  wrapper={'card'}
                  currentRowId={currentRowId}
                  onDraft={() => {
                    if (!view.draft) {
                      message.success('草稿保存成功');
                      return;
                    }
                    if (
                      view.draft.returnType === 'message' &&
                      view.draft.message
                    ) {
                      Modal.success({
                        title: '草稿保存成功',
                        content: (
                          <div
                            dangerouslySetInnerHTML={{
                              __html: markdown(view.draft.message),
                            }}
                          />
                        ),
                      });
                    } else if (view.draft.returnType === 'redirect') {
                      const path = get(view, 'draft.redirect.name');
                      path && history.push(`${path}`);
                    }
                  }}
                  onFinish={() => {
                    if (view.returnType === 'message' && view.message) {
                      Modal.success({
                        title: '提交成功',
                        content: (
                          <div
                            dangerouslySetInnerHTML={{
                              __html: markdown(view.message),
                            }}
                          />
                        ),
                      });
                    } else if (view.returnType === 'redirect') {
                      const path = get(view, 'redirect.name');
                      path && history.push(`${path}`);
                    }
                  }}
                  viewName={viewName}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Page;
