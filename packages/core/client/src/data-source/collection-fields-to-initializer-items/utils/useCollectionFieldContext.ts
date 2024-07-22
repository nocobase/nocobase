/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Form } from '@formily/core';
import { useFieldSchema, useForm } from '@formily/react';
import { ISchema } from '@formily/json-schema';
import { TFunction, useTranslation } from 'react-i18next';

import { DataSource } from '../../data-source/DataSource';
import { useCollection } from '../../collection/CollectionProvider';
import { useDataSource } from '../../data-source/DataSourceProvider';
import { CollectionManager } from '../../collection/CollectionManager';
import { DataSourceManager } from '../../data-source/DataSourceManager';
import { useActionContext } from '../../../schema-component/antd/action';
import { Collection } from '../../collection/Collection';
import { useCollectionManager } from '../../collection/CollectionManagerProvider';
import { useDataSourceManager } from '../../data-source/DataSourceManagerProvider';
import { InheritanceCollectionMixin } from '../../../collection-manager';
import { useCompile } from '../../../schema-component';

export interface CollectionFieldContext {
  fieldSchema: ISchema;
  collection?: InheritanceCollectionMixin & Collection;
  dataSource: DataSource;
  form: Form<any>;
  actionContext: ReturnType<typeof useActionContext>;
  t: TFunction<'translation', undefined>;
  collectionManager: CollectionManager;
  dataSourceManager: DataSourceManager;
  compile: (source: any, ext?: any) => any;
  targetCollection?: Collection;
}

export function useCollectionFieldContext(): CollectionFieldContext {
  const { t } = useTranslation();
  const collection = useCollection<InheritanceCollectionMixin>();
  const dataSourceManager = useDataSourceManager();
  const actionContext = useActionContext();
  const dataSource = useDataSource();
  const form = useForm();
  const fieldSchema = useFieldSchema();
  const collectionManager = useCollectionManager();
  const compile = useCompile();

  return {
    t,
    compile,
    actionContext,
    fieldSchema,
    collection,
    dataSource,
    form,
    collectionManager,
    dataSourceManager,
  };
}
