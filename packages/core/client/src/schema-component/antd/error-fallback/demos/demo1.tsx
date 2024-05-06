/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '../ErrorFallback';

const App = () => {
  throw new Error('error message');
};

export default () => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={console.error}>
      <App />
    </ErrorBoundary>
  );
};
