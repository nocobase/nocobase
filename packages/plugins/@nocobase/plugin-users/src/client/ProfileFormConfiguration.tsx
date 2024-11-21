/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ExtendCollectionsProvider,
  FormItem,
  RemoteSchemaComponent,
  SchemaComponent,
  useCollectionManager,
} from '@nocobase/client';
import React from 'react';
import { Radio } from 'antd';

export const ProfileFormConfiguration: React.FC = () => {
  const cm = useCollectionManager();
  const userCollection = cm.getCollection('users');
  const collection = {
    ...userCollection,
    name: 'users',
    fields: userCollection.fields.filter((field) => field.name !== 'password'),
  };
  const [perspective, setPerspective] = React.useState('admin');

  return (
    <>
      <FormItem>
        <Radio.Group defaultValue="admin" onChange={(e) => setPerspective(e.target.value)}>
          <Radio.Button value="admin">Admin perspective</Radio.Button>
          <Radio.Button value="user">User perspective</Radio.Button>
        </Radio.Group>
      </FormItem>
      <ExtendCollectionsProvider collections={[collection]}>
        <RemoteSchemaComponent
          uid={perspective === 'admin' ? 'nocobase-admin-profile-edit-form' : 'nocobase-user-profile-edit-form'}
          scope={{ useEditFormBlockDecoratorProps: () => ({}) }}
        />
      </ExtendCollectionsProvider>
    </>
  );
};
