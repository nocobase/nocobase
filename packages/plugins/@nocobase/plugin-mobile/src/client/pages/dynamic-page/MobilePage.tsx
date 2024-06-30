/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useParams } from 'react-router-dom';
import React from 'react';
import { RemoteSchemaComponent } from '@nocobase/client';

export const MobilePage = () => {
  const { schemaPageUid } = useParams<{ schemaPageUid: string }>();
  return <RemoteSchemaComponent uid={schemaPageUid} memoized={false} NotFoundPage={'MobileNotFoundPage'} />;
};
