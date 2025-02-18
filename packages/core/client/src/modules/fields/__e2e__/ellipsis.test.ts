/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { ellipsis } from './templates';

test.describe('ellipsis', () => {
  // it is not stable
  test.skip('Input & Input.URL & Input.TextArea & Input.JSON & RichText & Markdown & MarkdownVditor', async ({
    page,
    mockPage,
    mockRecord,
  }) => {
    const nocoPage = await mockPage(ellipsis).waitForInit();
    await mockRecord('testEllipsis', {
      input: '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ这是一段很长的输入文本，用于测试省略功能。',
      inputURL: 'https://www.nocobase.com/docs/welcome/introduction/getting-started/installation/docker-compose',
      inputTextArea:
        '1234567890abcdefghijklmnopqrstuvwxyz用于测试多行文本的省略效果用于测试多行文本的省略效果用于测试多行文本的省略效果用于测试多行文本的省略效果\n第二行文本，这里有更多的内容\n第三行文本，继续添加更多文字\n第四行文本，确保内容足够长\n第五行文本，用于测试多行文本的省略效果',
      inputJSON: `{
  "99999": "其他",
  "F3134": "软件销售",
  "I3007": "人工智能基础软件开发",
  "I3008": "人工智能应用软件开发",
  "I3014": "数字文化创意软件开发",
  "I3027": "信息技术咨询服务",
  "I3034": "计算机系统服务",
  "P1029": "业务培训（不含教育培训、职业技能培训等需取得许可的培训）"
}`,
      richText:
        '用于测试多行文本的省略效果用于测试多行文本的省略效果用于测试多行文本的省略效果用于测试多行文本的省略效果<h1>NocoBase简介</h1><p>1234567890abcdefghijklmnopqrstuvwxyz</p><p>这是第二段落，介绍NocoBase的主要特性</p><p>这是第三段落，讨论NocoBase的应用场景</p><ul><li>企业内部系统</li><li>工作流管理</li><li>数据分析平台</li></ul>',
      markdown:
        '用于测试多行文本的省略效果用于测试多行文本的省略效果用于测试多行文本的省略效果用于测试多行文本的省略效果# NocoBase：开源无代码平台\n\n1234567890abcdefghijklmnopqrstuvwxyz\n\n## 为什么选择NocoBase？\n\n- 快速开发\n- 灵活定制\n- 开源免费\n\n### 核心功能\n\n1. 数据模型设计\n2. 界面配置\n3. 工作流引擎\n4. 权限管理\n\n> NocoBase让每个人都能轻松构建自己的软件系统',
      markdownVditor:
        '用于测试多行文本的省略效果用于测试多行文本的省略效果用于测试多行文本的省略效果用于测试多行文本的省略效果# Vditor：强大的Markdown编辑器\n\n1234567890abcdefghijklmnopqrstuvwxyz\n\n> Vditor是一个强大的Markdown编辑器，支持所见即所得、即时渲染和分屏预览等模式\n\n## 主要特性\n\n- 支持多种编辑模式\n- 丰富的快捷键\n- 自定义主题\n\n```js\nconsole.log("Vditor是NocoBase默认的Markdown编辑器");\n```\n\n更多信息请访问[Vditor官网](https://b3log.org/vditor/)',
      type: '1',
    });
    await nocoPage.goto();

    // 1. Table -------------------------------------------------------------------------------------------------------
    await page.getByRole('button', { name: 'input', exact: true }).hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-testEllipsis' })
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    await page.getByRole('button', { name: 'inputURL', exact: true }).hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-testEllipsis' })
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    await page.getByRole('button', { name: 'inputTextArea', exact: true }).hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-testEllipsis' })
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    await page.getByRole('button', { name: 'inputJSON', exact: true }).hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-testEllipsis' })
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    await page.getByRole('button', { name: 'richText', exact: true }).hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-testEllipsis' })
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    await page.getByRole('button', { name: 'markdown', exact: true }).hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-testEllipsis' })
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    // 2. Details -------------------------------------------------------------------------------------------------------
    await page.getByLabel('block-item-CollectionField-testEllipsis-details-testEllipsis.input-input').hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-CollectionField-fieldSettings:FormItem-testEllipsis-' })
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    await page.getByLabel('block-item-CollectionField-testEllipsis-details-testEllipsis.inputURL-inputURL').hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-CollectionField-fieldSettings:FormItem-testEllipsis-' })
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    await page.getByLabel('block-item-CollectionField-testEllipsis-details-testEllipsis.inputTextArea-').hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-CollectionField-fieldSettings:FormItem-testEllipsis-' })
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    await page.getByLabel('block-item-CollectionField-testEllipsis-details-testEllipsis.inputJSON-inputJSON').hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-CollectionField-fieldSettings:FormItem-testEllipsis-' })
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    await page.getByLabel('block-item-CollectionField-testEllipsis-details-testEllipsis.richText-richText').hover();
    await page
      .getByRole('button', {
        name: 'designer-schema-settings-CollectionField-fieldSettings:FormItem-testEllipsis-testEllipsis.richText',
        exact: true,
      })
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    await page.getByLabel('block-item-CollectionField-testEllipsis-details-testEllipsis.markdown-markdown').hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-CollectionField-fieldSettings:FormItem-testEllipsis-' })
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    // 3. List -------------------------------------------------------------------------------------------------------
    await page
      .getByLabel('block-item-CardItem-testEllipsis-list')
      .getByLabel('block-item-CollectionField-testEllipsis-list-testEllipsis.input-input')
      .hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-CollectionField-fieldSettings:FormItem-testEllipsis-' })
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    await page
      .getByLabel('block-item-CardItem-testEllipsis-list')
      .getByLabel('block-item-CollectionField-testEllipsis-list-testEllipsis.inputURL-inputURL')
      .hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-CollectionField-fieldSettings:FormItem-testEllipsis-' })
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    await page
      .getByLabel('block-item-CardItem-testEllipsis-list')
      .getByLabel('block-item-CollectionField-testEllipsis-list-testEllipsis.inputTextArea-')
      .hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-CollectionField-fieldSettings:FormItem-testEllipsis-' })
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    await page
      .getByLabel('block-item-CardItem-testEllipsis-list')
      .getByLabel('block-item-CollectionField-testEllipsis-list-testEllipsis.inputJSON-inputJSON')
      .hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-CollectionField-fieldSettings:FormItem-testEllipsis-' })
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    await page
      .getByLabel('block-item-CardItem-testEllipsis-list')
      .getByLabel('block-item-CollectionField-testEllipsis-list-testEllipsis.richText-richText')
      .hover();
    await page
      .getByRole('button', {
        name: 'designer-schema-settings-CollectionField-fieldSettings:FormItem-testEllipsis-testEllipsis.richText',
        exact: true,
      })
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    await page
      .getByLabel('block-item-CardItem-testEllipsis-list')
      .getByLabel('block-item-CollectionField-testEllipsis-list-testEllipsis.markdown-markdown')
      .hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-CollectionField-fieldSettings:FormItem-testEllipsis-' })
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    // 4. GridCard -------------------------------------------------------------------------------------------------------
    await page.getByLabel('block-item-CollectionField-testEllipsis-grid-card-testEllipsis.input-input').hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-CollectionField-fieldSettings:FormItem-testEllipsis-' })
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    await page.getByLabel('block-item-CollectionField-testEllipsis-grid-card-testEllipsis.inputURL-inputURL').hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-CollectionField-fieldSettings:FormItem-testEllipsis-' })
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    await page.getByLabel('block-item-CollectionField-testEllipsis-grid-card-testEllipsis.inputURL-inputURL').hover();
    await page
      .getByRole('button', {
        name: 'designer-schema-settings-CollectionField-fieldSettings:FormItem-testEllipsis-testEllipsis.inputURL',
        exact: true,
      })
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    await page.getByLabel('block-item-CollectionField-testEllipsis-grid-card-testEllipsis.inputTextArea-').hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-CollectionField-fieldSettings:FormItem-testEllipsis-' })
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    await page.getByLabel('block-item-CollectionField-testEllipsis-grid-card-testEllipsis.inputJSON-').hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-CollectionField-fieldSettings:FormItem-testEllipsis-' })
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    await page.getByLabel('block-item-CollectionField-testEllipsis-grid-card-testEllipsis.richText-richText').hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-CollectionField-fieldSettings:FormItem-testEllipsis-' })
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    await page.getByLabel('block-item-CollectionField-testEllipsis-grid-card-testEllipsis.markdown-markdown').hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-CollectionField-fieldSettings:FormItem-testEllipsis-' })
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    // 5. Kanban -------------------------------------------------------------------------------------------------------
    await page.getByLabel('block-item-CollectionField-testEllipsis-kanban-testEllipsis.input-input').hover();
    await page
      .getByTestId('card-1')
      .getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-testEllipsis-testEllipsis.input', {
        exact: true,
      })
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    await page.getByLabel('block-item-CollectionField-testEllipsis-kanban-testEllipsis.inputURL-inputURL').hover();
    await page
      .getByTestId('card-1')
      .getByLabel(
        'designer-schema-settings-CollectionField-fieldSettings:FormItem-testEllipsis-testEllipsis.inputURL',
        {
          exact: true,
        },
      )
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    await page.getByLabel('block-item-CollectionField-testEllipsis-kanban-testEllipsis.inputTextArea-').hover();
    await page
      .getByTestId('card-1')
      .getByLabel(
        'designer-schema-settings-CollectionField-fieldSettings:FormItem-testEllipsis-testEllipsis.inputTextArea',
        {
          exact: true,
        },
      )
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    await page.getByLabel('block-item-CollectionField-testEllipsis-kanban-testEllipsis.inputJSON-').hover();
    await page
      .getByTestId('card-1')
      .getByLabel(
        'designer-schema-settings-CollectionField-fieldSettings:FormItem-testEllipsis-testEllipsis.inputJSON',
        {
          exact: true,
        },
      )
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    await page.getByLabel('block-item-CollectionField-testEllipsis-kanban-testEllipsis.richText-richText').hover();
    await page
      .getByTestId('card-1')
      .getByLabel(
        'designer-schema-settings-CollectionField-fieldSettings:FormItem-testEllipsis-testEllipsis.richText',
        {
          exact: true,
        },
      )
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
    await page.mouse.move(600, 0);

    await page.getByLabel('block-item-CollectionField-testEllipsis-kanban-testEllipsis.markdown-markdown').hover();
    await page
      .getByTestId('card-1')
      .getByLabel(
        'designer-schema-settings-CollectionField-fieldSettings:FormItem-testEllipsis-testEllipsis.markdown',
        {
          exact: true,
        },
      )
      .hover();
    await page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch').check();
    await expect(page.getByRole('menuitem', { name: 'Ellipsis' }).getByRole('switch')).toBeChecked({ checked: true });
  });
});
