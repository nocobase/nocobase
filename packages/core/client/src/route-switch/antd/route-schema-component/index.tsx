import React from 'react';
import {useHistory, useRouteMatch} from 'react-router-dom';
import {
  BlockRequestContext,
  CollectionProvider,
  RecordIndexProvider,
  RecordProvider,
  RemoteSchemaComponent,
} from '../../../';
import { PageHeader as AntdPageHeader } from 'antd';

export function RouteSchemaComponent(props: any) {
  const match = useRouteMatch<any>();
  const history = useHistory();

  const { filterTargetKey, filterTargetVal, collectionName, subXUid, title, subTitle,serviceParams } = props?.location?.query;

  if (subXUid) {
    const record = {};
    record[filterTargetKey] = filterTargetVal;
    const onBack = ()=>{
      history.push(history.location.pathname,{serviceParams})
    }
    return (
      <>
        <AntdPageHeader ghost={false} onBack={onBack} title={title} subTitle={subTitle} />
        <div style={{ margin: 24 }}>
          <CollectionProvider name={collectionName}>
            <BlockRequestContext.Provider value={{}}>
              <RecordProvider record={record}>
                <RecordIndexProvider index={0}>
                  <RemoteSchemaComponent onlyRenderProperties uid={subXUid} />
                </RecordIndexProvider>
              </RecordProvider>
            </BlockRequestContext.Provider>
          </CollectionProvider>
        </div>
      </>
    );
  }
  return <RemoteSchemaComponent onlyRenderProperties uid={match.params.name} />;
}
