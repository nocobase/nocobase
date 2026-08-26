/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel, tExpr } from '@nocobase/flow-engine';
import _ from 'lodash';
import { PageTabModel } from './PageTabModel';

type PageModelStructure = {
  subModels: {
    tabs: PageTabModel[];
  };
};

/**
 * @deprecated Use `PageModel` instead.
 */
export class OldPageModel extends FlowModel<PageModelStructure> {}

OldPageModel.registerFlow({
  key: 'pageSettings',
  title: tExpr('Page settings'),
  steps: {
    general: {
      title: tExpr('General'),
      uiSchema: {
        title: {
          type: 'string',
          title: tExpr('Page title'),
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-reactions': {
            dependencies: ['displayTitle'],
            fulfill: {
              state: {
                visible: '{{$deps[0]}}',
              },
            },
          },
        },
        displayTitle: {
          type: 'boolean',
          title: tExpr('Display page title'),
          'x-decorator': 'FormItem',
          'x-component': 'Switch',
        },
        // enableTabs: {
        //   type: 'boolean',
        //   title: tExpr('Enable tabs'),
        //   'x-decorator': 'FormItem',
        //   'x-component': 'Switch',
        // },
      },
      defaultParams(ctx) {
        return {
          displayTitle: true,
          enableTabs: false,
        };
      },
      async handler(ctx, params) {
        ctx.model.setProps('displayTitle', params.displayTitle);
        if (!ctx.model.context.closable) {
          const routeTitle = (ctx.model.context as any)?.currentRoute?.title;
          ctx.model.setProps('title', ctx.t(params.title || routeTitle));
        } else {
          ctx.model.setProps('title', params.title ? ctx.t(params.title) : null);
        }
        ctx.model.setProps('enableTabs', params.enableTabs);

        if (ctx.model.context.closable) {
          ctx.model.setProps('headerStyle', {
            backgroundColor: ctx.themeToken.colorBgContainer,
          });
          ctx.model.setProps('tabBarStyle', {
            backgroundColor: ctx.themeToken.colorBgLayout,
            paddingInline: 16,
            marginBottom: 0,
          });
        } else {
          ctx.model.setProps('headerStyle', {
            backgroundColor: ctx.themeToken.colorBgContainer,
          });
          ctx.model.setProps('tabBarStyle', {
            backgroundColor: ctx.themeToken.colorBgContainer,
            paddingInline: 16,
            marginBottom: 0,
          });
        }
      },
    },
  },
});
