/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const MOBILE_BREAKPOINT = 768;

export function shouldUseWorkflowTasksMobilePresentation(options: {
  isMobileLayout: boolean;
  md?: boolean;
  mobilePage: boolean;
  viewportWidth?: number;
}) {
  const { isMobileLayout, md, mobilePage, viewportWidth } = options;
  const isNarrowViewport =
    md === false || (md === undefined && viewportWidth !== undefined && viewportWidth < MOBILE_BREAKPOINT);

  return mobilePage || isMobileLayout || isNarrowViewport;
}
