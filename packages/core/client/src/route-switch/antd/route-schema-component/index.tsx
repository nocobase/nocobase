import { css } from '@emotion/css';
import { useRequest } from 'ahooks';
import { Spin } from 'antd';
import pathToRegexp from 'path-to-regexp';
import React from 'react';
import { useParams } from 'react-router-dom';
import { CollectionProvider, RecordProvider, RemoteSchemaComponent, useAPIClient } from '../../../';

export function RouteSchemaComponent(props: any) {
  const params = useParams<any>();
  return <RemoteSchemaComponent onlyRenderProperties uid={params.name} />;
}

const RemoteRecordProvider = (props) => {
  const { cid, association, aid, url } = props;
  const apiClient = useAPIClient();
  const { data, loading } = useRequest(() => {
    if ((association && aid) || (!association && cid)) {
      return Promise.resolve({});
    }
    return apiClient
      .request({
        url,
      })
      .then((res) => res.data);
  });
  if (!(association && aid) || (!association && cid)) {
    return <>{props.children}</>;
  }
  if (loading) {
    return <Spin />;
  }
  return <RecordProvider record={data?.['data'] || {}}>{props.children}</RecordProvider>;
};

export function PopupSchemaComponent(props: any) {
  const params = useParams<any>();
  const regexp = pathToRegexp(':collection/:cid?/:association?/:aid?');
  const match = regexp.exec(params['*']);
  const [_, collection, cid, association, aid] = match;
  return (
    <div
      className={css`
        .ant-tabs-nav {
          background: #fff;
          padding: 0 24px;
          margin-bottom: 0;
        }
        .ant-tabs-content-holder {
          padding: 24px;
        }
      `}
    >
      <CollectionProvider name={collection}>
        <RemoteRecordProvider url={params['*']} collection={collection} cid={cid} association={association} aid={aid}>
          <RemoteSchemaComponent onlyRenderProperties uid={params.popupId} />
        </RemoteRecordProvider>
      </CollectionProvider>
    </div>
  );
}
