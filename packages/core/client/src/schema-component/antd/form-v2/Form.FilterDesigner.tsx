import React from 'react';
import { GeneralSchemaDesigner } from '../../../schema-settings';
import { useSchemaTemplate } from '../../../schema-templates';
import { useCollectionV2 } from '../../../application';

/**
 * 筛选区块所使用的表单设计器
 * @returns
 */
export const FilterDesigner = () => {
  const collection = useCollectionV2();
  const template = useSchemaTemplate();

  return (
    <GeneralSchemaDesigner
      schemaSettings="FormFilterSettings"
      template={template}
      title={collection.title || collection.name}
    ></GeneralSchemaDesigner>
  );
};
