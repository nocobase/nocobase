/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowEngine } from '@nocobase/flow-engine';
import { ADMIN_LAYOUT_MODEL_UID } from './constants';

export const useMobileLayout = () => {
  const flowEngine = useFlowEngine({ throwError: false });
  if (!flowEngine) {
    return {
      isMobileLayout: false,
      setIsMobileLayout: () => {},
    };
  }

  const adminLayoutModel = flowEngine.getModel<any>(ADMIN_LAYOUT_MODEL_UID);

  if (!adminLayoutModel) {
    return {
      isMobileLayout: false,
      setIsMobileLayout: () => {},
    };
  }

  return {
    isMobileLayout: adminLayoutModel.isMobileLayout,
    setIsMobileLayout: adminLayoutModel.setIsMobileLayout.bind(adminLayoutModel),
  };
};
