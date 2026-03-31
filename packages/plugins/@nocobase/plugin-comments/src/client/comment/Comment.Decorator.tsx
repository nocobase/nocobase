/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { CollectionManagerProvider, CollectionProvider, List, withDynamicSchemaProps } from '@nocobase/client';
import React from 'react';
import { CommentBlockDecoratorContextProvider } from '../provider/useCommentBlockDecoratorContext';

export const CommentDecorator = withDynamicSchemaProps((props: any) => {
  return (
    <CommentBlockDecoratorContextProvider {...props}>
      <List.Decorator {...props}>
        {/* {props.children} */}
        <CollectionManagerProvider dataSource={props.dataSource}>
          <CollectionProvider name={`${props.association ?? props.collection}`}>{props.children}</CollectionProvider>
        </CollectionManagerProvider>
      </List.Decorator>
    </CommentBlockDecoratorContextProvider>
  );
});
