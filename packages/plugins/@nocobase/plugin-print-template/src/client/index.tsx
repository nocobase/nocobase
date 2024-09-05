/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin, SchemaComponent } from '@nocobase/client';
import { PluginSettingsTable } from './PluginSettingsTable';
import { PluginSettingsTablePage } from './PluginSettingsTablePage';
import { PluginSettingsTableProvider } from './PluginSettingsTableProvider';
import { tStr, useT } from './locale';
import React from 'react';
import { createPrintTemplateActionSchema, usePrintTemplateActionProps } from './schema';
import { printTemplateActionSettings } from './settings';
import { createPrintTemplateActionInitializerItem } from './initializer';

export class PluginPrintTemplateClient extends Plugin {
  async load() {
    // 打印模板设置路由
    this.app.pluginSettingsManager.add('print-template', {
      title: tStr('print template setting menu'),
      icon: 'PrinterOutlined',
      Component: PluginSettingsTable,
    });
    this.app.addProvider(PluginSettingsTableProvider);

    // Action Button - Print Template Action
    this.app.addScopes({
      usePrintTemplateActionProps,
    });
    this.app.schemaSettingsManager.add(printTemplateActionSettings);
    this.app.schemaInitializerManager.addItem(
      'table:configuration',
      'printTemplate',
      createPrintTemplateActionInitializerItem('table-v2'),
    );
    // Test
    this.app.router.add('admin.print-template-action-schema', {
      path: '/admin/print-template-action-schema',
      Component: () => {
        return (
          <>
            <div style={{ marginTop: 20, marginBottom: 20 }}>
              <SchemaComponent schema={{ properties: { testOne: createPrintTemplateActionSchema('table-v2') } }} />
            </div>
          </>
        );
      },
    });

    // this.test()
    // this.testInfo()
    // 这里是前端路由
    // this.app.router.add(`admin.${name}-page`, {
    //   path: '/admin/plugin-settings-table-page',
    //   Component: PluginSettingsTablePage,
    // })

    // this.router.add("admin.print-template.hello", {
    // path: "/admin/print-template/hello",
    // Component: () => (<div>hello world</div>)
    // })
    // 全局上下文

    // console.log(this.app.router.getRoutes())
  }
  // async test() {
  //   // 上述代码首先将 Image 组件注册到系统中，这样前面 imageSchema 定义的 x-component: 'Image' 才能找到对应的组件，
  //   this.app.addComponents({ Image })
  //   // 验证
  //   this.app.router.add('admin.image-component', {
  //     path: '/admin/image-component',
  //     Component: () => {
  //       return (<>
  //         <div style={{ marginTop: 20, marginBottom: 20 }}>
  //           <Image />
  //         </div>

  //         <div style={{ marginTop: 20, marginBottom: 20 }}>
  //           <Image height={400} />
  //         </div>
  //       </>)
  //     }
  //   })

  //   this.app.router.add('admin.image-schema', {
  //     path: '/admin/image-schema',
  //     Component: () => {
  //       return <div style={{ marginTop: 20, marginBottom: 20 }}>
  //         <SchemaComponent schema={{ properties: { test: imageSchema } }} />
  //       </div>
  //     }
  //   })
  //   // 上述代码首先将 Image 组件注册到系统中，这样前面 imageSchema 定义的 x-component: 'Image' 才能找到对应的组件，
  //   this.app.schemaSettingsManager.add(imageSettings)
  //   // 然后使用 app.schemaInitializerManager.addItem 将 imageInitializerItem 添加对应 Initializer 子项中，其中 page:addBlock 是页面上 Add block 的 name，otherBlocks 是其父级的 name。
  //   this.app.schemaInitializerManager.addItem('page:addBlock',
  //     `otherBlocks.${imageInitializerItem.name}`,
  //     imageInitializerItem)
  // }

  // async testInfo() {
  //   this.app.addComponents({ Info })
  //   // 我们需要将 useInfoProps 注册到系统中，这样 x-use-component-props 才能找到对应的 scope。
  //   this.app.addScopes({ useInfoProps });
  //   this.app.schemaSettingsManager.add(infoSettings)
  //   // 添加到页面级别 Add block 中
  //   this.app.schemaInitializerManager.addItem('page:addBlock', `dataBlocks.${infoInitializerItem.name}`, infoInitializerItem)
  //   // 添加到弹窗 Add block 中
  //   this.app.schemaInitializerManager.addItem('popup:addNew:addBlock', `dataBlocks.${infoInitializerItem.name}`, infoInitializerItem)
  //   // this.app.router.add("admin.info-component", {
  //   //   path: "/admin/info-component",
  //   //   Component: () => {
  //   //     return (<>
  //   //       <div style={{ marginTop: 20, marginBottom: 20 }}>
  //   //         <Info collectionName='test' data={[{ id: 1 }, { id: 2 }]} />
  //   //       </div>
  //   //     </>)
  //   //   }
  //   // })
  //   // this.app.router.add('admin.info-schema', {
  //   //   path: '/admin/info-schema',
  //   //   Component: () => {
  //   //     return <>
  //   //       <div style={{ marginTop: 20, marginBottom: 20 }}>
  //   //         <SchemaComponent schema={{ properties: { test1: getInfoSchema({ collection: 'users' }) } }} />
  //   //       </div>

  //   //       <div style={{ marginTop: 20, marginBottom: 20 }}>
  //   //         <SchemaComponent schema={{ properties: { test2: getInfoSchema({ collection: 'roles' }) } }} />
  //   //       </div>
  //   //     </>
  //   //   }
  //   // })
  // }
}

export default PluginPrintTemplateClient;
