/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 用于设置 Grid Card 区块的 props，使其样式适配移动端；
 * @param oldUseGridCardBlockDecoratorProps
 */
export const useGridCardBlockDecoratorProps = (props, useGridCardBlockDecoratorPropsOfDesktop: any) => {
  const oldProps = useGridCardBlockDecoratorPropsOfDesktop(props);

  return {
    ...oldProps,
    // 在移动端中，无论是什么屏幕尺寸，都只显示一列
    columnCount: {
      lg: 1,
      md: 1,
      xs: 1,
      xxl: 1,
    },
  };
};
