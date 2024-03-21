import React from 'react';
import { useCollection_deprecated } from '../../../collection-manager';
import { GeneralSchemaDesigner } from '../../../schema-settings';
import { useSchemaTemplate } from '../../../schema-templates';

/**
 * 筛选区块所使用的表单设计器
 * @returns
 */
export const FilterDesigner = () => {
  const { name, title } = useCollection_deprecated();
  const template = useSchemaTemplate();

  return (
    <GeneralSchemaDesigner
      schemaSettings="blockSettings:filterForm"
      template={template}
      title={title || name}
    ></GeneralSchemaDesigner>
  );
};
