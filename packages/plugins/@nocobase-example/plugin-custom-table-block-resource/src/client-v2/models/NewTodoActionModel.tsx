/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// TODO: client-v2 暂未提供 ActionModel，待实现后将下方注释取消

// import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
// import { MultiRecordResource } from '@nocobase/flow-engine';
// import { ButtonProps } from 'antd';
// import { tExpr } from '../locale';
//
// export class NewTodoActionModel extends ActionModel {
//   static scene = ActionSceneEnum.collection;
//
//   defaultProps: ButtonProps = {
//     type: 'primary',
//     children: tExpr('New todo'),
//   };
// }
//
// NewTodoActionModel.define({
//   label: tExpr('New todo'),
// });
//
// NewTodoActionModel.registerFlow({
//   key: 'newTodoFlow',
//   title: tExpr('New todo'),
//   on: 'click',
//   steps: {
//     openForm: {
//       title: tExpr('Todo form'),
//       uiSchema: {
//         title: {
//           type: 'string',
//           title: tExpr('Title'),
//           'x-decorator': 'FormItem',
//           'x-component': 'Input',
//           required: true,
//         },
//         priority: {
//           type: 'string',
//           title: tExpr('Priority'),
//           'x-decorator': 'FormItem',
//           'x-component': 'Select',
//           enum: [
//             { label: 'High', value: 'high' },
//             { label: 'Medium', value: 'medium' },
//             { label: 'Low', value: 'low' },
//           ],
//         },
//         completed: {
//           type: 'boolean',
//           title: tExpr('Completed'),
//           'x-decorator': 'FormItem',
//           'x-component': 'Checkbox',
//         },
//       },
//       defaultParams: {
//         priority: 'medium',
//         completed: false,
//       },
//       async handler(ctx, params) {
//         const resource = ctx.blockModel?.resource as MultiRecordResource;
//         if (!resource) return;
//         await resource.create(params);
//         ctx.message.success(ctx.t('Created successfully'));
//       },
//     },
//   },
// });
