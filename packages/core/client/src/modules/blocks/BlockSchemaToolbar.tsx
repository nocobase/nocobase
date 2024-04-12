import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCollectionManager, useDataBlockProps } from '../../data-source';
import { useCollection } from '../../data-source/collection/CollectionProvider';
import { useCompile } from '../../schema-component';
import { SchemaToolbar } from '../../schema-settings/GeneralSchemaDesigner';
import { useSchemaTemplate } from '../../schema-templates';

export const BlockSchemaToolbar = (props) => {
  const { t } = useTranslation();
  const cm = useCollectionManager();
  let { name: currentCollectionName, title: currentCollectionTitle } = useCollection();
  const template = useSchemaTemplate();
  const { association } = useDataBlockProps() || {};
  const compile = useCompile();

  if (association) {
    const [collectionName] = association.split('.');
    const { name, title } = cm.getCollection(collectionName);
    currentCollectionName = name;
    currentCollectionTitle = title;
  }

  const associationField = cm.getCollectionField(association);
  const templateName = ['FormItem', 'ReadPrettyFormItem'].includes(template?.componentName)
    ? `${template?.name} ${t('(Fields only)')}`
    : template?.name;
  const toolbarTitle = useMemo(() => {
    return [
      getCollectionTitle({
        collectionTitle: currentCollectionTitle,
        collectionName: currentCollectionName,
        associationField,
        compile,
      }),
      templateName,
    ].filter(Boolean);
  }, [compile, currentCollectionTitle, currentCollectionName, associationField, templateName]);

  return <SchemaToolbar title={toolbarTitle} {...props} />;
};

function getCollectionTitle(arg0: {
  collectionTitle: string;
  collectionName: string;
  associationField: any;
  compile: any;
}) {
  const { collectionTitle, collectionName, associationField, compile } = arg0;

  if (associationField) {
    return `${compile(collectionTitle || collectionName)} > ${compile(
      associationField.uiSchema?.title || associationField.name,
    )}`;
  }

  return collectionTitle || collectionName;
}
