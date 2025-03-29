/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC } from 'react';
import { MainComponent } from './MainComponent';

const Loading: FC = () => <div>Loading...</div>;
const AppError: FC<{ error: Error & { title?: string } }> = ({ error }) => {
  const title = error?.title || 'App Error';
  return (
    <div>
      <div>{title}</div>
      {error?.message}
      {process.env.__TEST__ && error?.stack}
    </div>
  );
};

const AppNotFound: FC = () => <div></div>;

export const defaultAppComponents = {
  AppMain: MainComponent,
  AppSpin: Loading,
  AppError: AppError,
  AppNotFound: AppNotFound,
};
