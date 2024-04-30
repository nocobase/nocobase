/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FC } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { BlockItemCard } from './BlockItemCard';
import { ErrorFallback } from '../error-fallback';

const FallbackComponent: FC<FallbackProps> = (props) => {
  return (
    <BlockItemCard>
      <ErrorFallback {...props} />
    </BlockItemCard>
  );
};

export const BlockItemError: FC = ({ children }) => {
  const handleErrors = (error) => {
    console.error(error);
  };
  return (
    <ErrorBoundary FallbackComponent={FallbackComponent} onError={handleErrors}>
      {children}
    </ErrorBoundary>
  );
};
