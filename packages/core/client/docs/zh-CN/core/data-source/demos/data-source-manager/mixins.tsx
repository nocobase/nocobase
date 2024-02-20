import React from 'react';
import { CollectionProvider, Collection, useCollection, Plugin } from '@nocobase/client';
import { createApp } from '../createApp';

class TestMixin extends Collection {
  test() {
    const { name } = this.options;
    return 'test ' + name;
  }
}

class Test2Mixin extends Collection {
  test2() {
    const { name } = this.options;
    return 'test2 ' + name;
  }
}

const Demo = () => {
  const collection = useCollection<TestMixin & Test2Mixin>();
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
    <CollectionProvider name="users">
      <Demo />
    </CollectionProvider>
  );
};

class MyPlugin extends Plugin {
  async load() {
    this.app.dataSourceManager.addCollectionMixins([TestMixin, Test2Mixin]);
  }
}

export default createApp(Root, {
  plugins: [MyPlugin],
});
