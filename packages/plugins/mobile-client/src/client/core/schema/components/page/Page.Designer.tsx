import { GeneralSchemaDesigner, SchemaSettings, useDesignable } from '@nocobase/client';
import React from 'react';
import { useTranslation } from '../../../../locale';
import { SSSwitchItem } from '../../settings';
import { Schema, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { useHistory } from 'react-router-dom';

export const PageDesigner = () => {
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();

  return <GeneralSchemaDesigner draggable={false}></GeneralSchemaDesigner>;
};
