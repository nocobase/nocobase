import React from 'react';
import * as View from '@/components/views';

function CollectionIndex(props) {
  return (
    <div>
      <View.Table/>
    </div>
  );
}

function CollectionHeader(props) {
  return (
    <div>Collection Header</div>
  );
}

function CollectionTab(props) {
  return (
    <div>
      <View.Details/>
    </div>
  );
}

function CollectionSingle(props) {
  return (
    <div>
      <CollectionHeader/>
      <CollectionTab/>
    </div>
  );
}

function Breadcrumb(props) {
  return (
    <div>Breadcrumb</div>
  )
}

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
    <div>
      <div className={'collection-list'}>
        <CollectionIndex/>
      </div>
      {items.length > 0 && (
        <div className={'collection-item'}>
          <Breadcrumb></Breadcrumb>
          {items.map(item => {
            return (
              <CollectionSingle/>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CollectionLoader;
