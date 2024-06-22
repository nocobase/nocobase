/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { SchemaSettings, SchemaToolbar } from '@nocobase/client';

export const mobilePageTabSettings = new SchemaSettings({
  name: 'mobile:page-tab',
  items: [],
});

export const MobilePageTabSettings = () => {
  return <SchemaToolbar settings={mobilePageTabSettings} draggable={false} />;
};
