/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface ToolbarProps {
  localizer?: any;
  label?: any;
  view?: any;
  views?: any;
  onNavigate?: (action: string) => void;
  onView?: (view: string) => void;

  date: string;
  /**
   * 是否展示农历
   */
  showLunar: boolean;
}
