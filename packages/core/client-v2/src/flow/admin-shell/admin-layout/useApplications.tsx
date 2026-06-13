/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useApp } from '../../../flow-compat';
import React from 'react';

export const useApplications = () => {
  const app = useApp();
  const loadAppList = app.apps.loadAppList;
  const [appList, setAppList] = React.useState([]);

  React.useEffect(() => {
    let canceled = false;

    if (!loadAppList) {
      setAppList([]);
      return;
    }

    void Promise.resolve(loadAppList(app))
      .then((list) => {
        if (!canceled) {
          setAppList(Array.isArray(list) ? list : []);
        }
      })
      .catch((error) => {
        console.error('[NocoBase] Failed to load application switcher list.', error);
        if (!canceled) {
          setAppList([]);
        }
      });

    return () => {
      canceled = true;
    };
  }, [app, loadAppList]);

  return {
    Component: app.apps.Component,
    appList,
  };
};
