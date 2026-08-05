/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

declare const AddSubModelButton: (props: Record<string, unknown>) => null;

declare const React: {
  createElement(...args: unknown[]): unknown;
};

function createDynamicItems() {
  throw new Error('dynamic menu fixture should not execute');
}

export function DynamicMenu() {
  return (
    <AddSubModelButton
      title="Dynamic block"
      modelUse="DynamicBlockModel"
      subModelKey="blocks"
      items={createDynamicItems}
    />
  );
}
