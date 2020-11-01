import React from 'react';
import * as View from '@/components/views';

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
      <View.Table/>
    </div>
  )
}
