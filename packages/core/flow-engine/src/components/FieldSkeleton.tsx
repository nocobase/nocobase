/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useFlowEngine } from '../provider';

export const FieldSkeleton: React.FC = () => {
  const flowEngine = useFlowEngine();
  const token = flowEngine.context.themeToken;
  return (
    <span
      style={{
        display: 'inline-block',
        width: '100%',
        height: 16,
        backgroundColor: token.colorFillSecondary,
        borderRadius: token.borderRadiusSM,
      }}
    />
  );
};
