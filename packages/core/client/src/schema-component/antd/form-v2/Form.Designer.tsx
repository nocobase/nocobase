/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useCollection_deprecated } from '../../../collection-manager';
import { GeneralSchemaDesigner } from '../../../schema-settings';
import { useSchemaTemplate } from '../../../schema-templates';

export const FormDesigner = () => {
  const { name, title } = useCollection_deprecated();
  const template = useSchemaTemplate();

  return (
    <GeneralSchemaDesigner
      schemaSettings="FormSettings"
      template={template}
      title={title || name}
    ></GeneralSchemaDesigner>
  );
};

export const ReadPrettyFormDesigner = () => {
  const { name, title } = useCollection_deprecated();
  const template = useSchemaTemplate();
  return (
    <GeneralSchemaDesigner
      schemaSettings="ReadPrettyFormSettings"
      template={template}
      title={title || name}
    ></GeneralSchemaDesigner>
  );
};

export const DetailsDesigner = () => {
  const { name, title } = useCollection_deprecated();
  const template = useSchemaTemplate();
  return (
    <GeneralSchemaDesigner
      schemaSettings="FormDetailsSettings"
      template={template}
      title={title || name}
    ></GeneralSchemaDesigner>
  );
};
