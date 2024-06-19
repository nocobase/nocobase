/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useParams } from 'react-router-dom';
import React, { FC } from 'react';
import { RemoteSchemaComponent } from '@nocobase/client';

export interface MobileSchemaPageProps {
  children?: React.ReactNode;
}

export const MobileSchemaPage: FC<MobileSchemaPageProps> = ({ children }) => {
  const { schemaId } = useParams<{ schemaId: string }>();
  return <RemoteSchemaComponent uid={schemaId} memoized={false} />;
};
