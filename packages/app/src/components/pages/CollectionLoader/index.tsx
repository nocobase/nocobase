import React from 'react';
import Breadcrumb from './Breadcrumb';
import CollectionIndex from './CollectionIndex';
import CollectionSingle from './CollectionSingle';
import './style.less';

export function CollectionLoader(props: any) {
  let { path, pagepath, collection } = props.match.params;
  if (path.startsWith(pagepath)) {
    path = path.substring(pagepath.length);
  }
  let matches: any;
  matches = /\/views\/([^/]+)/.exec(path);
  if (matches) {
    props.match.params['viewId'] = matches[1];
    path = path.substring(`/views/${matches[1]}`.length);
  }
  const re = /\/items\/([^/]+)\/([^/]+)/g;
  matches = [...path.matchAll(re)];
  let items = matches.map((match, index) => ({
    itemId: match[1],
    tabKey: match[2],
  }));
  props.match.params['items'] = items;
  console.log(props.match, path);

  return (
    <div className={'collection'}>
      <div className={'collection-index'}>
        <CollectionIndex/>
      </div>
      {items.length > 0 && (
        <div className={'collection-item'}>
          {/* <Breadcrumb>
            {items.map(item => <Breadcrumb.Item/>)}
          </Breadcrumb> */}
          {items.map(item => {
            return (
              <div className={'collection-single'}>
                <CollectionSingle/>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CollectionLoader;
