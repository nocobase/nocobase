/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { RemoteSchemaComponent } from '../../../';

export function RouteSchemaComponent(props: any) {
  const params = useParams<any>();
  return <RemoteSchemaComponent onlyRenderProperties uid={params.name} />;
}
