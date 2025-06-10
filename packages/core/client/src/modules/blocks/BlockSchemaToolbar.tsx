/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Collection, useCollectionManager, useDataBlockProps } from '../../data-source';
import { useCollection } from '../../data-source/collection/CollectionProvider';
import { useCompile } from '../../schema-component';
import { SchemaToolbar } from '../../schema-settings/GeneralSchemaDesigner';
import { useSchemaTemplate } from '../../schema-templates';
import { useMobileLayout } from '../../route-switch/antd/admin-layout';

export const BlockSchemaToolbar = (props) => {
  const { t } = useTranslation();
  const cm = useCollectionManager();
  let { name: currentCollectionName, title: currentCollectionTitle } = useCollection() || {};
  const template = useSchemaTemplate();
  const { association, collection } = useDataBlockProps() || {};
  const compile = useCompile();
  const { isMobileLayout } = useMobileLayout();

  if (association) {
    const [collectionName] = association.split('.');
    const { name, title } = cm.getCollection(collectionName);
    currentCollectionName = name;
    currentCollectionTitle = title;
  }

  const associationField = cm.getCollectionField(association);
  // If both the collection and association parameters exist at the same time,
  // it means that the collection of the current block is a child collection of inheritance,
  // and the title of the child collection needs to be displayed at this time
  const associationCollection = cm.getCollection(collection || associationField?.target);
  const templateName = ['FormItem', 'ReadPrettyFormItem'].includes(template?.componentName)
    ? `${template?.name} ${t('(Fields only)')}`
    : template?.name;
  const toolbarTitle = useMemo(() => {
    return [
      getCollectionTitle({
        collectionTitle: currentCollectionTitle,
        collectionName: currentCollectionName,
        associationField,
        associationCollection,
        compile,
      }),
      templateName,
    ].filter(Boolean);
  }, [currentCollectionTitle, currentCollectionName, associationField, associationCollection, compile, templateName]);

  return <SchemaToolbar title={toolbarTitle} {...props} draggable={!isMobileLayout} />;
};

export function getCollectionTitle(arg: {
  collectionTitle: string;
  collectionName: string;
  associationField: any;
  associationCollection?: Collection;
  compile: any;
}) {
  const { collectionTitle, collectionName, associationField, compile, associationCollection } = arg;

  if (associationField) {
    return `${compile(collectionTitle || collectionName)} > ${compile(
      associationField.uiSchema?.title || associationField.name,
    )} (${compile(associationCollection?.title || associationCollection?.name)})`;
  }

  return compile(collectionTitle || collectionName);
}
