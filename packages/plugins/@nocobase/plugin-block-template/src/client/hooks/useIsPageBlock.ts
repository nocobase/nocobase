/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useFieldSchema } from '@formily/react';

export const useIsPageBlock = () => {
  const location = useLocation();
  const fieldSchema = useFieldSchema();

  const isPageBlock = useMemo(() => {
    if (!fieldSchema || fieldSchema['x-template-uid']) {
      return false;
    }
    const isPage = location.pathname.startsWith('/admin/') || location.pathname.startsWith('/page/');
    const notInPopup = !location.pathname.includes('/popups/');
    const notInSetting = !location.pathname.startsWith('/admin/settings/');
    const notInWorkflow = !location.pathname.startsWith('/admin/workflow/workflows/');
    const notInBlockTemplate = !location.pathname.startsWith('/block-templates/inherited/');
    return isPage && notInPopup && notInSetting && notInWorkflow && notInBlockTemplate;
  }, [location.pathname, fieldSchema]);

  return isPageBlock;
};
