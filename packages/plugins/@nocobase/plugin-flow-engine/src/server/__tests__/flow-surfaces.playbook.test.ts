/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs';
import path from 'node:path';

const DOCS_ROOT = path.resolve(__dirname, '../../docs');
const SKILL_PATH = path.resolve(DOCS_ROOT, 'skill.md');
const PLAYBOOK_PATH = path.resolve(DOCS_ROOT, 'flow-surfaces-ai-playbook.md');
const JS_MODELS_PATH = path.resolve(DOCS_ROOT, 'flow-surfaces-ai-js-models.md');

describe('flowSurfaces ai docs', () => {
  it('should keep skill.md as the stable main entry and cover recommended JS public capabilities', () => {
    expect(fs.existsSync(SKILL_PATH)).toBe(true);

    const content = fs.readFileSync(SKILL_PATH, 'utf-8');
    expect(content).toContain('flowSurfaces:get');
    expect(content).toContain('configureOptions');
    expect(content).toContain('createPage');
    expect(content).toContain('compose');
    expect(content).toContain('configure');
    expect(content).toContain('addRecordAction');
    expect(content).toContain('addPopupTab');
    expect(content).toContain('updatePopupTab');
    expect(content).toContain('movePopupTab');
    expect(content).toContain('removePopupTab');
    expect(content).toContain('addBlocks');
    expect(content).toContain('addFields');
    expect(content).toContain('addActions');
    expect(content).toContain('addRecordActions');
    expect(content).toContain('removeNode');
    expect(content).toContain('moveNode');
    expect(content).toContain('GET /api/flowSurfaces:get?uid=view-action-uid');
    expect(content).toContain('GET /api/flowSurfaces:get?pageSchemaUid=employees-page-schema');
    expect(content).toContain('`loggedIn`');
    expect(content).toContain('`ui.flowSurfaces`');
    expect(content).toContain('不要写成 `{ "target": { "uid": "..." } }`');
    expect(content).toContain('`locator`、`uid`、`kind`');
    expect(content).toContain('`message`、`type`、`code`、`status`');
    expect(content).toContain('`tree.subModels.tabs`');
    expect(content).not.toContain('`tabs`、`tabTrees`');
    expect(content).toContain('"type": "filterForm"');
    expect(content).toContain('"type": "table"');
    expect(content).toContain('"recordActions"');
    expect(content).toContain('"type": "jsBlock"');
    expect(content).toContain('"type": "js"');
    expect(content).toContain('"renderer": "js"');
    expect(content).toContain('"type": "jsColumn"');
    expect(content).toContain('"type": "jsItem"');
    expect(content).toContain('"collectionName": "users"');
    expect(content).toContain('"fieldPath": "roles.title"');
    expect(content).toContain('"collectionName": "roles"');
    expect(content).toContain('clickToOpen');
    expect(content).toContain('openView');
    expect(content).toContain('"type": "details"');
    expect(content).toContain('"type": "markdown"');
    expect(content).toContain('"type": "iframe"');
    expect(content).toContain('"type": "actionPanel"');
    expect(content).toContain('"type": "list"');
    expect(content).toContain('"type": "gridCard"');
    expect(content).toContain('`bulkDelete`');
    expect(content).toContain('`bulkEdit`');
    expect(content).toContain('`bulkUpdate`');
    expect(content).toContain('`expandCollapse`');
    expect(content).toContain('`export`');
    expect(content).toContain('`upload`');
    expect(content).toContain('`composeEmail`');
    expect(content).toContain('`templatePrint`');
    expect(content).toContain('`triggerWorkflow`');
    expect(content).toContain('`duplicate`');
    expect(content).toContain('`addChild`');
    expect(content).toContain('`collapse`');
    expect(content).toContain('`link`');
    expect(content).toContain('`updateRecord`');
    expect(content).toContain('"span": 3');
    expect(content).toContain('"span": 7');
    expect(content).toContain('`table` / `details` / `list` / `gridCard`');
    expect(content).toContain('`catalog(target=table/details/list/gridCard)`');
    expect(content).toContain('真实可用的公开能力');
    expect(content).toContain('wrapperUid/fieldUid');
    expect(content).toContain('popupPageUid/popupTabUid/popupGridUid');
    expect(content).toContain('popup child tab API');
    expect(content).toContain('catalog.blocks[].resourceBindings');
    expect(content).toContain('关系字段弹窗');
    expect(content).toContain('非关系字段弹窗');
    expect(content).toContain('普通弹窗');
    expect(content).toContain('`select / subForm / bulkEditForm` scene');
    expect(content).toContain('"binding": "currentRecord"');
    expect(content).toContain('"binding": "associatedRecords"');
    expect(content).toContain('"associationField": "employee"');
    expect(content).toContain('"binding": "otherRecords"');
    expect(content).toContain('"collectionName": "departments"');
    expect(content).toContain('`addAction` 只用于非 record action');
    expect(content).toContain('`addRecordAction` 只用于 record action');
    expect(content).toContain('`addBlocks`：');
    expect(content).toContain('`addFields`：');
    expect(content).toContain('`addActions`：');
    expect(content).toContain('`addRecordActions`：');
    expect(content).toContain('`error` 固定带 `message/type/code/status`');
    expect(content).toContain('direct `add*` 现在也支持 inline `settings`');
    expect(content).toContain('`settings` 写法就是 `configure.changes` 的写法');
    expect(content).toContain('popup-capable action 还可以直接带 `popup`');
    expect(content).toContain('`icon`、`enableHeader`');
    expect(content).toContain('`quickEdit`、`treeTable`、`defaultExpandAllRows`、`dragSort`、`dragSortBy`');
    expect(content).toContain('`colon`');
    expect(content).toContain('`linkageRules`');
    expect(content).toContain('`editMode`、`updateMode`、`duplicateMode`');
    expect(content).toContain('`collapsedRows`、`defaultCollapsed`');
    expect(content).toContain('`emailFieldNames`、`defaultSelectAllRecords`');
    expect(content).toContain('flow-surfaces-ai-js-models.md');
    expect(content).not.toContain("return { type: 'div'");
    expect(content).not.toContain('return record.nickname;');
    expect(content).not.toContain('rowActions');
    expect(content).not.toContain('"actions": ["addNew", "view", "edit", "delete"]');
  });

  it('should keep playbook as a thin wrapper and keep the JS companion doc aligned', () => {
    expect(fs.existsSync(PLAYBOOK_PATH)).toBe(true);
    expect(fs.existsSync(JS_MODELS_PATH)).toBe(true);

    const playbook = fs.readFileSync(PLAYBOOK_PATH, 'utf-8');
    expect(playbook).toContain('skill.md');
    expect(playbook).toContain('flow-surfaces-ai-js-models.md');

    const jsModels = fs.readFileSync(JS_MODELS_PATH, 'utf-8');
    expect(jsModels).toContain('JSBlockModel');
    expect(jsModels).toContain('JSCollectionActionModel');
    expect(jsModels).toContain('JSRecordActionModel');
    expect(jsModels).toContain('JSFormActionModel');
    expect(jsModels).toContain('FilterFormJSActionModel');
    expect(jsModels).toContain('JSActionModel');
    expect(jsModels).toContain('JSFieldModel');
    expect(jsModels).toContain('JSEditableFieldModel');
    expect(jsModels).toContain('JSColumnModel');
    expect(jsModels).toContain('JSItemModel');
    expect(jsModels).toContain('FormJSFieldItemModel');
    expect(jsModels).toContain('JSItemActionModel');
    expect(jsModels).toContain('ctx.initResource');
    expect(jsModels).toContain('ctx.libs.React');
    expect(jsModels).toContain('ctx.libs.ReactDOM');
    expect(jsModels).toContain('ctx.libs.antdIcons');
    expect(jsModels).toContain('ctx.antd');
    expect(jsModels).not.toContain("return { type: 'div'");
    expect(jsModels).not.toContain('return record.nickname;');
    expect(jsModels).toContain('renderer: "js"');
    expect(jsModels).toContain('type: "jsColumn"');
    expect(jsModels).toContain('type: "jsItem"');
  });
});
