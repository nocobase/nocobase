/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEvent } from '../../../hooks/useEvent';

export function useActionOptions() {
  const { definitions } = useEvent();

  let treeData = definitions?.map((module) => ({
    value: module.name,
    label: module.title + ' - ' + module.uid,
    children:
      module?.actions?.map((event) => ({
        value: `${module.name}.${event.name}${module.uid ? `.${module.uid}` : ''}`,
        label: event.title,
      })) || [],
  }));
  treeData = treeData?.filter((item) => item.children.length > 0);

  return treeData;
}
