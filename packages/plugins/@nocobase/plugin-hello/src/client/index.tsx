/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  BlockModel,
  CollectionActionModel,
  CollectionBlockModel,
  DataBlockModel,
  Plugin,
  RecordActionModel,
} from '@nocobase/client';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { ButtonProps } from 'antd';
import React from 'react';

class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloBlockModel.</p>
      </div>
    );
  }
}

class HelloDataBlockModel extends DataBlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloDataBlockModel.</p>
      </div>
    );
  }
}

HelloDataBlockModel.define({
  label: 'Hello Data Block Model',
});

class HelloCollectionBlockModel extends CollectionBlockModel {
  createResource() {
    return new MultiRecordResource();
  }

  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloCollectionBlockModel.</p>
      </div>
    );
  }
}

class HelloActionModel extends CollectionActionModel {
  defaultProps: ButtonProps = {
    title: 'Hello Global Action',
  };
}

class HelloRecordActionModel extends RecordActionModel {
  defaultProps: ButtonProps = {
    title: 'Hello Record Action',
  };
}

export class PluginHelloClient extends Plugin {
  async load() {
    this.flowEngine.registerModels({
      HelloBlockModel,
      HelloDataBlockModel,
      HelloCollectionBlockModel,
      HelloActionModel,
      HelloRecordActionModel,
    });
  }
}

export default PluginHelloClient;
