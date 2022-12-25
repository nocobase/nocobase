import React, { useEffect, useMemo, useState } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';
import {
  BlockRequestContext,
  CollectionProvider,
  FormProvider,
  RecordIndexProvider,
  RecordProvider,
  RemoteSchemaComponent,
  SchemaComponent,
  useCollectionManager,
  useRequest,
  useSchemaComponentContext,
} from '../../../';
import { Button, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

import { createForm } from '@formily/core';

export function RouteSchemaComponent(props: any) {
  const match = useRouteMatch<any>();
  const history = useHistory();
  const { getCollection } = useCollectionManager();

  const subPage = props?.location?.query?.['sub-page'];
  const tab = props?.location?.query?.['tab'];
  if (subPage) {
    const [, subXUid, collectionName, filterTargetVal] = subPage?.split('/');
    if (subXUid && collectionName) {
      const collection = getCollection(collectionName);
      const filterTargetKey = collection?.filterTargetKey || 'id';
      const record = {};
      record[filterTargetKey] = filterTargetVal;
      const onBack = () => {
        history.push(tab ? `${history.location.pathname}?tab=${tab}` : history.location.pathname
        );
      };
      const { reset } = useSchemaComponentContext();
      const conf = {
        url: `/uiSchemas:getProperties/${subXUid}`,
      };
      const form = useMemo(() => createForm(), [subXUid]);
      const { data, loading } = useRequest(conf, {
        refreshDeps: [subXUid],
        onSuccess(data) {
          reset && reset();
        },
      });

      if (loading) {
        return <Spin />;
      }

      data.data.properties.tabs['x-component-props'].tabBarExtraContent = {
        left: <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} style={{ marginRight: 12 }} />,
      };

      return (
        <>
          <div style={{ marginLeft: 24, marginRight: 24, marginTop: 12 }}>
            <CollectionProvider name={collectionName}>
              <BlockRequestContext.Provider value={{}}>
                <RecordProvider record={record}>
                  <RecordIndexProvider index={0}>
                    <FormProvider form={form}>
                      <SchemaComponent memoized schema={data?.data || {}} />
                    </FormProvider>
                  </RecordIndexProvider>
                </RecordProvider>
              </BlockRequestContext.Provider>
            </CollectionProvider>
          </div>
        </>
      );
    }
  }

  return <RemoteSchemaComponent onlyRenderProperties uid={match.params.name} />;
}
