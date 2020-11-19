import React from 'react';
import Breadcrumb from './Breadcrumb';
import CollectionIndex from './CollectionIndex';
import CollectionSingle from './CollectionSingle';
import './style.less';
import { useRequest, request, Spin } from '@nocobase/client';
import api from '@/api-client';

export function CollectionLoader(props: any) {
  let { path, pagepath, collection } = props.match.params;
  if (path.startsWith(pagepath)) {
    path = path.substring(pagepath.length);
  }
  let matches: any;
  matches = /\/views\/([^/]+)/.exec(path);
  if (matches) {
    props.match.params['viewName'] = matches[1];
    path = path.substring(`/views/${matches[1]}`.length);
  }
  const re = /\/items\/([^/]+)\/tabs\/([^/]+)/g;
  matches = [...path.matchAll(re)];
  let items = matches.map((match, index) => ({
    itemId: match[1],
    tabName: match[2],
  }));
  props.match.params['items'] = items;
  console.log(props.match, path);
  const { data = {}, error, loading, run } = useRequest(() => api.resource(collection).getCollection());

  if (loading) {
    return <Spin/>;
  }

  return (
    <div className={'collection'}>
      <div className={'collection-index'}>
        { items.length === 0 && <CollectionIndex collection={data.data||{}} {...props}/> }
      </div>
      {items.length > 0 && (
        <div className={'collection-item'}>
          {/* <Breadcrumb>
            {items.map(item => <Breadcrumb.Item/>)}
          </Breadcrumb> */}
          {items.map(item => {
            return (
              <div className={'collection-single'}>
                <CollectionSingle item={item} collection={data.data||{}} {...props}/>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CollectionLoader;
