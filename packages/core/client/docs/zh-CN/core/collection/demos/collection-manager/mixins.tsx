import React from 'react';
import { CollectionProviderV2, CollectionV2, useCollectionV2 } from '@nocobase/client';
import { createApp } from '../createApp';

class TestMixin extends CollectionV2 {
  test() {
    const { name } = this.options;
    return 'test ' + name;
  }
}

class Test2Mixin extends CollectionV2 {
  test2() {
    const { name } = this.options;
    return 'test2 ' + name;
  }
}

const Demo = () => {
  const collection = useCollectionV2<TestMixin & Test2Mixin>();
  return (
    <div>
      <div>test: {collection.test()}</div>
      <div>test2: {collection.test2()}</div>
      <div>fields.length: {collection.getFields().length}</div>
    </div>
  );
};

const Root = () => {
  return (
    <CollectionProviderV2 name="users">
      <Demo />
    </CollectionProviderV2>
  );
};

export default createApp(Root, {
  collectionManager: {
    collectionMixins: [TestMixin, Test2Mixin],
  },
});
