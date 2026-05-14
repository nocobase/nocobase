/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const createTagPageOptions = ({ tabTitle }: { tabTitle: string }) => {
  return {
    async: true,
    use: 'ChildPageModel',
    stepParams: {
      pageSettings: {
        general: {
          displayTitle: false,
          enableTabs: true,
        },
      },
    },
    subModels: {
      tabs: [
        {
          use: 'BulkEditChildPageTabModel',
          stepParams: {
            pageTabSettings: {
              tab: {
                title: tabTitle,
              },
            },
          },
        },
      ],
    },
  };
};
