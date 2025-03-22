/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, FC, useContext } from 'react';
import { SchemaComponentOptions, useRequest } from '@nocobase/client';
import * as hooks from './hooks';
import { UploadActionInitializer } from './initializers';

export const FileManagerContext = createContext({ storages: [] });

export function useFileManagerContext() {
  return useContext(FileManagerContext);
}

export const FileManagerProvider: FC = (props) => {
  const { data } = useRequest<any>({
    resource: 'storages',
    action: 'listBasicInfo',
  });

  return (
    <FileManagerContext.Provider value={{ storages: data?.data || [] }}>
      <SchemaComponentOptions scope={hooks} components={{ UploadActionInitializer }}>
        {props.children}
      </SchemaComponentOptions>
    </FileManagerContext.Provider>
  );
};
