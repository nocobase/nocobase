/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const createTagPageOptions = ({ tabTitle, items }: { tabTitle: string; items: any[] }) => {
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
          use: 'ChildPageTabModel',
          stepParams: {
            pageTabSettings: {
              tab: {
                title: tabTitle,
              },
            },
          },
          // subModels: {
          //   grid: {
          //     async: true,
          //     use: 'BlockGridModel',
          //     stepParams: {
          //       gridSettings: {
          //         grid: {
          //           rows: {},
          //           sizes: {},
          //         },
          //       },
          //     },
          //     filterManager: [],
          //     subModels: {
          //       items: items,
          //     },
          //   },
          // },
        },
      ],
    },
  };
};
