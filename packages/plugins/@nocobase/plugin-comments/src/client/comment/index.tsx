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

import { ActionBar, List, lazy } from '@nocobase/client';
// import { CommentList } from './Comment.List';
// import { CommentItem } from './Comment.Item';
// import { CommentDecorator } from './Comment.Decorator';
// import { CommentSubmit } from './Comment.Submit';
const { CommentList } = lazy(() => import('./Comment.List'), 'CommentList');
const { CommentItem } = lazy(() => import('./Comment.Item'), 'CommentItem');
const { CommentDecorator } = lazy(() => import('./Comment.Decorator'), 'CommentDecorator');
const { CommentSubmit } = lazy(() => import('./Comment.Submit'), 'CommentSubmit');

const Comment = () => null;

Comment.ActionBar = ActionBar;
Comment.List = CommentList;
Comment.Item = CommentItem;
Comment.Decorator = CommentDecorator;
Comment.Submit = CommentSubmit;

export { Comment };
