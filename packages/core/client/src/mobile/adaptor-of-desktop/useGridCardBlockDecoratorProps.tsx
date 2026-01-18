/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Set Grid Card props for mobile layouts.
 */
export const useGridCardBlockDecoratorProps = (props, useGridCardBlockDecoratorPropsOfDesktop: any) => {
  const oldProps = useGridCardBlockDecoratorPropsOfDesktop(props);

  return {
    ...oldProps,
    columnCount: {
      lg: 1,
      md: 1,
      xs: 1,
      xxl: 1,
    },
  };
};
