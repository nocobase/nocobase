import { CreateWorkFlow, EditWorkFlow, WorkflowManagement, WorkflowListRecords } from '@nocobase/plugin-workflow-test/client';
import { e2e_GeneralFormsTable, appendJsonCollectionName } from '@nocobase/plugin-workflow-test/client';
import { CollectionTriggerNode, UpdateRecordNode } from '@nocobase/plugin-workflow-test/client';
import { expect, test } from '@nocobase/test/client';
import { dayjs } from '@nocobase/utils';
import { faker } from '@faker-js/faker';

test.describe('update data node,batch update', () => {
    test('Collection event add data trigger, batch update, filter single line text field not empty, common table single line text field data, set single line text field constant data', async ({
      page,
      mockCollections,
      mockRecords,
      mockPage,
    }) => {
      //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
      const triggerNodeAppendText = faker.lorem.word(4);
      const updateNodeAppendText = faker.lorem.word(4);
      //用例标题
      const caseTitle =
        'Collection event add data trigger, batch update, filter single line text field not empty, common table single line text field data, set single line text field constant data';

      // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
      //创建数据表
      const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
      const e2eJsonCollectionName = 'tt_amt_org';
      //创建触发器节点数据表
      const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
      const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
      const triggerNodeFieldName = 'orgname';
      const triggerNodeFieldDisplayName = '公司名称(单行文本)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

      // 创建更新节点数据表
      const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
      const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
      const updateNodeFieldName = 'orgname';
      const updateNodeFieldDisplayName = '公司名称(单行文本)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
      const updateNodeCollectionRecordOne = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
      const updateNodeCollectionRecordTwo = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
      const updateNodeCollectionRecordThree = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
      const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ orgname: updateNodeCollectionRecordOne }, { orgname: updateNodeCollectionRecordTwo }, { orgname: updateNodeCollectionRecordThree }]);

      //配置工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      const workflowManagement = new WorkflowManagement(page);
      await workflowManagement.addNewButton.click();
      const createWorkFlow = new CreateWorkFlow(page);
      const workFlowName = caseTitle + triggerNodeAppendText;
      await createWorkFlow.name.fill(workFlowName);
      await createWorkFlow.triggerType.click();
      await page.getByTitle('Collection event').getByText('Collection event').click();
      await createWorkFlow.submitButton.click();
      await expect(page.getByText(workFlowName)).toBeVisible();

      //配置工作流触发器
      const workflowListRecords = new WorkflowListRecords(page, workFlowName);
      await workflowListRecords.configureAction.click();
      const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
      await collectionTriggerNode.nodeConfigure.click();
      await collectionTriggerNode.collectionDropDown.click();
      await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
      await collectionTriggerNode.triggerOnDropdown.click();
      await page.getByText('After record added', { exact: true }).click();
      await collectionTriggerNode.submitButton.click();

      //配置更新数据节点
      await collectionTriggerNode.addNodeButton.click();
      await page.getByRole('button', { name: 'update', exact: true }).click();
      const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page
        .getByLabel('Update record-Update record', { exact: true })
        .getByRole('textbox')
        .fill(updateRecordNodeName);
      const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
      await updateRecordNode.nodeConfigure.click();
      await updateRecordNode.collectionDropDown.click();
      await page.getByText(updateNodeCollectionDisplayName).click();
      // 设置过滤条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('filter-select-field').click();
      await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
      await page.getByTestId('filter-select-operator').click();
      await page.getByRole('option', { name: 'is not empty' }).click();

      // 设置字段
      await updateRecordNode.addFieldsButton.click();
      await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
      const updayteRecordNodefieldData = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page.getByLabel('block-item-CollectionFieldset').getByRole('textbox').fill(updayteRecordNodefieldData);
      await updateRecordNode.submitButton.click();
      await page.getByRole('link', { name: 'Workflow' }).click();
      await workflowListRecords.editAction.click();
      const editWorkFlow = new EditWorkFlow(page, workFlowName);
      await editWorkFlow.statusIsOn.check();
      await editWorkFlow.submitButton.click();

      // 配置更新数据节点的数据表页面，查看更新前数据
      const updateNodeCollectionPage = mockPage();
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
      await page.mouse.move(300, 0);
      await page.getByText('Configure columns').hover();
      await page.getByText(updateNodeFieldDisplayName).click();
      await page.mouse.move(300, 0);
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

      //配置新增数据触发工作流页面
      const addDataTriggerWorkflowPage = mockPage();
      await addDataTriggerWorkflowPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page.getByText('Configure columns').hover();
      await page.getByText(triggerNodeFieldDisplayName).click();
      await page.getByText('Configure actions').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
      await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

      await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
      await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: 'form Form' }).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

      await page.mouse.move(300, 0);

      // 2、测试步骤：录入数据触发工作流
      const addDataTriggerWorkflowPagefieldData = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page.getByRole('textbox').fill(addDataTriggerWorkflowPagefieldData.toString());
      await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
      await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await expect(workflowListRecords.executionCountPopup).toHaveText('1');
      // 配置更新数据节点的数据表页面，查看更新后数据
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.executionCountPopup.click();
      await page.getByText('View').click();
      await page.waitForLoadState('networkidle');
      await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
      await page.waitForLoadState('networkidle');
      //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
      const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
      const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
      // 判断字符串包含createRecordNodefieldData
      expect(nodeResultString).toContain('3');
      await page.getByLabel('Close', { exact: true }).click();

      // 4、后置处理：删除工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.deleteAction.click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, batch update, filter single line text field not empty, common table single line text field data, set trigger node single line text field variable', async ({
      page,
      mockCollections,
      mockRecords,
      mockPage,
    }) => {
      //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
      const triggerNodeAppendText = faker.lorem.word(4);
      const updateNodeAppendText = faker.lorem.word(4);
      //用例标题
      const caseTitle =
        'Collection event add data trigger, batch update, filter single line text field not empty, common table single line text field data, set trigger node single line text field variable';

      // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
      //创建数据表
      const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
      const e2eJsonCollectionName = 'tt_amt_org';
      //创建触发器节点数据表
      const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
      const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
      const triggerNodeFieldName = 'orgname';
      const triggerNodeFieldDisplayName = '公司名称(单行文本)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

      // 创建更新节点数据表
      const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
      const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
      const updateNodeFieldName = 'orgname';
      const updateNodeFieldDisplayName = '公司名称(单行文本)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
      const updateNodeCollectionRecordOne = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
      const updateNodeCollectionRecordTwo = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
      const updateNodeCollectionRecordThree = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
      const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ orgname: updateNodeCollectionRecordOne }, { orgname: updateNodeCollectionRecordTwo }, { orgname: updateNodeCollectionRecordThree }]);

      //配置工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      const workflowManagement = new WorkflowManagement(page);
      await workflowManagement.addNewButton.click();
      const createWorkFlow = new CreateWorkFlow(page);
      const workFlowName = caseTitle + triggerNodeAppendText;
      await createWorkFlow.name.fill(workFlowName);
      await createWorkFlow.triggerType.click();
      await page.getByTitle('Collection event').getByText('Collection event').click();
      await createWorkFlow.submitButton.click();
      await expect(page.getByText(workFlowName)).toBeVisible();

      //配置工作流触发器
      const workflowListRecords = new WorkflowListRecords(page, workFlowName);
      await workflowListRecords.configureAction.click();
      const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
      await collectionTriggerNode.nodeConfigure.click();
      await collectionTriggerNode.collectionDropDown.click();
      await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
      await collectionTriggerNode.triggerOnDropdown.click();
      await page.getByText('After record added', { exact: true }).click();
      await collectionTriggerNode.submitButton.click();

      //配置更新数据节点
      await collectionTriggerNode.addNodeButton.click();
      await page.getByRole('button', { name: 'update', exact: true }).click();
      const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page
        .getByLabel('Update record-Update record', { exact: true })
        .getByRole('textbox')
        .fill(updateRecordNodeName);
      const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
      await updateRecordNode.nodeConfigure.click();
      await updateRecordNode.collectionDropDown.click();
      await page.getByText(updateNodeCollectionDisplayName).click();
      // 设置过滤条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('filter-select-field').click();
      await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
      await page.getByTestId('filter-select-operator').click();
      await page.getByRole('option', { name: 'is not empty' }).click();

      // 设置字段
      await updateRecordNode.addFieldsButton.click();
      await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
      await page.getByLabel('variable-button').click();
      await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
      await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
      await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
      await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
      await updateRecordNode.submitButton.click();
      await page.getByRole('link', { name: 'Workflow' }).click();
      await workflowListRecords.editAction.click();
      const editWorkFlow = new EditWorkFlow(page, workFlowName);
      await editWorkFlow.statusIsOn.check();
      await editWorkFlow.submitButton.click();

      // 配置更新数据节点的数据表页面，查看更新前数据
      const updateNodeCollectionPage = mockPage();
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
      await page.mouse.move(300, 0);
      await page.getByText('Configure columns').hover();
      await page.getByText(updateNodeFieldDisplayName).click();
      await page.mouse.move(300, 0);
      const updayteRecordNodefieldData = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

      //配置新增数据触发工作流页面
      const addDataTriggerWorkflowPage = mockPage();
      await addDataTriggerWorkflowPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page.getByText('Configure columns').hover();
      await page.getByText(triggerNodeFieldDisplayName).click();
      await page.getByText('Configure actions').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
      await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

      await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
      await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: 'form Form' }).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

      await page.mouse.move(300, 0);

      // 2、测试步骤：录入数据触发工作流
      const addDataTriggerWorkflowPagefieldData = updayteRecordNodefieldData;
      await page.getByRole('textbox').fill(addDataTriggerWorkflowPagefieldData.toString());
      await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
      await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await expect(workflowListRecords.executionCountPopup).toHaveText('1');
      // 配置更新数据节点的数据表页面，查看更新后数据
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.executionCountPopup.click();
      await page.getByText('View').click();
      await page.waitForLoadState('networkidle');
      await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
      await page.waitForLoadState('networkidle');
      //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
      const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
      const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
      // 判断字符串包含createRecordNodefieldData
      expect(nodeResultString).toContain('3');
      await page.getByLabel('Close', { exact: true }).click();

      // 4、后置处理：删除工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.deleteAction.click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, batch update, filter multi-line text field not empty, common table multi-line text field data, set multi-line text field constant data', async ({
      page,
      mockCollections,
      mockRecords,
      mockPage,
    }) => {
      //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
      const triggerNodeAppendText = faker.lorem.word(4);
      const updateNodeAppendText = faker.lorem.word(4);
      //用例标题
      const caseTitle =
        'Collection event add data trigger, batch update, filter multi-line text field not empty, common table multi-line text field data, set multi-line text field constant data';

      // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
      //创建数据表
      const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
      const e2eJsonCollectionName = 'tt_amt_org';
      //创建触发器节点数据表
      const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
      const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
      const triggerNodeFieldName = 'address';
      const triggerNodeFieldDisplayName = '公司地址(多行文本)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

      // 创建更新节点数据表
      const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
      const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
      const updateNodeFieldName = 'address';
      const updateNodeFieldDisplayName = '公司地址(多行文本)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
      const updateNodeCollectionRecordOne = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
      const updateNodeCollectionRecordTwo = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
      const updateNodeCollectionRecordThree = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
      const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ address: updateNodeCollectionRecordOne }, { address: updateNodeCollectionRecordTwo }, { address: updateNodeCollectionRecordThree }]);

      //配置工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      const workflowManagement = new WorkflowManagement(page);
      await workflowManagement.addNewButton.click();
      const createWorkFlow = new CreateWorkFlow(page);
      const workFlowName = caseTitle + triggerNodeAppendText;
      await createWorkFlow.name.fill(workFlowName);
      await createWorkFlow.triggerType.click();
      await page.getByTitle('Collection event').getByText('Collection event').click();
      await createWorkFlow.submitButton.click();
      await expect(page.getByText(workFlowName)).toBeVisible();

      //配置工作流触发器
      const workflowListRecords = new WorkflowListRecords(page, workFlowName);
      await workflowListRecords.configureAction.click();
      const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
      await collectionTriggerNode.nodeConfigure.click();
      await collectionTriggerNode.collectionDropDown.click();
      await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
      await collectionTriggerNode.triggerOnDropdown.click();
      await page.getByText('After record added', { exact: true }).click();
      await collectionTriggerNode.submitButton.click();

      //配置更新数据节点
      await collectionTriggerNode.addNodeButton.click();
      await page.getByRole('button', { name: 'update', exact: true }).click();
      const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page
        .getByLabel('Update record-Update record', { exact: true })
        .getByRole('textbox')
        .fill(updateRecordNodeName);
      const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
      await updateRecordNode.nodeConfigure.click();
      await updateRecordNode.collectionDropDown.click();
      await page.getByText(updateNodeCollectionDisplayName).click();
      // 设置过滤条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('filter-select-field').click();
      await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
      await page.getByTestId('filter-select-operator').click();
      await page.getByRole('option', { name: 'is not empty' }).click();

      // 设置字段
      await updateRecordNode.addFieldsButton.click();
      await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
      const updayteRecordNodefieldData = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page.getByLabel('block-item-CollectionFieldset').getByRole('textbox').fill(updayteRecordNodefieldData);
      await updateRecordNode.submitButton.click();
      await page.getByRole('link', { name: 'Workflow' }).click();
      await workflowListRecords.editAction.click();
      const editWorkFlow = new EditWorkFlow(page, workFlowName);
      await editWorkFlow.statusIsOn.check();
      await editWorkFlow.submitButton.click();

      // 配置更新数据节点的数据表页面，查看更新前数据
      const updateNodeCollectionPage = mockPage();
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
      await page.mouse.move(300, 0);
      await page.getByText('Configure columns').hover();
      await page.getByText(updateNodeFieldDisplayName).click();
      await page.mouse.move(300, 0);
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

      //配置新增数据触发工作流页面
      const addDataTriggerWorkflowPage = mockPage();
      await addDataTriggerWorkflowPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page.getByText('Configure columns').hover();
      await page.getByText(triggerNodeFieldDisplayName).click();
      await page.getByText('Configure actions').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
      await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

      await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
      await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: 'form Form' }).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

      await page.mouse.move(300, 0);

      // 2、测试步骤：录入数据触发工作流
      const addDataTriggerWorkflowPagefieldData = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page.getByRole('textbox').fill(addDataTriggerWorkflowPagefieldData.toString());
      await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
      await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await expect(workflowListRecords.executionCountPopup).toHaveText('1');
      // 配置更新数据节点的数据表页面，查看更新后数据
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.executionCountPopup.click();
      await page.getByText('View').click();
      await page.waitForLoadState('networkidle');
      await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
      await page.waitForLoadState('networkidle');
      //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
      const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
      const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
      // 判断字符串包含createRecordNodefieldData
      expect(nodeResultString).toContain('3');
      await page.getByLabel('Close', { exact: true }).click();

      // 4、后置处理：删除工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.deleteAction.click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, batch update, filter multiline text field not empty, common table multiline text field data, set trigger node multiline text field variable', async ({
      page,
      mockCollections,
      mockRecords,
      mockPage,
    }) => {
      //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
      const triggerNodeAppendText = faker.lorem.word(4);
      const updateNodeAppendText = faker.lorem.word(4);
      //用例标题
      const caseTitle =
        'Collection event add data trigger, batch update, filter multiline text field not empty, common table multiline text field data, set trigger node multiline text field variable';

      // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
      //创建数据表
      const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
      const e2eJsonCollectionName = 'tt_amt_org';
      //创建触发器节点数据表
      const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
      const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
      const triggerNodeFieldName = 'address';
      const triggerNodeFieldDisplayName = '公司地址(多行文本)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

      // 创建更新节点数据表
      const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
      const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
      const updateNodeFieldName = 'address';
      const updateNodeFieldDisplayName = '公司地址(多行文本)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
      const updateNodeCollectionRecordOne = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
      const updateNodeCollectionRecordTwo = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
      const updateNodeCollectionRecordThree = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
      const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ address: updateNodeCollectionRecordOne }, { address: updateNodeCollectionRecordTwo }, { address: updateNodeCollectionRecordThree }]);

      //配置工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      const workflowManagement = new WorkflowManagement(page);
      await workflowManagement.addNewButton.click();
      const createWorkFlow = new CreateWorkFlow(page);
      const workFlowName = caseTitle + triggerNodeAppendText;
      await createWorkFlow.name.fill(workFlowName);
      await createWorkFlow.triggerType.click();
      await page.getByTitle('Collection event').getByText('Collection event').click();
      await createWorkFlow.submitButton.click();
      await expect(page.getByText(workFlowName)).toBeVisible();

      //配置工作流触发器
      const workflowListRecords = new WorkflowListRecords(page, workFlowName);
      await workflowListRecords.configureAction.click();
      const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
      await collectionTriggerNode.nodeConfigure.click();
      await collectionTriggerNode.collectionDropDown.click();
      await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
      await collectionTriggerNode.triggerOnDropdown.click();
      await page.getByText('After record added', { exact: true }).click();
      await collectionTriggerNode.submitButton.click();

      //配置更新数据节点
      await collectionTriggerNode.addNodeButton.click();
      await page.getByRole('button', { name: 'update', exact: true }).click();
      const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page
        .getByLabel('Update record-Update record', { exact: true })
        .getByRole('textbox')
        .fill(updateRecordNodeName);
      const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
      await updateRecordNode.nodeConfigure.click();
      await updateRecordNode.collectionDropDown.click();
      await page.getByText(updateNodeCollectionDisplayName).click();
      // 设置过滤条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('filter-select-field').click();
      await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
      await page.getByTestId('filter-select-operator').click();
      await page.getByRole('option', { name: 'is not empty' }).click();

      // 设置字段
      await updateRecordNode.addFieldsButton.click();
      await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
      await page.getByLabel('variable-button').click();
      await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
      await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
      await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
      await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
      await updateRecordNode.submitButton.click();
      await page.getByRole('link', { name: 'Workflow' }).click();
      await workflowListRecords.editAction.click();
      const editWorkFlow = new EditWorkFlow(page, workFlowName);
      await editWorkFlow.statusIsOn.check();
      await editWorkFlow.submitButton.click();

      // 配置更新数据节点的数据表页面，查看更新前数据
      const updateNodeCollectionPage = mockPage();
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
      await page.mouse.move(300, 0);
      await page.getByText('Configure columns').hover();
      await page.getByText(updateNodeFieldDisplayName).click();
      await page.mouse.move(300, 0);
      const updayteRecordNodefieldData = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

      //配置新增数据触发工作流页面
      const addDataTriggerWorkflowPage = mockPage();
      await addDataTriggerWorkflowPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page.getByText('Configure columns').hover();
      await page.getByText(triggerNodeFieldDisplayName).click();
      await page.getByText('Configure actions').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
      await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

      await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
      await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: 'form Form' }).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

      await page.mouse.move(300, 0);

      // 2、测试步骤：录入数据触发工作流
      const addDataTriggerWorkflowPagefieldData = updayteRecordNodefieldData;
      await page.getByRole('textbox').fill(addDataTriggerWorkflowPagefieldData.toString());
      await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
      await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await expect(workflowListRecords.executionCountPopup).toHaveText('1');
      // 配置更新数据节点的数据表页面，查看更新后数据
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.executionCountPopup.click();
      await page.getByText('View').click();
      await page.waitForLoadState('networkidle');
      await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
      await page.waitForLoadState('networkidle');
      //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
      const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
      const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
      // 判断字符串包含createRecordNodefieldData
      expect(nodeResultString).toContain('3');
      await page.getByLabel('Close', { exact: true }).click();

      // 4、后置处理：删除工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.deleteAction.click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, batch update, filter integer field not null, common table integer field data, set integer field constant data', async ({
      page,
      mockCollections,
      mockRecords,
      mockPage,
    }) => {
      //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
      const triggerNodeAppendText = faker.lorem.word(4);
      const updateNodeAppendText = faker.lorem.word(4);
      //用例标题
      const caseTitle =
        'Collection event add data trigger, batch update, filter integer field not null, common table integer field data, set integer field constant data';

      // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
      //创建数据表
      const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
      const e2eJsonCollectionName = 'tt_amt_org';
      //创建触发器节点数据表
      const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
      const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
      const triggerNodeFieldName = 'staffnum';
      const triggerNodeFieldDisplayName = '员工人数(整数)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

      // 创建更新节点数据表
      const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
      const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
      const updateNodeFieldName = 'staffnum';
      const updateNodeFieldDisplayName = '员工人数(整数)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
      const updateNodeCollectionRecordOne = faker.number.int();
      const updateNodeCollectionRecordTwo = faker.number.int();
      const updateNodeCollectionRecordThree = faker.number.int();
      const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ staffnum: updateNodeCollectionRecordOne }, { staffnum: updateNodeCollectionRecordTwo }, { staffnum: updateNodeCollectionRecordThree }]);

      //配置工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      const workflowManagement = new WorkflowManagement(page);
      await workflowManagement.addNewButton.click();
      const createWorkFlow = new CreateWorkFlow(page);
      const workFlowName = caseTitle + triggerNodeAppendText;
      await createWorkFlow.name.fill(workFlowName);
      await createWorkFlow.triggerType.click();
      await page.getByTitle('Collection event').getByText('Collection event').click();
      await createWorkFlow.submitButton.click();
      await expect(page.getByText(workFlowName)).toBeVisible();

      //配置工作流触发器
      const workflowListRecords = new WorkflowListRecords(page, workFlowName);
      await workflowListRecords.configureAction.click();
      const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
      await collectionTriggerNode.nodeConfigure.click();
      await collectionTriggerNode.collectionDropDown.click();
      await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
      await collectionTriggerNode.triggerOnDropdown.click();
      await page.getByText('After record added', { exact: true }).click();
      await collectionTriggerNode.submitButton.click();

      //配置更新数据节点
      await collectionTriggerNode.addNodeButton.click();
      await page.getByRole('button', { name: 'update', exact: true }).click();
      const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page
        .getByLabel('Update record-Update record', { exact: true })
        .getByRole('textbox')
        .fill(updateRecordNodeName);
      const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
      await updateRecordNode.nodeConfigure.click();
      await updateRecordNode.collectionDropDown.click();
      await page.getByText(updateNodeCollectionDisplayName).click();
      // 设置过滤条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('filter-select-field').click();
      await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
      await page.getByTestId('filter-select-operator').click();
      await page.getByRole('option', { name: 'is not empty' }).click();

      // 设置字段
      await updateRecordNode.addFieldsButton.click();
      await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
      const updayteRecordNodefieldData = faker.number.int();
      await page.getByLabel('block-item-CollectionFieldset').getByRole('spinbutton').fill(updayteRecordNodefieldData.toString());
      await updateRecordNode.submitButton.click();
      await page.getByRole('link', { name: 'Workflow' }).click();
      await workflowListRecords.editAction.click();
      const editWorkFlow = new EditWorkFlow(page, workFlowName);
      await editWorkFlow.statusIsOn.check();
      await editWorkFlow.submitButton.click();

      // 配置更新数据节点的数据表页面，查看更新前数据
      const updateNodeCollectionPage = mockPage();
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
      await page.mouse.move(300, 0);
      await page.getByText('Configure columns').hover();
      await page.getByText(updateNodeFieldDisplayName).click();
      await page.mouse.move(300, 0);
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

      //配置新增数据触发工作流页面
      const addDataTriggerWorkflowPage = mockPage();
      await addDataTriggerWorkflowPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page.getByText('Configure columns').hover();
      await page.getByText(triggerNodeFieldDisplayName).click();
      await page.getByText('Configure actions').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
      await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

      await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
      await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: 'form Form' }).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

      await page.mouse.move(300, 0);

      // 2、测试步骤：录入数据触发工作流
      const addDataTriggerWorkflowPagefieldData = faker.number.int();
      await page.getByRole('spinbutton').fill(addDataTriggerWorkflowPagefieldData.toString());
      await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
      await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await expect(workflowListRecords.executionCountPopup).toHaveText('1');
      // 配置更新数据节点的数据表页面，查看更新后数据
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.executionCountPopup.click();
      await page.getByText('View').click();
      await page.waitForLoadState('networkidle');
      await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
      await page.waitForLoadState('networkidle');
      //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
      const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
      const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
      // 判断字符串包含createRecordNodefieldData
      expect(nodeResultString).toContain('3');
      await page.getByLabel('Close', { exact: true }).click();

      // 4、后置处理：删除工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.deleteAction.click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, batch update, filter integer field not empty, common table integer field data, set trigger node integer field variable', async ({
      page,
      mockCollections,
      mockRecords,
      mockPage,
    }) => {
      //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
      const triggerNodeAppendText = faker.lorem.word(4);
      const updateNodeAppendText = faker.lorem.word(4);
      //用例标题
      const caseTitle =
        'Collection event add data trigger, batch update, filter integer field not empty, common table integer field data, set trigger node integer field variable';

      // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
      //创建数据表
      const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
      const e2eJsonCollectionName = 'tt_amt_org';
      //创建触发器节点数据表
      const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
      const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
      const triggerNodeFieldName = 'staffnum';
      const triggerNodeFieldDisplayName = '员工人数(整数)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

      // 创建更新节点数据表
      const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
      const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
      const updateNodeFieldName = 'staffnum';
      const updateNodeFieldDisplayName = '员工人数(整数)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
      const updateNodeCollectionRecordOne = faker.number.int();
      const updateNodeCollectionRecordTwo = faker.number.int();
      const updateNodeCollectionRecordThree = faker.number.int();
      const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ staffnum: updateNodeCollectionRecordOne }, { staffnum: updateNodeCollectionRecordTwo }, { staffnum: updateNodeCollectionRecordThree }]);

      //配置工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      const workflowManagement = new WorkflowManagement(page);
      await workflowManagement.addNewButton.click();
      const createWorkFlow = new CreateWorkFlow(page);
      const workFlowName = caseTitle + triggerNodeAppendText;
      await createWorkFlow.name.fill(workFlowName);
      await createWorkFlow.triggerType.click();
      await page.getByTitle('Collection event').getByText('Collection event').click();
      await createWorkFlow.submitButton.click();
      await expect(page.getByText(workFlowName)).toBeVisible();

      //配置工作流触发器
      const workflowListRecords = new WorkflowListRecords(page, workFlowName);
      await workflowListRecords.configureAction.click();
      const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
      await collectionTriggerNode.nodeConfigure.click();
      await collectionTriggerNode.collectionDropDown.click();
      await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
      await collectionTriggerNode.triggerOnDropdown.click();
      await page.getByText('After record added', { exact: true }).click();
      await collectionTriggerNode.submitButton.click();

      //配置更新数据节点
      await collectionTriggerNode.addNodeButton.click();
      await page.getByRole('button', { name: 'update', exact: true }).click();
      const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page
        .getByLabel('Update record-Update record', { exact: true })
        .getByRole('textbox')
        .fill(updateRecordNodeName);
      const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
      await updateRecordNode.nodeConfigure.click();
      await updateRecordNode.collectionDropDown.click();
      await page.getByText(updateNodeCollectionDisplayName).click();
      // 设置过滤条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('filter-select-field').click();
      await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
      await page.getByTestId('filter-select-operator').click();
      await page.getByRole('option', { name: 'is not empty' }).click();

      // 设置字段
      await updateRecordNode.addFieldsButton.click();
      await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
      await page.getByLabel('variable-button').click();
      await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
      await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
      await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
      await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
      await updateRecordNode.submitButton.click();
      await page.getByRole('link', { name: 'Workflow' }).click();
      await workflowListRecords.editAction.click();
      const editWorkFlow = new EditWorkFlow(page, workFlowName);
      await editWorkFlow.statusIsOn.check();
      await editWorkFlow.submitButton.click();

      // 配置更新数据节点的数据表页面，查看更新前数据
      const updateNodeCollectionPage = mockPage();
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
      await page.mouse.move(300, 0);
      await page.getByText('Configure columns').hover();
      await page.getByText(updateNodeFieldDisplayName).click();
      await page.mouse.move(300, 0);
      const updayteRecordNodefieldData = faker.number.int();
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

      //配置新增数据触发工作流页面
      const addDataTriggerWorkflowPage = mockPage();
      await addDataTriggerWorkflowPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page.getByText('Configure columns').hover();
      await page.getByText(triggerNodeFieldDisplayName).click();
      await page.getByText('Configure actions').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
      await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

      await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
      await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: 'form Form' }).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

      await page.mouse.move(300, 0);

      // 2、测试步骤：录入数据触发工作流
      const addDataTriggerWorkflowPagefieldData = updayteRecordNodefieldData;
      await page.getByRole('spinbutton').fill(addDataTriggerWorkflowPagefieldData.toString());
      await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
      await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await expect(workflowListRecords.executionCountPopup).toHaveText('1');
      // 配置更新数据节点的数据表页面，查看更新后数据
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.executionCountPopup.click();
      await page.getByText('View').click();
      await page.waitForLoadState('networkidle');
      await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
      await page.waitForLoadState('networkidle');
      //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
      const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
      const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
      // 判断字符串包含createRecordNodefieldData
      expect(nodeResultString).toContain('3');
      await page.getByLabel('Close', { exact: true }).click();

      // 4、后置处理：删除工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.deleteAction.click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, batch update, filter numeric field not null, common table numeric field data, set numeric field constant data', async ({
      page,
      mockCollections,
      mockRecords,
      mockPage,
    }) => {
      //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
      const triggerNodeAppendText = faker.lorem.word(4);
      const updateNodeAppendText = faker.lorem.word(4);
      //用例标题
      const caseTitle =
        'Collection event add data trigger, batch update, filter numeric field not null, common table numeric field data, set numeric field constant data';

      // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
      //创建数据表
      const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
      const e2eJsonCollectionName = 'tt_amt_org';
      //创建触发器节点数据表
      const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
      const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
      const triggerNodeFieldName = 'regcapital';
      const triggerNodeFieldDisplayName = '注册资本(数字)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

      // 创建更新节点数据表
      const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
      const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
      const updateNodeFieldName = 'regcapital';
      const updateNodeFieldDisplayName = '注册资本(数字)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
      // 定义随机4位数小数的数值
      // const updateNodeCollectionRecordOne = faker.datatype.float({ min: 0, max: 10000, precision: 4 });
      const updateNodeCollectionRecordOne = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
      const updateNodeCollectionRecordTwo = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
      const updateNodeCollectionRecordThree = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
      const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ regcapital: updateNodeCollectionRecordOne }, { regcapital: updateNodeCollectionRecordTwo }, { regcapital: updateNodeCollectionRecordThree }]);

      //配置工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      const workflowManagement = new WorkflowManagement(page);
      await workflowManagement.addNewButton.click();
      const createWorkFlow = new CreateWorkFlow(page);
      const workFlowName = caseTitle + triggerNodeAppendText;
      await createWorkFlow.name.fill(workFlowName);
      await createWorkFlow.triggerType.click();
      await page.getByTitle('Collection event').getByText('Collection event').click();
      await createWorkFlow.submitButton.click();
      await expect(page.getByText(workFlowName)).toBeVisible();

      //配置工作流触发器
      const workflowListRecords = new WorkflowListRecords(page, workFlowName);
      await workflowListRecords.configureAction.click();
      const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
      await collectionTriggerNode.nodeConfigure.click();
      await collectionTriggerNode.collectionDropDown.click();
      await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
      await collectionTriggerNode.triggerOnDropdown.click();
      await page.getByText('After record added', { exact: true }).click();
      await collectionTriggerNode.submitButton.click();

      //配置更新数据节点
      await collectionTriggerNode.addNodeButton.click();
      await page.getByRole('button', { name: 'update', exact: true }).click();
      const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page
        .getByLabel('Update record-Update record', { exact: true })
        .getByRole('textbox')
        .fill(updateRecordNodeName);
      const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
      await updateRecordNode.nodeConfigure.click();
      await updateRecordNode.collectionDropDown.click();
      await page.getByText(updateNodeCollectionDisplayName).click();
      // 设置过滤条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('filter-select-field').click();
      await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
      await page.getByTestId('filter-select-operator').click();
      await page.getByRole('option', { name: 'is not empty' }).click();

      // 设置字段
      await updateRecordNode.addFieldsButton.click();
      await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
      const updayteRecordNodefieldData = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
      await page.getByLabel('block-item-CollectionFieldset').getByRole('spinbutton').fill(updayteRecordNodefieldData.toString());
      await updateRecordNode.submitButton.click();
      await page.getByRole('link', { name: 'Workflow' }).click();
      await workflowListRecords.editAction.click();
      const editWorkFlow = new EditWorkFlow(page, workFlowName);
      await editWorkFlow.statusIsOn.check();
      await editWorkFlow.submitButton.click();

      // 配置更新数据节点的数据表页面，查看更新前数据
      const updateNodeCollectionPage = mockPage();
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
      await page.mouse.move(300, 0);
      await page.getByText('Configure columns').hover();
      await page.getByText(updateNodeFieldDisplayName).click();
      await page.mouse.move(300, 0);
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

      //配置新增数据触发工作流页面
      const addDataTriggerWorkflowPage = mockPage();
      await addDataTriggerWorkflowPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page.getByText('Configure columns').hover();
      await page.getByText(triggerNodeFieldDisplayName).click();
      await page.getByText('Configure actions').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
      await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

      await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
      await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: 'form Form' }).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

      await page.mouse.move(300, 0);

      // 2、测试步骤：录入数据触发工作流
      const addDataTriggerWorkflowPagefieldData = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
      await page.getByRole('spinbutton').fill(addDataTriggerWorkflowPagefieldData.toString());
      await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
      await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await expect(workflowListRecords.executionCountPopup).toHaveText('1');
      // 配置更新数据节点的数据表页面，查看更新后数据
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.executionCountPopup.click();
      await page.getByText('View').click();
      await page.waitForLoadState('networkidle');
      await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
      await page.waitForLoadState('networkidle');
      //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
      const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
      const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
      // 判断字符串包含createRecordNodefieldData
      expect(nodeResultString).toContain('3');
      await page.getByLabel('Close', { exact: true }).click();

      // 4、后置处理：删除工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.deleteAction.click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, batch update, filter numeric field not empty, common table numeric field data, set trigger node numeric field variable', async ({
      page,
      mockCollections,
      mockRecords,
      mockPage,
    }) => {
      //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
      const triggerNodeAppendText = faker.lorem.word(4);
      const updateNodeAppendText = faker.lorem.word(4);
      //用例标题
      const caseTitle =
        'Collection event add data trigger, batch update, filter numeric field not empty, common table numeric field data, set trigger node numeric field variable';

      // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
      //创建数据表
      const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
      const e2eJsonCollectionName = 'tt_amt_org';
      //创建触发器节点数据表
      const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
      const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
      const triggerNodeFieldName = 'regcapital';
      const triggerNodeFieldDisplayName = '注册资本(数字)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

      // 创建更新节点数据表
      const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
      const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
      const updateNodeFieldName = 'regcapital';
      const updateNodeFieldDisplayName = '注册资本(数字)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
      const updateNodeCollectionRecordOne = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
      const updateNodeCollectionRecordTwo = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
      const updateNodeCollectionRecordThree = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
      const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ regcapital: updateNodeCollectionRecordOne }, { regcapital: updateNodeCollectionRecordTwo }, { regcapital: updateNodeCollectionRecordThree }]);

      //配置工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      const workflowManagement = new WorkflowManagement(page);
      await workflowManagement.addNewButton.click();
      const createWorkFlow = new CreateWorkFlow(page);
      const workFlowName = caseTitle + triggerNodeAppendText;
      await createWorkFlow.name.fill(workFlowName);
      await createWorkFlow.triggerType.click();
      await page.getByTitle('Collection event').getByText('Collection event').click();
      await createWorkFlow.submitButton.click();
      await expect(page.getByText(workFlowName)).toBeVisible();

      //配置工作流触发器
      const workflowListRecords = new WorkflowListRecords(page, workFlowName);
      await workflowListRecords.configureAction.click();
      const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
      await collectionTriggerNode.nodeConfigure.click();
      await collectionTriggerNode.collectionDropDown.click();
      await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
      await collectionTriggerNode.triggerOnDropdown.click();
      await page.getByText('After record added', { exact: true }).click();
      await collectionTriggerNode.submitButton.click();

      //配置更新数据节点
      await collectionTriggerNode.addNodeButton.click();
      await page.getByRole('button', { name: 'update', exact: true }).click();
      const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page
        .getByLabel('Update record-Update record', { exact: true })
        .getByRole('textbox')
        .fill(updateRecordNodeName);
      const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
      await updateRecordNode.nodeConfigure.click();
      await updateRecordNode.collectionDropDown.click();
      await page.getByText(updateNodeCollectionDisplayName).click();
      // 设置过滤条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('filter-select-field').click();
      await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
      await page.getByTestId('filter-select-operator').click();
      await page.getByRole('option', { name: 'is not empty' }).click();

      // 设置字段
      await updateRecordNode.addFieldsButton.click();
      await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
      await page.getByLabel('variable-button').click();
      await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
      await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
      await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
      await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
      await updateRecordNode.submitButton.click();
      await page.getByRole('link', { name: 'Workflow' }).click();
      await workflowListRecords.editAction.click();
      const editWorkFlow = new EditWorkFlow(page, workFlowName);
      await editWorkFlow.statusIsOn.check();
      await editWorkFlow.submitButton.click();

      // 配置更新数据节点的数据表页面，查看更新前数据
      const updateNodeCollectionPage = mockPage();
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
      await page.mouse.move(300, 0);
      await page.getByText('Configure columns').hover();
      await page.getByText(updateNodeFieldDisplayName).click();
      await page.mouse.move(300, 0);
      const updayteRecordNodefieldData = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

      //配置新增数据触发工作流页面
      const addDataTriggerWorkflowPage = mockPage();
      await addDataTriggerWorkflowPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page.getByText('Configure columns').hover();
      await page.getByText(triggerNodeFieldDisplayName).click();
      await page.getByText('Configure actions').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
      await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

      await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
      await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: 'form Form' }).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

      await page.mouse.move(300, 0);

      // 2、测试步骤：录入数据触发工作流
      const addDataTriggerWorkflowPagefieldData = updayteRecordNodefieldData;
      await page.getByRole('spinbutton').fill(addDataTriggerWorkflowPagefieldData.toString());
      await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
      await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await expect(workflowListRecords.executionCountPopup).toHaveText('1');
      // 配置更新数据节点的数据表页面，查看更新后数据
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.executionCountPopup.click();
      await page.getByText('View').click();
      await page.waitForLoadState('networkidle');
      await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
      await page.waitForLoadState('networkidle');
      //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
      const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
      const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
      // 判断字符串包含createRecordNodefieldData
      expect(nodeResultString).toContain('3');
      await page.getByLabel('Close', { exact: true }).click();

      // 4、后置处理：删除工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.deleteAction.click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, batch update, filter dropdown radio field not null, common table dropdown radio field data, set dropdown radio field constant data', async ({
      page,
      mockCollections,
      mockRecords,
      mockPage,
    }) => {
      //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
      const triggerNodeAppendText = faker.lorem.word(4);
      const updateNodeAppendText = faker.lorem.word(4);
      //用例标题
      const caseTitle =
        'Collection event add data trigger, batch update, filter dropdown radio field not null, common table dropdown radio field data, set dropdown radio field constant data';

      // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
      //创建数据表
      const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
      const e2eJsonCollectionName = 'tt_amt_org';
      //创建触发器节点数据表
      const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
      const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
      const triggerNodeFieldName = 'status_singleselect';
      const triggerNodeFieldDisplayName = '公司状态(下拉单选)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

      // 创建更新节点数据表
      const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
      const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
      const updateNodeFieldName = 'status_singleselect';
      const updateNodeFieldDisplayName = '公司状态(下拉单选)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
      // 定义随机4位数小数的数值
      // const updateNodeCollectionRecordOne = faker.datatype.float({ min: 0, max: 10000, precision: 4 });
      const updateNodeCollectionRecordOne = '1';
      const updateNodeCollectionRecordTwo = '2';
      const updateNodeCollectionRecordThree = '3';
      const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ status_singleselect: updateNodeCollectionRecordOne }, { status_singleselect: updateNodeCollectionRecordTwo }, { status_singleselect: updateNodeCollectionRecordThree }]);

      //配置工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      const workflowManagement = new WorkflowManagement(page);
      await workflowManagement.addNewButton.click();
      const createWorkFlow = new CreateWorkFlow(page);
      const workFlowName = caseTitle + triggerNodeAppendText;
      await createWorkFlow.name.fill(workFlowName);
      await createWorkFlow.triggerType.click();
      await page.getByTitle('Collection event').getByText('Collection event').click();
      await createWorkFlow.submitButton.click();
      await expect(page.getByText(workFlowName)).toBeVisible();

      //配置工作流触发器
      const workflowListRecords = new WorkflowListRecords(page, workFlowName);
      await workflowListRecords.configureAction.click();
      const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
      await collectionTriggerNode.nodeConfigure.click();
      await collectionTriggerNode.collectionDropDown.click();
      await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
      await collectionTriggerNode.triggerOnDropdown.click();
      await page.getByText('After record added', { exact: true }).click();
      await collectionTriggerNode.submitButton.click();

      //配置更新数据节点
      await collectionTriggerNode.addNodeButton.click();
      await page.getByRole('button', { name: 'update', exact: true }).click();
      const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page
        .getByLabel('Update record-Update record', { exact: true })
        .getByRole('textbox')
        .fill(updateRecordNodeName);
      const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
      await updateRecordNode.nodeConfigure.click();
      await updateRecordNode.collectionDropDown.click();
      await page.getByText(updateNodeCollectionDisplayName).click();
      // 设置过滤条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('filter-select-field').click();
      await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
      await page.getByTestId('filter-select-operator').click();
      await page.getByRole('option', { name: 'is not empty' }).click();

      // 设置字段
      await updateRecordNode.addFieldsButton.click();
      await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
      const updayteRecordNodefieldData = '注销';
      await page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByTestId('select-single').getByLabel('Search').click();
      await page.getByRole('option', { name: '注销' }).click();
      await updateRecordNode.submitButton.click();

      await page.getByRole('link', { name: 'Workflow' }).click();
      await workflowListRecords.editAction.click();
      const editWorkFlow = new EditWorkFlow(page, workFlowName);
      await editWorkFlow.statusIsOn.check();
      await editWorkFlow.submitButton.click();

      // 配置更新数据节点的数据表页面，查看更新前数据
      const updateNodeCollectionPage = mockPage();
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
      await page.mouse.move(300, 0);
      await page.getByText('Configure columns').hover();
      await page.getByText(updateNodeFieldDisplayName).click();
      await page.mouse.move(300, 0);
      await expect(page.getByText('存续')).toBeVisible();
      await expect(page.getByText('在业')).toBeVisible();
      await expect(page.getByText('吊销')).toBeVisible();
      await expect(page.getByText('注销')).not.toBeVisible();

      //配置新增数据触发工作流页面
      const addDataTriggerWorkflowPage = mockPage();
      await addDataTriggerWorkflowPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page.getByText('Configure columns').hover();
      await page.getByText(triggerNodeFieldDisplayName).click();
      await page.getByText('Configure actions').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
      await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

      await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
      await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: 'form Form' }).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

      await page.mouse.move(300, 0);

      // 2、测试步骤：录入数据触发工作流
      const addDataTriggerWorkflowPagefieldData = '注销';
      await page.getByTestId('select-single').getByLabel('Search').click();
      await page.getByRole('option', { name: '注销' }).click();
      await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
      await expect(page.getByRole('button', { name: '注销' })).toBeVisible();
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await expect(workflowListRecords.executionCountPopup).toHaveText('1');
      // 配置更新数据节点的数据表页面，查看更新后数据
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('存续')).not.toBeVisible();
      await expect(page.getByText('在业')).not.toBeVisible();
      await expect(page.getByText('吊销')).not.toBeVisible();
      await expect(page.getByText('注销').first()).toBeVisible();
      await expect(page.getByText('注销').nth(1)).toBeVisible();
      await expect(page.getByText('注销').nth(2)).toBeVisible();

      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.executionCountPopup.click();
      await page.getByText('View').click();
      await page.waitForLoadState('networkidle');
      await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
      await page.waitForLoadState('networkidle');
      //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
      const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
      const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
      // 判断字符串包含createRecordNodefieldData
      expect(nodeResultString).toContain('3');
      await page.getByLabel('Close', { exact: true }).click();

      // 4、后置处理：删除工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.deleteAction.click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, batch update, filter dropdown radio field not empty, common table dropdown radio field data, set trigger node dropdown radio field variable', async ({
      page,
      mockCollections,
      mockRecords,
      mockPage,
    }) => {
      //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
      const triggerNodeAppendText = faker.lorem.word(4);
      const updateNodeAppendText = faker.lorem.word(4);
      //用例标题
      const caseTitle =
        'Collection event add data trigger, batch update, filter dropdown radio field not empty, common table dropdown radio field data, set trigger node dropdown radio field variable';

      // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
      //创建数据表
      const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
      const e2eJsonCollectionName = 'tt_amt_org';
      //创建触发器节点数据表
      const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
      const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
      const triggerNodeFieldName = 'status_singleselect';
      const triggerNodeFieldDisplayName = '公司状态(下拉单选)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

      // 创建更新节点数据表
      const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
      const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
      const updateNodeFieldName = 'status_singleselect';
      const updateNodeFieldDisplayName = '公司状态(下拉单选)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
      const updateNodeCollectionRecordOne = '1';
      const updateNodeCollectionRecordTwo = '2';
      const updateNodeCollectionRecordThree = '3';
      const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ status_singleselect: updateNodeCollectionRecordOne }, { status_singleselect: updateNodeCollectionRecordTwo }, { status_singleselect: updateNodeCollectionRecordThree }]);

      //配置工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      const workflowManagement = new WorkflowManagement(page);
      await workflowManagement.addNewButton.click();
      const createWorkFlow = new CreateWorkFlow(page);
      const workFlowName = caseTitle + triggerNodeAppendText;
      await createWorkFlow.name.fill(workFlowName);
      await createWorkFlow.triggerType.click();
      await page.getByTitle('Collection event').getByText('Collection event').click();
      await createWorkFlow.submitButton.click();
      await expect(page.getByText(workFlowName)).toBeVisible();

      //配置工作流触发器
      const workflowListRecords = new WorkflowListRecords(page, workFlowName);
      await workflowListRecords.configureAction.click();
      const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
      await collectionTriggerNode.nodeConfigure.click();
      await collectionTriggerNode.collectionDropDown.click();
      await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
      await collectionTriggerNode.triggerOnDropdown.click();
      await page.getByText('After record added', { exact: true }).click();
      await collectionTriggerNode.submitButton.click();

      //配置更新数据节点
      await collectionTriggerNode.addNodeButton.click();
      await page.getByRole('button', { name: 'update', exact: true }).click();
      const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page
        .getByLabel('Update record-Update record', { exact: true })
        .getByRole('textbox')
        .fill(updateRecordNodeName);
      const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
      await updateRecordNode.nodeConfigure.click();
      await updateRecordNode.collectionDropDown.click();
      await page.getByText(updateNodeCollectionDisplayName).click();
      // 设置过滤条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('filter-select-field').click();
      await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
      await page.getByTestId('filter-select-operator').click();
      await page.getByRole('option', { name: 'is not empty' }).click();

      // 设置字段
      await updateRecordNode.addFieldsButton.click();
      await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
      await page.getByLabel('variable-button').click();
      await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
      await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
      await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
      await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
      await updateRecordNode.submitButton.click();
      await page.getByRole('link', { name: 'Workflow' }).click();
      await workflowListRecords.editAction.click();
      const editWorkFlow = new EditWorkFlow(page, workFlowName);
      await editWorkFlow.statusIsOn.check();
      await editWorkFlow.submitButton.click();

      // 配置更新数据节点的数据表页面，查看更新前数据
      const updateNodeCollectionPage = mockPage();
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
      await page.mouse.move(300, 0);
      await page.getByText('Configure columns').hover();
      await page.getByText(updateNodeFieldDisplayName).click();
      await page.mouse.move(300, 0);
      // const updayteRecordNodefieldData = '注销';
      await expect(page.getByText('存续')).toBeVisible();
      await expect(page.getByText('在业')).toBeVisible();
      await expect(page.getByText('吊销')).toBeVisible();
      await expect(page.getByText('注销')).not.toBeVisible();

      //配置新增数据触发工作流页面
      const addDataTriggerWorkflowPage = mockPage();
      await addDataTriggerWorkflowPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page.getByText('Configure columns').hover();
      await page.getByText(triggerNodeFieldDisplayName).click();
      await page.getByText('Configure actions').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
      await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

      await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
      await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: 'form Form' }).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

      await page.mouse.move(300, 0);

      // 2、测试步骤：录入数据触发工作流
      const addDataTriggerWorkflowPagefieldData = '注销';
      await page.getByTestId('select-single').getByLabel('Search').click();
      await page.getByRole('option', { name: '注销' }).click();
      await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
      await expect(page.getByRole('button', { name: '注销' })).toBeVisible();
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await expect(workflowListRecords.executionCountPopup).toHaveText('1');
      // 配置更新数据节点的数据表页面，查看更新后数据
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('存续')).not.toBeVisible();
      await expect(page.getByText('在业')).not.toBeVisible();
      await expect(page.getByText('吊销')).not.toBeVisible();
      await expect(page.getByText('注销').first()).toBeVisible();
      await expect(page.getByText('注销').nth(1)).toBeVisible();
      await expect(page.getByText('注销').nth(2)).toBeVisible();

      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.executionCountPopup.click();
      await page.getByText('View').click();
      await page.waitForLoadState('networkidle');
      await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
      await page.waitForLoadState('networkidle');
      //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
      const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
      const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
      // 判断字符串包含createRecordNodefieldData
      expect(nodeResultString).toContain('3');
      await page.getByLabel('Close', { exact: true }).click();

      // 4、后置处理：删除工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.deleteAction.click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, batch update, filter dropdown radio fields not null, common table dropdown radio fields data, set dropdown radio fields constant data', async ({
      page,
      mockCollections,
      mockRecords,
      mockPage,
    }) => {
      //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
      const triggerNodeAppendText = faker.lorem.word(4);
      const updateNodeAppendText = faker.lorem.word(4);
      //用例标题
      const caseTitle =
        'Collection event add data trigger, batch update, filter dropdown radio fields not null, common table dropdown radio fields data, set dropdown radio fields constant data';

      // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
      //创建数据表
      const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
      const e2eJsonCollectionName = 'tt_amt_org';
      //创建触发器节点数据表
      const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
      const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
      const triggerNodeFieldName = 'range_multipleselect';
      const triggerNodeFieldDisplayName = '经营范围(下拉多选)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

      // 创建更新节点数据表
      const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
      const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
      const updateNodeFieldName = 'range_multipleselect';
      const updateNodeFieldDisplayName = '经营范围(下拉多选)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
      // 定义随机4位数小数的数值
      // const updateNodeCollectionRecordOne = faker.datatype.float({ min: 0, max: 10000, precision: 4 });
      const updateNodeCollectionRecordOne = ['F3134','I3006'];
      const updateNodeCollectionRecordTwo = ['F3134','I3007'];
      const updateNodeCollectionRecordThree = ['I3006','I3007'];
      const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ range_multipleselect: updateNodeCollectionRecordOne }, { range_multipleselect: updateNodeCollectionRecordTwo }, { range_multipleselect: updateNodeCollectionRecordThree }]);

      //配置工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      const workflowManagement = new WorkflowManagement(page);
      await workflowManagement.addNewButton.click();
      const createWorkFlow = new CreateWorkFlow(page);
      const workFlowName = caseTitle + triggerNodeAppendText;
      await createWorkFlow.name.fill(workFlowName);
      await createWorkFlow.triggerType.click();
      await page.getByTitle('Collection event').getByText('Collection event').click();
      await createWorkFlow.submitButton.click();
      await expect(page.getByText(workFlowName)).toBeVisible();

      //配置工作流触发器
      const workflowListRecords = new WorkflowListRecords(page, workFlowName);
      await workflowListRecords.configureAction.click();
      const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
      await collectionTriggerNode.nodeConfigure.click();
      await collectionTriggerNode.collectionDropDown.click();
      await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
      await collectionTriggerNode.triggerOnDropdown.click();
      await page.getByText('After record added', { exact: true }).click();
      await collectionTriggerNode.submitButton.click();

      //配置更新数据节点
      await collectionTriggerNode.addNodeButton.click();
      await page.getByRole('button', { name: 'update', exact: true }).click();
      const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page
        .getByLabel('Update record-Update record', { exact: true })
        .getByRole('textbox')
        .fill(updateRecordNodeName);
      const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
      await updateRecordNode.nodeConfigure.click();
      await updateRecordNode.collectionDropDown.click();
      await page.getByText(updateNodeCollectionDisplayName).click();
      // 设置过滤条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('filter-select-field').click();
      await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
      await page.getByTestId('filter-select-operator').click();
      await page.getByRole('option', { name: 'is not empty' }).click();

      // 设置字段
      await updateRecordNode.addFieldsButton.click();
      await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
      // const createRecordNodefieldData = faker.number.int();
      await page.getByTestId('select-multiple').getByLabel('Search').click();
      await page.getByRole('option', { name: '数据处理服务', exact: true }).click();
      await page.getByRole('option', { name: '计算机系统服务', exact: true }).click();
      await updateRecordNode.submitButton.click();

      await page.getByRole('link', { name: 'Workflow' }).click();
      await workflowListRecords.editAction.click();
      const editWorkFlow = new EditWorkFlow(page, workFlowName);
      await editWorkFlow.statusIsOn.check();
      await editWorkFlow.submitButton.click();

      // 配置更新数据节点的数据表页面，查看更新前数据
      const updateNodeCollectionPage = mockPage();
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
      await page.mouse.move(300, 0);
      await page.getByText('Configure columns').hover();
      await page.getByText(updateNodeFieldDisplayName).click();
      await page.mouse.move(300, 0);
      await expect(page.getByRole('button', { name: '软件销售 软件开发' })).toBeVisible();
      await expect(page.getByRole('button', { name: '软件销售 人工智能基础软件开发' })).toBeVisible();
      await expect(page.getByRole('button', { name: '软件开发 人工智能基础软件开发' })).toBeVisible();
      await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' })).not.toBeVisible();

      //配置新增数据触发工作流页面
      const addDataTriggerWorkflowPage = mockPage();
      await addDataTriggerWorkflowPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page.getByText('Configure columns').hover();
      await page.getByText(triggerNodeFieldDisplayName).click();
      await page.getByText('Configure actions').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
      await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

      await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
      await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: 'form Form' }).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

      await page.mouse.move(300, 0);

      // 2、测试步骤：录入数据触发工作流
      // const addDataTriggerWorkflowPagefieldData = '注销';
      await page.getByTestId('select-multiple').click();
      await page.getByRole('option', { name: '数据处理服务', exact: true }).click();
      await page.getByRole('option', { name: '计算机系统服务', exact: true }).click();
      await page.getByTestId('select-multiple').click();
      await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
      await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' })).toBeVisible();
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await expect(workflowListRecords.executionCountPopup).toHaveText('1');
      // 配置更新数据节点的数据表页面，查看更新后数据
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('button', { name: '软件销售 软件开发' })).not.toBeVisible();
      await expect(page.getByRole('button', { name: '软件销售 人工智能基础软件开发' })).not.toBeVisible();
      await expect(page.getByRole('button', { name: '软件开发 人工智能基础软件开发' })).not.toBeVisible();
      await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' }).nth(1)).toBeVisible();
      await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' }).nth(2)).toBeVisible();

      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.executionCountPopup.click();
      await page.getByText('View').click();
      await page.waitForLoadState('networkidle');
      await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
      await page.waitForLoadState('networkidle');
      //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
      const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
      const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
      // 判断字符串包含createRecordNodefieldData
      expect(nodeResultString).toContain('3');
      await page.getByLabel('Close', { exact: true }).click();

      // 4、后置处理：删除工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.deleteAction.click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, batch update, filter dropdown radio fields not empty, common table dropdown radio fields data, set trigger node dropdown radio fields variable', async ({
      page,
      mockCollections,
      mockRecords,
      mockPage,
    }) => {
      //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
      const triggerNodeAppendText = faker.lorem.word(4);
      const updateNodeAppendText = faker.lorem.word(4);
      //用例标题
      const caseTitle =
        'Collection event add data trigger, batch update, filter dropdown radio fields not empty, common table dropdown radio fields data, set trigger node dropdown radio fields variable';

      // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
      //创建数据表
      const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
      const e2eJsonCollectionName = 'tt_amt_org';
      //创建触发器节点数据表
      const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
      const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
      const triggerNodeFieldName = 'range_multipleselect';
      const triggerNodeFieldDisplayName = '经营范围(下拉多选)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

      // 创建更新节点数据表
      const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
      const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
      const updateNodeFieldName = 'range_multipleselect';
      const updateNodeFieldDisplayName = '经营范围(下拉多选)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
      const updateNodeCollectionRecordOne = ['F3134','I3006'];
      const updateNodeCollectionRecordTwo = ['F3134','I3007'];
      const updateNodeCollectionRecordThree = ['I3006','I3007'];
      const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ range_multipleselect: updateNodeCollectionRecordOne }, { range_multipleselect: updateNodeCollectionRecordTwo }, { range_multipleselect: updateNodeCollectionRecordThree }]);

      //配置工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      const workflowManagement = new WorkflowManagement(page);
      await workflowManagement.addNewButton.click();
      const createWorkFlow = new CreateWorkFlow(page);
      const workFlowName = caseTitle + triggerNodeAppendText;
      await createWorkFlow.name.fill(workFlowName);
      await createWorkFlow.triggerType.click();
      await page.getByTitle('Collection event').getByText('Collection event').click();
      await createWorkFlow.submitButton.click();
      await expect(page.getByText(workFlowName)).toBeVisible();

      //配置工作流触发器
      const workflowListRecords = new WorkflowListRecords(page, workFlowName);
      await workflowListRecords.configureAction.click();
      const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
      await collectionTriggerNode.nodeConfigure.click();
      await collectionTriggerNode.collectionDropDown.click();
      await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
      await collectionTriggerNode.triggerOnDropdown.click();
      await page.getByText('After record added', { exact: true }).click();
      await collectionTriggerNode.submitButton.click();

      //配置更新数据节点
      await collectionTriggerNode.addNodeButton.click();
      await page.getByRole('button', { name: 'update', exact: true }).click();
      const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page
        .getByLabel('Update record-Update record', { exact: true })
        .getByRole('textbox')
        .fill(updateRecordNodeName);
      const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
      await updateRecordNode.nodeConfigure.click();
      await updateRecordNode.collectionDropDown.click();
      await page.getByText(updateNodeCollectionDisplayName).click();
      // 设置过滤条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('filter-select-field').click();
      await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
      await page.getByTestId('filter-select-operator').click();
      await page.getByRole('option', { name: 'is not empty' }).click();

      // 设置字段
      await updateRecordNode.addFieldsButton.click();
      await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
      await page.getByLabel('variable-button').click();
      await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
      await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
      await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
      await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
      await updateRecordNode.submitButton.click();
      await page.getByRole('link', { name: 'Workflow' }).click();
      await workflowListRecords.editAction.click();
      const editWorkFlow = new EditWorkFlow(page, workFlowName);
      await editWorkFlow.statusIsOn.check();
      await editWorkFlow.submitButton.click();

      // 配置更新数据节点的数据表页面，查看更新前数据
      const updateNodeCollectionPage = mockPage();
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
      await page.mouse.move(300, 0);
      await page.getByText('Configure columns').hover();
      await page.getByText(updateNodeFieldDisplayName).click();
      await page.mouse.move(300, 0);
      // const updayteRecordNodefieldData = '注销';
      await expect(page.getByRole('button', { name: '软件销售 软件开发' })).toBeVisible();
      await expect(page.getByRole('button', { name: '软件销售 人工智能基础软件开发' })).toBeVisible();
      await expect(page.getByRole('button', { name: '软件开发 人工智能基础软件开发' })).toBeVisible();
      await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' })).not.toBeVisible();

      //配置新增数据触发工作流页面
      const addDataTriggerWorkflowPage = mockPage();
      await addDataTriggerWorkflowPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page.getByText('Configure columns').hover();
      await page.getByText(triggerNodeFieldDisplayName).click();
      await page.getByText('Configure actions').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
      await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

      await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
      await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: 'form Form' }).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

      await page.mouse.move(300, 0);

          // 2、测试步骤：录入数据触发工作流
      // const addDataTriggerWorkflowPagefieldData = '注销';
      await page.getByTestId('select-multiple').click();
      await page.getByRole('option', { name: '数据处理服务', exact: true }).click();
      await page.getByRole('option', { name: '计算机系统服务', exact: true }).click();
      await page.getByTestId('select-multiple').click();
      await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
      await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' })).toBeVisible();
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await expect(workflowListRecords.executionCountPopup).toHaveText('1');
      // 配置更新数据节点的数据表页面，查看更新后数据
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('button', { name: '软件销售 软件开发' })).not.toBeVisible();
      await expect(page.getByRole('button', { name: '软件销售 人工智能基础软件开发' })).not.toBeVisible();
      await expect(page.getByRole('button', { name: '软件开发 人工智能基础软件开发' })).not.toBeVisible();
      await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' }).nth(1)).toBeVisible();
      await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' }).nth(2)).toBeVisible();

      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.executionCountPopup.click();
      await page.getByText('View').click();
      await page.waitForLoadState('networkidle');
      await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
      await page.waitForLoadState('networkidle');
      //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
      const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
      const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
      // 判断字符串包含createRecordNodefieldData
      expect(nodeResultString).toContain('3');
      await page.getByLabel('Close', { exact: true }).click();

      // 4、后置处理：删除工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.deleteAction.click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, batch update, filter date field not null, common table date field data, set date field constant data', async ({
      page,
      mockCollections,
      mockRecords,
      mockPage,
    }) => {
      //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
      const triggerNodeAppendText = faker.lorem.word(4);
      const updateNodeAppendText = faker.lorem.word(4);
      //用例标题
      const caseTitle =
        'Collection event add data trigger, batch update, filter dropdown radio fields not null, common table dropdown radio fields data, set dropdown radio fields constant data';

      // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
      //创建数据表
      const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
      const e2eJsonCollectionName = 'tt_amt_org';
      //创建触发器节点数据表
      const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
      const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
      const triggerNodeFieldName = 'establishdate';
      const triggerNodeFieldDisplayName = '成立日期(日期)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

      // 创建更新节点数据表
      const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
      const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
      const updateNodeFieldName = 'establishdate';
      const updateNodeFieldDisplayName = '成立日期(日期)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
      // 定义随机4位数小数的数值
      // const updateNodeCollectionRecordOne = faker.datatype.float({ min: 0, max: 10000, precision: 4 });
      const updateNodeCollectionRecordOne = dayjs().add(-3,'day').format('YYYY-MM-DD');
      const updateNodeCollectionRecordTwo = dayjs().add(-2,'day').format('YYYY-MM-DD');
      const updateNodeCollectionRecordThree = dayjs().add(-1,'day').format('YYYY-MM-DD');
      const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ establishdate: updateNodeCollectionRecordOne }, { establishdate: updateNodeCollectionRecordTwo }, { establishdate: updateNodeCollectionRecordThree }]);

      //配置工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      const workflowManagement = new WorkflowManagement(page);
      await workflowManagement.addNewButton.click();
      const createWorkFlow = new CreateWorkFlow(page);
      const workFlowName = caseTitle + triggerNodeAppendText;
      await createWorkFlow.name.fill(workFlowName);
      await createWorkFlow.triggerType.click();
      await page.getByTitle('Collection event').getByText('Collection event').click();
      await createWorkFlow.submitButton.click();
      await expect(page.getByText(workFlowName)).toBeVisible();

      //配置工作流触发器
      const workflowListRecords = new WorkflowListRecords(page, workFlowName);
      await workflowListRecords.configureAction.click();
      const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
      await collectionTriggerNode.nodeConfigure.click();
      await collectionTriggerNode.collectionDropDown.click();
      await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
      await collectionTriggerNode.triggerOnDropdown.click();
      await page.getByText('After record added', { exact: true }).click();
      await collectionTriggerNode.submitButton.click();

      //配置更新数据节点
      await collectionTriggerNode.addNodeButton.click();
      await page.getByRole('button', { name: 'update', exact: true }).click();
      const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page
        .getByLabel('Update record-Update record', { exact: true })
        .getByRole('textbox')
        .fill(updateRecordNodeName);
      const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
      await updateRecordNode.nodeConfigure.click();
      await updateRecordNode.collectionDropDown.click();
      await page.getByText(updateNodeCollectionDisplayName).click();
      // 设置过滤条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('filter-select-field').click();
      await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
      await page.getByTestId('filter-select-operator').click();
      await page.getByRole('option', { name: 'is not empty' }).click();

      // 设置字段
      await updateRecordNode.addFieldsButton.click();
      await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
      const updateRecordNodefieldData = dayjs().format('YYYY-MM-DD');
      await page.getByLabel('block-item-CollectionFieldset').getByPlaceholder('Select date').click();
      await page.getByLabel('block-item-CollectionFieldset').getByPlaceholder('Select date').fill(updateRecordNodefieldData);
      await page.getByTitle(updateRecordNodefieldData.toString()).locator('div').click();
      await updateRecordNode.submitButton.click();

      await page.getByRole('link', { name: 'Workflow' }).click();
      await workflowListRecords.editAction.click();
      const editWorkFlow = new EditWorkFlow(page, workFlowName);
      await editWorkFlow.statusIsOn.check();
      await editWorkFlow.submitButton.click();

      // 配置更新数据节点的数据表页面，查看更新前数据
      const updateNodeCollectionPage = mockPage();
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
      await page.mouse.move(300, 0);
      await page.getByText('Configure columns').hover();
      await page.getByText(updateNodeFieldDisplayName).click();
      await page.mouse.move(300, 0);
      const updayteRecordNodefieldData = dayjs().format('YYYY-MM-DD');
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

      //配置新增数据触发工作流页面
      const addDataTriggerWorkflowPage = mockPage();
      await addDataTriggerWorkflowPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page.getByText('Configure columns').hover();
      await page.getByText(triggerNodeFieldDisplayName).click();
      await page.getByText('Configure actions').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
      await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

      await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
      await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: 'form Form' }).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

      await page.mouse.move(300, 0);

      // 2、测试步骤：录入数据触发工作流
      const addDataTriggerWorkflowPagefieldData = dayjs().format('YYYY-MM-DD');
      await page.getByPlaceholder('Select date').click();
      await page.getByTitle(addDataTriggerWorkflowPagefieldData.toString()).click();
      await page.mouse.move(300, 0, { steps: 100 });
      await page.mouse.click(300, 0);
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
      await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await expect(workflowListRecords.executionCountPopup).toHaveText('1');
      // 配置更新数据节点的数据表页面，查看更新后数据
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.executionCountPopup.click();
      await page.getByText('View').click();
      await page.waitForLoadState('networkidle');
      await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
      await page.waitForLoadState('networkidle');
      //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
      const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
      const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
      // 判断字符串包含createRecordNodefieldData
      expect(nodeResultString).toContain('3');
      await page.getByLabel('Close', { exact: true }).click();

      // 4、后置处理：删除工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.deleteAction.click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, batch update, filter date field not empty, common table date field data, set trigger node date field variable', async ({
      page,
      mockCollections,
      mockRecords,
      mockPage,
    }) => {
      //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
      const triggerNodeAppendText = faker.lorem.word(4);
      const updateNodeAppendText = faker.lorem.word(4);
      //用例标题
      const caseTitle =
        'Collection event add data trigger, batch update, filter dropdown radio fields not empty, common table dropdown radio fields data, set trigger node dropdown radio fields variable';

      // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
      //创建数据表
      const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
      const e2eJsonCollectionName = 'tt_amt_org';
      //创建触发器节点数据表
      const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
      const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
      const triggerNodeFieldName = 'establishdate';
      const triggerNodeFieldDisplayName = '成立日期(日期)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

      // 创建更新节点数据表
      const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
      const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
      const updateNodeFieldName = 'establishdate';
      const updateNodeFieldDisplayName = '成立日期(日期)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
      const updateNodeCollectionRecordOne = dayjs().add(-3,'day').format('YYYY-MM-DD');
      const updateNodeCollectionRecordTwo = dayjs().add(-2,'day').format('YYYY-MM-DD');
      const updateNodeCollectionRecordThree = dayjs().add(-1,'day').format('YYYY-MM-DD');
      const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ establishdate: updateNodeCollectionRecordOne }, { establishdate: updateNodeCollectionRecordTwo }, { establishdate: updateNodeCollectionRecordThree }]);

      //配置工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      const workflowManagement = new WorkflowManagement(page);
      await workflowManagement.addNewButton.click();
      const createWorkFlow = new CreateWorkFlow(page);
      const workFlowName = caseTitle + triggerNodeAppendText;
      await createWorkFlow.name.fill(workFlowName);
      await createWorkFlow.triggerType.click();
      await page.getByTitle('Collection event').getByText('Collection event').click();
      await createWorkFlow.submitButton.click();
      await expect(page.getByText(workFlowName)).toBeVisible();

      //配置工作流触发器
      const workflowListRecords = new WorkflowListRecords(page, workFlowName);
      await workflowListRecords.configureAction.click();
      const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
      await collectionTriggerNode.nodeConfigure.click();
      await collectionTriggerNode.collectionDropDown.click();
      await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
      await collectionTriggerNode.triggerOnDropdown.click();
      await page.getByText('After record added', { exact: true }).click();
      await collectionTriggerNode.submitButton.click();

      //配置更新数据节点
      await collectionTriggerNode.addNodeButton.click();
      await page.getByRole('button', { name: 'update', exact: true }).click();
      const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page
        .getByLabel('Update record-Update record', { exact: true })
        .getByRole('textbox')
        .fill(updateRecordNodeName);
      const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
      await updateRecordNode.nodeConfigure.click();
      await updateRecordNode.collectionDropDown.click();
      await page.getByText(updateNodeCollectionDisplayName).click();
      // 设置过滤条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('filter-select-field').click();
      await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
      await page.getByTestId('filter-select-operator').click();
      await page.getByRole('option', { name: 'is not empty' }).click();

      // 设置字段
      await updateRecordNode.addFieldsButton.click();
      await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
      await page.getByLabel('variable-button').click();
      await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
      await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
      await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
      await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
      await updateRecordNode.submitButton.click();
      await page.getByRole('link', { name: 'Workflow' }).click();
      await workflowListRecords.editAction.click();
      const editWorkFlow = new EditWorkFlow(page, workFlowName);
      await editWorkFlow.statusIsOn.check();
      await editWorkFlow.submitButton.click();

      // 配置更新数据节点的数据表页面，查看更新前数据
      const updateNodeCollectionPage = mockPage();
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
      await page.mouse.move(300, 0);
      await page.getByText('Configure columns').hover();
      await page.getByText(updateNodeFieldDisplayName).click();
      await page.mouse.move(300, 0);
      const updayteRecordNodefieldData = dayjs().format('YYYY-MM-DD');
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

      //配置新增数据触发工作流页面
      const addDataTriggerWorkflowPage = mockPage();
      await addDataTriggerWorkflowPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page.getByText('Configure columns').hover();
      await page.getByText(triggerNodeFieldDisplayName).click();
      await page.getByText('Configure actions').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
      await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

      await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
      await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: 'form Form' }).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

      await page.mouse.move(300, 0);

          // 2、测试步骤：录入数据触发工作流
      const addDataTriggerWorkflowPagefieldData = updayteRecordNodefieldData;
      await page.getByPlaceholder('Select date').click();
      await page.getByTitle(addDataTriggerWorkflowPagefieldData.toString()).click();
      await page.mouse.move(300, 0, { steps: 100 });
      await page.mouse.click(300, 0);
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
      await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await expect(workflowListRecords.executionCountPopup).toHaveText('1');
      // 配置更新数据节点的数据表页面，查看更新后数据
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.executionCountPopup.click();
      await page.getByText('View').click();
      await page.waitForLoadState('networkidle');
      await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
      await page.waitForLoadState('networkidle');
      //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
      const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
      const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
      // 判断字符串包含createRecordNodefieldData
      expect(nodeResultString).toContain('3');
      await page.getByLabel('Close', { exact: true }).click();

      // 4、后置处理：删除工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.deleteAction.click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(workFlowName)).toBeHidden();
    });
  });
  test.describe('update data node,update item by item', () => {
    test('Collection event add data trigger, update item by item, filter single line text field not empty, common table single line text field data, set single line text field constant data', async ({
      page,
      mockCollections,
      mockRecords,
      mockPage,
    }) => {
      //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
      const triggerNodeAppendText = faker.lorem.word(4);
      const updateNodeAppendText = faker.lorem.word(4);
      //用例标题
      const caseTitle =
        'Collection event add data trigger, update item by item, filter single line text field not empty, common table single line text field data, set single line text field constant data';

      // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
      //创建数据表
      const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
      const e2eJsonCollectionName = 'tt_amt_org';
      //创建触发器节点数据表
      const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
      const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
      const triggerNodeFieldName = 'orgname';
      const triggerNodeFieldDisplayName = '公司名称(单行文本)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

      // 创建更新节点数据表
      const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
      const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
      const updateNodeFieldName = 'orgname';
      const updateNodeFieldDisplayName = '公司名称(单行文本)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
      const updateNodeCollectionRecordOne = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
      const updateNodeCollectionRecordTwo = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
      const updateNodeCollectionRecordThree = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
      const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ orgname: updateNodeCollectionRecordOne }, { orgname: updateNodeCollectionRecordTwo }, { orgname: updateNodeCollectionRecordThree }]);

      //配置工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      const workflowManagement = new WorkflowManagement(page);
      await workflowManagement.addNewButton.click();
      const createWorkFlow = new CreateWorkFlow(page);
      const workFlowName = caseTitle + triggerNodeAppendText;
      await createWorkFlow.name.fill(workFlowName);
      await createWorkFlow.triggerType.click();
      await page.getByTitle('Collection event').getByText('Collection event').click();
      await createWorkFlow.submitButton.click();
      await expect(page.getByText(workFlowName)).toBeVisible();

      //配置工作流触发器
      const workflowListRecords = new WorkflowListRecords(page, workFlowName);
      await workflowListRecords.configureAction.click();
      const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
      await collectionTriggerNode.nodeConfigure.click();
      await collectionTriggerNode.collectionDropDown.click();
      await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
      await collectionTriggerNode.triggerOnDropdown.click();
      await page.getByText('After record added', { exact: true }).click();
      await collectionTriggerNode.submitButton.click();

      //配置更新数据节点
      await collectionTriggerNode.addNodeButton.click();
      await page.getByRole('button', { name: 'update', exact: true }).click();
      const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page
        .getByLabel('Update record-Update record', { exact: true })
        .getByRole('textbox')
        .fill(updateRecordNodeName);
      const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
      await updateRecordNode.nodeConfigure.click();
      await updateRecordNode.collectionDropDown.click();
      await page.getByText(updateNodeCollectionDisplayName).click();
      await updateRecordNode.articleByArticleUpdateModeRadio.click();
      // 设置过滤条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('filter-select-field').click();
      await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
      await page.getByTestId('filter-select-operator').click();
      await page.getByRole('option', { name: 'is not empty' }).click();

      // 设置字段
      await updateRecordNode.addFieldsButton.click();
      await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
      const updayteRecordNodefieldData = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page.getByLabel('block-item-CollectionFieldset').getByRole('textbox').fill(updayteRecordNodefieldData);
      await updateRecordNode.submitButton.click();
      await page.getByRole('link', { name: 'Workflow' }).click();
      await workflowListRecords.editAction.click();
      const editWorkFlow = new EditWorkFlow(page, workFlowName);
      await editWorkFlow.statusIsOn.check();
      await editWorkFlow.submitButton.click();

      // 配置更新数据节点的数据表页面，查看更新前数据
      const updateNodeCollectionPage = mockPage();
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
      await page.mouse.move(300, 0);
      await page.getByText('Configure columns').hover();
      await page.getByText(updateNodeFieldDisplayName).click();
      await page.mouse.move(300, 0);
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

      //配置新增数据触发工作流页面
      const addDataTriggerWorkflowPage = mockPage();
      await addDataTriggerWorkflowPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page.getByText('Configure columns').hover();
      await page.getByText(triggerNodeFieldDisplayName).click();
      await page.getByText('Configure actions').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
      await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

      await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
      await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: 'form Form' }).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

      await page.mouse.move(300, 0);

      // 2、测试步骤：录入数据触发工作流
      const addDataTriggerWorkflowPagefieldData = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page.getByRole('textbox').fill(addDataTriggerWorkflowPagefieldData.toString());
      await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
      await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await expect(workflowListRecords.executionCountPopup).toHaveText('1');
      // 配置更新数据节点的数据表页面，查看更新后数据
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.executionCountPopup.click();
      await page.getByText('View').click();
      await page.waitForLoadState('networkidle');
      await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
      await page.waitForLoadState('networkidle');
      //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
      const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
      const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
      // 判断字符串包含createRecordNodefieldData
      expect(nodeResultString).toContain('3');
      await page.getByLabel('Close', { exact: true }).click();

      // 4、后置处理：删除工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.deleteAction.click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, update item by item, filter single line text field not empty, common table single line text field data, set trigger node single line text field variable', async ({
      page,
      mockCollections,
      mockRecords,
      mockPage,
    }) => {
      //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
      const triggerNodeAppendText = faker.lorem.word(4);
      const updateNodeAppendText = faker.lorem.word(4);
      //用例标题
      const caseTitle =
        'Collection event add data trigger, update item by item, filter single line text field not empty, common table single line text field data, set trigger node single line text field variable';

      // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
      //创建数据表
      const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
      const e2eJsonCollectionName = 'tt_amt_org';
      //创建触发器节点数据表
      const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
      const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
      const triggerNodeFieldName = 'orgname';
      const triggerNodeFieldDisplayName = '公司名称(单行文本)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

      // 创建更新节点数据表
      const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
      const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
      const updateNodeFieldName = 'orgname';
      const updateNodeFieldDisplayName = '公司名称(单行文本)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
      const updateNodeCollectionRecordOne = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
      const updateNodeCollectionRecordTwo = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
      const updateNodeCollectionRecordThree = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
      const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ orgname: updateNodeCollectionRecordOne }, { orgname: updateNodeCollectionRecordTwo }, { orgname: updateNodeCollectionRecordThree }]);

      //配置工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      const workflowManagement = new WorkflowManagement(page);
      await workflowManagement.addNewButton.click();
      const createWorkFlow = new CreateWorkFlow(page);
      const workFlowName = caseTitle + triggerNodeAppendText;
      await createWorkFlow.name.fill(workFlowName);
      await createWorkFlow.triggerType.click();
      await page.getByTitle('Collection event').getByText('Collection event').click();
      await createWorkFlow.submitButton.click();
      await expect(page.getByText(workFlowName)).toBeVisible();

      //配置工作流触发器
      const workflowListRecords = new WorkflowListRecords(page, workFlowName);
      await workflowListRecords.configureAction.click();
      const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
      await collectionTriggerNode.nodeConfigure.click();
      await collectionTriggerNode.collectionDropDown.click();
      await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
      await collectionTriggerNode.triggerOnDropdown.click();
      await page.getByText('After record added', { exact: true }).click();
      await collectionTriggerNode.submitButton.click();

      //配置更新数据节点
      await collectionTriggerNode.addNodeButton.click();
      await page.getByRole('button', { name: 'update', exact: true }).click();
      const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page
        .getByLabel('Update record-Update record', { exact: true })
        .getByRole('textbox')
        .fill(updateRecordNodeName);
      const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
      await updateRecordNode.nodeConfigure.click();
      await updateRecordNode.collectionDropDown.click();
      await page.getByText(updateNodeCollectionDisplayName).click();
      await updateRecordNode.articleByArticleUpdateModeRadio.click();
      // 设置过滤条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('filter-select-field').click();
      await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
      await page.getByTestId('filter-select-operator').click();
      await page.getByRole('option', { name: 'is not empty' }).click();

      // 设置字段
      await updateRecordNode.addFieldsButton.click();
      await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
      await page.getByLabel('variable-button').click();
      await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
      await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
      await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
      await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
      await updateRecordNode.submitButton.click();
      await page.getByRole('link', { name: 'Workflow' }).click();
      await workflowListRecords.editAction.click();
      const editWorkFlow = new EditWorkFlow(page, workFlowName);
      await editWorkFlow.statusIsOn.check();
      await editWorkFlow.submitButton.click();

      // 配置更新数据节点的数据表页面，查看更新前数据
      const updateNodeCollectionPage = mockPage();
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
      await page.mouse.move(300, 0);
      await page.getByText('Configure columns').hover();
      await page.getByText(updateNodeFieldDisplayName).click();
      await page.mouse.move(300, 0);
      const updayteRecordNodefieldData = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

      //配置新增数据触发工作流页面
      const addDataTriggerWorkflowPage = mockPage();
      await addDataTriggerWorkflowPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page.getByText('Configure columns').hover();
      await page.getByText(triggerNodeFieldDisplayName).click();
      await page.getByText('Configure actions').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
      await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

      await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
      await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: 'form Form' }).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

      await page.mouse.move(300, 0);

      // 2、测试步骤：录入数据触发工作流
      const addDataTriggerWorkflowPagefieldData = updayteRecordNodefieldData;
      await page.getByRole('textbox').fill(addDataTriggerWorkflowPagefieldData.toString());
      await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
      await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await expect(workflowListRecords.executionCountPopup).toHaveText('1');
      // 配置更新数据节点的数据表页面，查看更新后数据
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.executionCountPopup.click();
      await page.getByText('View').click();
      await page.waitForLoadState('networkidle');
      await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
      await page.waitForLoadState('networkidle');
      //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
      const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
      const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
      // 判断字符串包含createRecordNodefieldData
      expect(nodeResultString).toContain('3');
      await page.getByLabel('Close', { exact: true }).click();

      // 4、后置处理：删除工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.deleteAction.click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, update item by item, filter multi-line text field not empty, common table multi-line text field data, set multi-line text field constant data', async ({
      page,
      mockCollections,
      mockRecords,
      mockPage,
    }) => {
      //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
      const triggerNodeAppendText = faker.lorem.word(4);
      const updateNodeAppendText = faker.lorem.word(4);
      //用例标题
      const caseTitle =
        'Collection event add data trigger, update item by item, filter multi-line text field not empty, common table multi-line text field data, set multi-line text field constant data';

      // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
      //创建数据表
      const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
      const e2eJsonCollectionName = 'tt_amt_org';
      //创建触发器节点数据表
      const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
      const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
      const triggerNodeFieldName = 'address';
      const triggerNodeFieldDisplayName = '公司地址(多行文本)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

      // 创建更新节点数据表
      const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
      const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
      const updateNodeFieldName = 'address';
      const updateNodeFieldDisplayName = '公司地址(多行文本)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
      const updateNodeCollectionRecordOne = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
      const updateNodeCollectionRecordTwo = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
      const updateNodeCollectionRecordThree = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
      const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ address: updateNodeCollectionRecordOne }, { address: updateNodeCollectionRecordTwo }, { address: updateNodeCollectionRecordThree }]);

      //配置工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      const workflowManagement = new WorkflowManagement(page);
      await workflowManagement.addNewButton.click();
      const createWorkFlow = new CreateWorkFlow(page);
      const workFlowName = caseTitle + triggerNodeAppendText;
      await createWorkFlow.name.fill(workFlowName);
      await createWorkFlow.triggerType.click();
      await page.getByTitle('Collection event').getByText('Collection event').click();
      await createWorkFlow.submitButton.click();
      await expect(page.getByText(workFlowName)).toBeVisible();

      //配置工作流触发器
      const workflowListRecords = new WorkflowListRecords(page, workFlowName);
      await workflowListRecords.configureAction.click();
      const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
      await collectionTriggerNode.nodeConfigure.click();
      await collectionTriggerNode.collectionDropDown.click();
      await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
      await collectionTriggerNode.triggerOnDropdown.click();
      await page.getByText('After record added', { exact: true }).click();
      await collectionTriggerNode.submitButton.click();

      //配置更新数据节点
      await collectionTriggerNode.addNodeButton.click();
      await page.getByRole('button', { name: 'update', exact: true }).click();
      const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page
        .getByLabel('Update record-Update record', { exact: true })
        .getByRole('textbox')
        .fill(updateRecordNodeName);
      const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
      await updateRecordNode.nodeConfigure.click();
      await updateRecordNode.collectionDropDown.click();
      await page.getByText(updateNodeCollectionDisplayName).click();
      await updateRecordNode.articleByArticleUpdateModeRadio.click();
      // 设置过滤条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('filter-select-field').click();
      await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
      await page.getByTestId('filter-select-operator').click();
      await page.getByRole('option', { name: 'is not empty' }).click();

      // 设置字段
      await updateRecordNode.addFieldsButton.click();
      await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
      const updayteRecordNodefieldData = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page.getByLabel('block-item-CollectionFieldset').getByRole('textbox').fill(updayteRecordNodefieldData);
      await updateRecordNode.submitButton.click();
      await page.getByRole('link', { name: 'Workflow' }).click();
      await workflowListRecords.editAction.click();
      const editWorkFlow = new EditWorkFlow(page, workFlowName);
      await editWorkFlow.statusIsOn.check();
      await editWorkFlow.submitButton.click();

      // 配置更新数据节点的数据表页面，查看更新前数据
      const updateNodeCollectionPage = mockPage();
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
      await page.mouse.move(300, 0);
      await page.getByText('Configure columns').hover();
      await page.getByText(updateNodeFieldDisplayName).click();
      await page.mouse.move(300, 0);
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

      //配置新增数据触发工作流页面
      const addDataTriggerWorkflowPage = mockPage();
      await addDataTriggerWorkflowPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page.getByText('Configure columns').hover();
      await page.getByText(triggerNodeFieldDisplayName).click();
      await page.getByText('Configure actions').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
      await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

      await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
      await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: 'form Form' }).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

      await page.mouse.move(300, 0);

      // 2、测试步骤：录入数据触发工作流
      const addDataTriggerWorkflowPagefieldData = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page.getByRole('textbox').fill(addDataTriggerWorkflowPagefieldData.toString());
      await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
      await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await expect(workflowListRecords.executionCountPopup).toHaveText('1');
      // 配置更新数据节点的数据表页面，查看更新后数据
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.executionCountPopup.click();
      await page.getByText('View').click();
      await page.waitForLoadState('networkidle');
      await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
      await page.waitForLoadState('networkidle');
      //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
      const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
      const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
      // 判断字符串包含createRecordNodefieldData
      expect(nodeResultString).toContain('3');
      await page.getByLabel('Close', { exact: true }).click();

      // 4、后置处理：删除工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.deleteAction.click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, update item by item, filter multiline text field not empty, common table multiline text field data, set trigger node multiline text field variable', async ({
      page,
      mockCollections,
      mockRecords,
      mockPage,
    }) => {
      //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
      const triggerNodeAppendText = faker.lorem.word(4);
      const updateNodeAppendText = faker.lorem.word(4);
      //用例标题
      const caseTitle =
        'Collection event add data trigger, update item by item, filter multiline text field not empty, common table multiline text field data, set trigger node multiline text field variable';

      // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
      //创建数据表
      const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
      const e2eJsonCollectionName = 'tt_amt_org';
      //创建触发器节点数据表
      const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
      const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
      const triggerNodeFieldName = 'address';
      const triggerNodeFieldDisplayName = '公司地址(多行文本)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

      // 创建更新节点数据表
      const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
      const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
      const updateNodeFieldName = 'address';
      const updateNodeFieldDisplayName = '公司地址(多行文本)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
      const updateNodeCollectionRecordOne = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
      const updateNodeCollectionRecordTwo = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
      const updateNodeCollectionRecordThree = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
      const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ address: updateNodeCollectionRecordOne }, { address: updateNodeCollectionRecordTwo }, { address: updateNodeCollectionRecordThree }]);

      //配置工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      const workflowManagement = new WorkflowManagement(page);
      await workflowManagement.addNewButton.click();
      const createWorkFlow = new CreateWorkFlow(page);
      const workFlowName = caseTitle + triggerNodeAppendText;
      await createWorkFlow.name.fill(workFlowName);
      await createWorkFlow.triggerType.click();
      await page.getByTitle('Collection event').getByText('Collection event').click();
      await createWorkFlow.submitButton.click();
      await expect(page.getByText(workFlowName)).toBeVisible();

      //配置工作流触发器
      const workflowListRecords = new WorkflowListRecords(page, workFlowName);
      await workflowListRecords.configureAction.click();
      const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
      await collectionTriggerNode.nodeConfigure.click();
      await collectionTriggerNode.collectionDropDown.click();
      await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
      await collectionTriggerNode.triggerOnDropdown.click();
      await page.getByText('After record added', { exact: true }).click();
      await collectionTriggerNode.submitButton.click();

      //配置更新数据节点
      await collectionTriggerNode.addNodeButton.click();
      await page.getByRole('button', { name: 'update', exact: true }).click();
      const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page
        .getByLabel('Update record-Update record', { exact: true })
        .getByRole('textbox')
        .fill(updateRecordNodeName);
      const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
      await updateRecordNode.nodeConfigure.click();
      await updateRecordNode.collectionDropDown.click();
      await page.getByText(updateNodeCollectionDisplayName).click();
      await updateRecordNode.articleByArticleUpdateModeRadio.click();
      // 设置过滤条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('filter-select-field').click();
      await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
      await page.getByTestId('filter-select-operator').click();
      await page.getByRole('option', { name: 'is not empty' }).click();

      // 设置字段
      await updateRecordNode.addFieldsButton.click();
      await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
      await page.getByLabel('variable-button').click();
      await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
      await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
      await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
      await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
      await updateRecordNode.submitButton.click();
      await page.getByRole('link', { name: 'Workflow' }).click();
      await workflowListRecords.editAction.click();
      const editWorkFlow = new EditWorkFlow(page, workFlowName);
      await editWorkFlow.statusIsOn.check();
      await editWorkFlow.submitButton.click();

      // 配置更新数据节点的数据表页面，查看更新前数据
      const updateNodeCollectionPage = mockPage();
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
      await page.mouse.move(300, 0);
      await page.getByText('Configure columns').hover();
      await page.getByText(updateNodeFieldDisplayName).click();
      await page.mouse.move(300, 0);
      const updayteRecordNodefieldData = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

      //配置新增数据触发工作流页面
      const addDataTriggerWorkflowPage = mockPage();
      await addDataTriggerWorkflowPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page.getByText('Configure columns').hover();
      await page.getByText(triggerNodeFieldDisplayName).click();
      await page.getByText('Configure actions').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
      await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

      await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
      await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: 'form Form' }).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

      await page.mouse.move(300, 0);

      // 2、测试步骤：录入数据触发工作流
      const addDataTriggerWorkflowPagefieldData = updayteRecordNodefieldData;
      await page.getByRole('textbox').fill(addDataTriggerWorkflowPagefieldData.toString());
      await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
      await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await expect(workflowListRecords.executionCountPopup).toHaveText('1');
      // 配置更新数据节点的数据表页面，查看更新后数据
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.executionCountPopup.click();
      await page.getByText('View').click();
      await page.waitForLoadState('networkidle');
      await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
      await page.waitForLoadState('networkidle');
      //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
      const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
      const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
      // 判断字符串包含createRecordNodefieldData
      expect(nodeResultString).toContain('3');
      await page.getByLabel('Close', { exact: true }).click();

      // 4、后置处理：删除工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.deleteAction.click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, update item by item, filter integer field not null, common table integer field data, set integer field constant data', async ({
      page,
      mockCollections,
      mockRecords,
      mockPage,
    }) => {
      //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
      const triggerNodeAppendText = faker.lorem.word(4);
      const updateNodeAppendText = faker.lorem.word(4);
      //用例标题
      const caseTitle =
        'Collection event add data trigger, update item by item, filter integer field not null, common table integer field data, set integer field constant data';

      // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
      //创建数据表
      const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
      const e2eJsonCollectionName = 'tt_amt_org';
      //创建触发器节点数据表
      const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
      const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
      const triggerNodeFieldName = 'staffnum';
      const triggerNodeFieldDisplayName = '员工人数(整数)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

      // 创建更新节点数据表
      const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
      const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
      const updateNodeFieldName = 'staffnum';
      const updateNodeFieldDisplayName = '员工人数(整数)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
      const updateNodeCollectionRecordOne = faker.number.int();
      const updateNodeCollectionRecordTwo = faker.number.int();
      const updateNodeCollectionRecordThree = faker.number.int();
      const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ staffnum: updateNodeCollectionRecordOne }, { staffnum: updateNodeCollectionRecordTwo }, { staffnum: updateNodeCollectionRecordThree }]);

      //配置工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      const workflowManagement = new WorkflowManagement(page);
      await workflowManagement.addNewButton.click();
      const createWorkFlow = new CreateWorkFlow(page);
      const workFlowName = caseTitle + triggerNodeAppendText;
      await createWorkFlow.name.fill(workFlowName);
      await createWorkFlow.triggerType.click();
      await page.getByTitle('Collection event').getByText('Collection event').click();
      await createWorkFlow.submitButton.click();
      await expect(page.getByText(workFlowName)).toBeVisible();

      //配置工作流触发器
      const workflowListRecords = new WorkflowListRecords(page, workFlowName);
      await workflowListRecords.configureAction.click();
      const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
      await collectionTriggerNode.nodeConfigure.click();
      await collectionTriggerNode.collectionDropDown.click();
      await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
      await collectionTriggerNode.triggerOnDropdown.click();
      await page.getByText('After record added', { exact: true }).click();
      await collectionTriggerNode.submitButton.click();

      //配置更新数据节点
      await collectionTriggerNode.addNodeButton.click();
      await page.getByRole('button', { name: 'update', exact: true }).click();
      const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page
        .getByLabel('Update record-Update record', { exact: true })
        .getByRole('textbox')
        .fill(updateRecordNodeName);
      const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
      await updateRecordNode.nodeConfigure.click();
      await updateRecordNode.collectionDropDown.click();
      await page.getByText(updateNodeCollectionDisplayName).click();
      await updateRecordNode.articleByArticleUpdateModeRadio.click();
      // 设置过滤条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('filter-select-field').click();
      await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
      await page.getByTestId('filter-select-operator').click();
      await page.getByRole('option', { name: 'is not empty' }).click();

      // 设置字段
      await updateRecordNode.addFieldsButton.click();
      await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
      const updayteRecordNodefieldData = faker.number.int();
      await page.getByLabel('block-item-CollectionFieldset').getByRole('spinbutton').fill(updayteRecordNodefieldData.toString());
      await updateRecordNode.submitButton.click();
      await page.getByRole('link', { name: 'Workflow' }).click();
      await workflowListRecords.editAction.click();
      const editWorkFlow = new EditWorkFlow(page, workFlowName);
      await editWorkFlow.statusIsOn.check();
      await editWorkFlow.submitButton.click();

      // 配置更新数据节点的数据表页面，查看更新前数据
      const updateNodeCollectionPage = mockPage();
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
      await page.mouse.move(300, 0);
      await page.getByText('Configure columns').hover();
      await page.getByText(updateNodeFieldDisplayName).click();
      await page.mouse.move(300, 0);
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

      //配置新增数据触发工作流页面
      const addDataTriggerWorkflowPage = mockPage();
      await addDataTriggerWorkflowPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page.getByText('Configure columns').hover();
      await page.getByText(triggerNodeFieldDisplayName).click();
      await page.getByText('Configure actions').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
      await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

      await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
      await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: 'form Form' }).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

      await page.mouse.move(300, 0);

      // 2、测试步骤：录入数据触发工作流
      const addDataTriggerWorkflowPagefieldData = faker.number.int();
      await page.getByRole('spinbutton').fill(addDataTriggerWorkflowPagefieldData.toString());
      await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
      await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await expect(workflowListRecords.executionCountPopup).toHaveText('1');
      // 配置更新数据节点的数据表页面，查看更新后数据
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.executionCountPopup.click();
      await page.getByText('View').click();
      await page.waitForLoadState('networkidle');
      await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
      await page.waitForLoadState('networkidle');
      //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
      const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
      const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
      // 判断字符串包含createRecordNodefieldData
      expect(nodeResultString).toContain('3');
      await page.getByLabel('Close', { exact: true }).click();

      // 4、后置处理：删除工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.deleteAction.click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, update item by item, filter integer field not empty, common table integer field data, set trigger node integer field variable', async ({
      page,
      mockCollections,
      mockRecords,
      mockPage,
    }) => {
      //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
      const triggerNodeAppendText = faker.lorem.word(4);
      const updateNodeAppendText = faker.lorem.word(4);
      //用例标题
      const caseTitle =
        'Collection event add data trigger, update item by item, filter integer field not empty, common table integer field data, set trigger node integer field variable';

      // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
      //创建数据表
      const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
      const e2eJsonCollectionName = 'tt_amt_org';
      //创建触发器节点数据表
      const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
      const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
      const triggerNodeFieldName = 'staffnum';
      const triggerNodeFieldDisplayName = '员工人数(整数)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

      // 创建更新节点数据表
      const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
      const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
      const updateNodeFieldName = 'staffnum';
      const updateNodeFieldDisplayName = '员工人数(整数)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
      const updateNodeCollectionRecordOne = faker.number.int();
      const updateNodeCollectionRecordTwo = faker.number.int();
      const updateNodeCollectionRecordThree = faker.number.int();
      const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ staffnum: updateNodeCollectionRecordOne }, { staffnum: updateNodeCollectionRecordTwo }, { staffnum: updateNodeCollectionRecordThree }]);

      //配置工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      const workflowManagement = new WorkflowManagement(page);
      await workflowManagement.addNewButton.click();
      const createWorkFlow = new CreateWorkFlow(page);
      const workFlowName = caseTitle + triggerNodeAppendText;
      await createWorkFlow.name.fill(workFlowName);
      await createWorkFlow.triggerType.click();
      await page.getByTitle('Collection event').getByText('Collection event').click();
      await createWorkFlow.submitButton.click();
      await expect(page.getByText(workFlowName)).toBeVisible();

      //配置工作流触发器
      const workflowListRecords = new WorkflowListRecords(page, workFlowName);
      await workflowListRecords.configureAction.click();
      const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
      await collectionTriggerNode.nodeConfigure.click();
      await collectionTriggerNode.collectionDropDown.click();
      await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
      await collectionTriggerNode.triggerOnDropdown.click();
      await page.getByText('After record added', { exact: true }).click();
      await collectionTriggerNode.submitButton.click();

      //配置更新数据节点
      await collectionTriggerNode.addNodeButton.click();
      await page.getByRole('button', { name: 'update', exact: true }).click();
      const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page
        .getByLabel('Update record-Update record', { exact: true })
        .getByRole('textbox')
        .fill(updateRecordNodeName);
      const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
      await updateRecordNode.nodeConfigure.click();
      await updateRecordNode.collectionDropDown.click();
      await page.getByText(updateNodeCollectionDisplayName).click();
      await updateRecordNode.articleByArticleUpdateModeRadio.click();
      // 设置过滤条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('filter-select-field').click();
      await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
      await page.getByTestId('filter-select-operator').click();
      await page.getByRole('option', { name: 'is not empty' }).click();

      // 设置字段
      await updateRecordNode.addFieldsButton.click();
      await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
      await page.getByLabel('variable-button').click();
      await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
      await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
      await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
      await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
      await updateRecordNode.submitButton.click();
      await page.getByRole('link', { name: 'Workflow' }).click();
      await workflowListRecords.editAction.click();
      const editWorkFlow = new EditWorkFlow(page, workFlowName);
      await editWorkFlow.statusIsOn.check();
      await editWorkFlow.submitButton.click();

      // 配置更新数据节点的数据表页面，查看更新前数据
      const updateNodeCollectionPage = mockPage();
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
      await page.mouse.move(300, 0);
      await page.getByText('Configure columns').hover();
      await page.getByText(updateNodeFieldDisplayName).click();
      await page.mouse.move(300, 0);
      const updayteRecordNodefieldData = faker.number.int();
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

      //配置新增数据触发工作流页面
      const addDataTriggerWorkflowPage = mockPage();
      await addDataTriggerWorkflowPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page.getByText('Configure columns').hover();
      await page.getByText(triggerNodeFieldDisplayName).click();
      await page.getByText('Configure actions').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
      await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

      await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
      await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: 'form Form' }).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

      await page.mouse.move(300, 0);

      // 2、测试步骤：录入数据触发工作流
      const addDataTriggerWorkflowPagefieldData = updayteRecordNodefieldData;
      await page.getByRole('spinbutton').fill(addDataTriggerWorkflowPagefieldData.toString());
      await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
      await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await expect(workflowListRecords.executionCountPopup).toHaveText('1');
      // 配置更新数据节点的数据表页面，查看更新后数据
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.executionCountPopup.click();
      await page.getByText('View').click();
      await page.waitForLoadState('networkidle');
      await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
      await page.waitForLoadState('networkidle');
      //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
      const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
      const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
      // 判断字符串包含createRecordNodefieldData
      expect(nodeResultString).toContain('3');
      await page.getByLabel('Close', { exact: true }).click();

      // 4、后置处理：删除工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.deleteAction.click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, update item by item, filter numeric field not null, common table numeric field data, set numeric field constant data', async ({
      page,
      mockCollections,
      mockRecords,
      mockPage,
    }) => {
      //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
      const triggerNodeAppendText = faker.lorem.word(4);
      const updateNodeAppendText = faker.lorem.word(4);
      //用例标题
      const caseTitle =
        'Collection event add data trigger, update item by item, filter numeric field not null, common table numeric field data, set numeric field constant data';

      // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
      //创建数据表
      const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
      const e2eJsonCollectionName = 'tt_amt_org';
      //创建触发器节点数据表
      const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
      const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
      const triggerNodeFieldName = 'regcapital';
      const triggerNodeFieldDisplayName = '注册资本(数字)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

      // 创建更新节点数据表
      const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
      const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
      const updateNodeFieldName = 'regcapital';
      const updateNodeFieldDisplayName = '注册资本(数字)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
      // 定义随机4位数小数的数值
      // const updateNodeCollectionRecordOne = faker.datatype.float({ min: 0, max: 10000, precision: 4 });
      const updateNodeCollectionRecordOne = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
      const updateNodeCollectionRecordTwo = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
      const updateNodeCollectionRecordThree = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
      const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ regcapital: updateNodeCollectionRecordOne }, { regcapital: updateNodeCollectionRecordTwo }, { regcapital: updateNodeCollectionRecordThree }]);

      //配置工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      const workflowManagement = new WorkflowManagement(page);
      await workflowManagement.addNewButton.click();
      const createWorkFlow = new CreateWorkFlow(page);
      const workFlowName = caseTitle + triggerNodeAppendText;
      await createWorkFlow.name.fill(workFlowName);
      await createWorkFlow.triggerType.click();
      await page.getByTitle('Collection event').getByText('Collection event').click();
      await createWorkFlow.submitButton.click();
      await expect(page.getByText(workFlowName)).toBeVisible();

      //配置工作流触发器
      const workflowListRecords = new WorkflowListRecords(page, workFlowName);
      await workflowListRecords.configureAction.click();
      const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
      await collectionTriggerNode.nodeConfigure.click();
      await collectionTriggerNode.collectionDropDown.click();
      await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
      await collectionTriggerNode.triggerOnDropdown.click();
      await page.getByText('After record added', { exact: true }).click();
      await collectionTriggerNode.submitButton.click();

      //配置更新数据节点
      await collectionTriggerNode.addNodeButton.click();
      await page.getByRole('button', { name: 'update', exact: true }).click();
      const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page
        .getByLabel('Update record-Update record', { exact: true })
        .getByRole('textbox')
        .fill(updateRecordNodeName);
      const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
      await updateRecordNode.nodeConfigure.click();
      await updateRecordNode.collectionDropDown.click();
      await page.getByText(updateNodeCollectionDisplayName).click();
      await updateRecordNode.articleByArticleUpdateModeRadio.click();
      // 设置过滤条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('filter-select-field').click();
      await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
      await page.getByTestId('filter-select-operator').click();
      await page.getByRole('option', { name: 'is not empty' }).click();

      // 设置字段
      await updateRecordNode.addFieldsButton.click();
      await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
      const updayteRecordNodefieldData = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
      await page.getByLabel('block-item-CollectionFieldset').getByRole('spinbutton').fill(updayteRecordNodefieldData.toString());
      await updateRecordNode.submitButton.click();
      await page.getByRole('link', { name: 'Workflow' }).click();
      await workflowListRecords.editAction.click();
      const editWorkFlow = new EditWorkFlow(page, workFlowName);
      await editWorkFlow.statusIsOn.check();
      await editWorkFlow.submitButton.click();

      // 配置更新数据节点的数据表页面，查看更新前数据
      const updateNodeCollectionPage = mockPage();
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
      await page.mouse.move(300, 0);
      await page.getByText('Configure columns').hover();
      await page.getByText(updateNodeFieldDisplayName).click();
      await page.mouse.move(300, 0);
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

      //配置新增数据触发工作流页面
      const addDataTriggerWorkflowPage = mockPage();
      await addDataTriggerWorkflowPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page.getByText('Configure columns').hover();
      await page.getByText(triggerNodeFieldDisplayName).click();
      await page.getByText('Configure actions').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
      await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

      await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
      await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: 'form Form' }).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

      await page.mouse.move(300, 0);

      // 2、测试步骤：录入数据触发工作流
      const addDataTriggerWorkflowPagefieldData = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
      await page.getByRole('spinbutton').fill(addDataTriggerWorkflowPagefieldData.toString());
      await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
      await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await expect(workflowListRecords.executionCountPopup).toHaveText('1');
      // 配置更新数据节点的数据表页面，查看更新后数据
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.executionCountPopup.click();
      await page.getByText('View').click();
      await page.waitForLoadState('networkidle');
      await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
      await page.waitForLoadState('networkidle');
      //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
      const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
      const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
      // 判断字符串包含createRecordNodefieldData
      expect(nodeResultString).toContain('3');
      await page.getByLabel('Close', { exact: true }).click();

      // 4、后置处理：删除工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.deleteAction.click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, update item by item, filter numeric field not empty, common table numeric field data, set trigger node numeric field variable', async ({
      page,
      mockCollections,
      mockRecords,
      mockPage,
    }) => {
      //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
      const triggerNodeAppendText = faker.lorem.word(4);
      const updateNodeAppendText = faker.lorem.word(4);
      //用例标题
      const caseTitle =
        'Collection event add data trigger, update item by item, filter numeric field not empty, common table numeric field data, set trigger node numeric field variable';

      // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
      //创建数据表
      const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
      const e2eJsonCollectionName = 'tt_amt_org';
      //创建触发器节点数据表
      const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
      const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
      const triggerNodeFieldName = 'regcapital';
      const triggerNodeFieldDisplayName = '注册资本(数字)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

      // 创建更新节点数据表
      const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
      const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
      const updateNodeFieldName = 'regcapital';
      const updateNodeFieldDisplayName = '注册资本(数字)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
      const updateNodeCollectionRecordOne = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
      const updateNodeCollectionRecordTwo = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
      const updateNodeCollectionRecordThree = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
      const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ regcapital: updateNodeCollectionRecordOne }, { regcapital: updateNodeCollectionRecordTwo }, { regcapital: updateNodeCollectionRecordThree }]);

      //配置工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      const workflowManagement = new WorkflowManagement(page);
      await workflowManagement.addNewButton.click();
      const createWorkFlow = new CreateWorkFlow(page);
      const workFlowName = caseTitle + triggerNodeAppendText;
      await createWorkFlow.name.fill(workFlowName);
      await createWorkFlow.triggerType.click();
      await page.getByTitle('Collection event').getByText('Collection event').click();
      await createWorkFlow.submitButton.click();
      await expect(page.getByText(workFlowName)).toBeVisible();

      //配置工作流触发器
      const workflowListRecords = new WorkflowListRecords(page, workFlowName);
      await workflowListRecords.configureAction.click();
      const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
      await collectionTriggerNode.nodeConfigure.click();
      await collectionTriggerNode.collectionDropDown.click();
      await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
      await collectionTriggerNode.triggerOnDropdown.click();
      await page.getByText('After record added', { exact: true }).click();
      await collectionTriggerNode.submitButton.click();

      //配置更新数据节点
      await collectionTriggerNode.addNodeButton.click();
      await page.getByRole('button', { name: 'update', exact: true }).click();
      const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page
        .getByLabel('Update record-Update record', { exact: true })
        .getByRole('textbox')
        .fill(updateRecordNodeName);
      const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
      await updateRecordNode.nodeConfigure.click();
      await updateRecordNode.collectionDropDown.click();
      await page.getByText(updateNodeCollectionDisplayName).click();
      await updateRecordNode.articleByArticleUpdateModeRadio.click();
      // 设置过滤条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('filter-select-field').click();
      await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
      await page.getByTestId('filter-select-operator').click();
      await page.getByRole('option', { name: 'is not empty' }).click();

      // 设置字段
      await updateRecordNode.addFieldsButton.click();
      await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
      await page.getByLabel('variable-button').click();
      await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
      await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
      await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
      await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
      await updateRecordNode.submitButton.click();
      await page.getByRole('link', { name: 'Workflow' }).click();
      await workflowListRecords.editAction.click();
      const editWorkFlow = new EditWorkFlow(page, workFlowName);
      await editWorkFlow.statusIsOn.check();
      await editWorkFlow.submitButton.click();

      // 配置更新数据节点的数据表页面，查看更新前数据
      const updateNodeCollectionPage = mockPage();
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
      await page.mouse.move(300, 0);
      await page.getByText('Configure columns').hover();
      await page.getByText(updateNodeFieldDisplayName).click();
      await page.mouse.move(300, 0);
      const updayteRecordNodefieldData = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

      //配置新增数据触发工作流页面
      const addDataTriggerWorkflowPage = mockPage();
      await addDataTriggerWorkflowPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page.getByText('Configure columns').hover();
      await page.getByText(triggerNodeFieldDisplayName).click();
      await page.getByText('Configure actions').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
      await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

      await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
      await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: 'form Form' }).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

      await page.mouse.move(300, 0);

      // 2、测试步骤：录入数据触发工作流
      const addDataTriggerWorkflowPagefieldData = updayteRecordNodefieldData;
      await page.getByRole('spinbutton').fill(addDataTriggerWorkflowPagefieldData.toString());
      await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
      await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await expect(workflowListRecords.executionCountPopup).toHaveText('1');
      // 配置更新数据节点的数据表页面，查看更新后数据
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.executionCountPopup.click();
      await page.getByText('View').click();
      await page.waitForLoadState('networkidle');
      await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
      await page.waitForLoadState('networkidle');
      //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
      const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
      const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
      // 判断字符串包含createRecordNodefieldData
      expect(nodeResultString).toContain('3');
      await page.getByLabel('Close', { exact: true }).click();

      // 4、后置处理：删除工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.deleteAction.click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, update item by item, filter dropdown radio field not null, common table dropdown radio field data, set dropdown radio field constant data', async ({
      page,
      mockCollections,
      mockRecords,
      mockPage,
    }) => {
      //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
      const triggerNodeAppendText = faker.lorem.word(4);
      const updateNodeAppendText = faker.lorem.word(4);
      //用例标题
      const caseTitle =
        'Collection event add data trigger, update item by item, filter dropdown radio field not null, common table dropdown radio field data, set dropdown radio field constant data';

      // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
      //创建数据表
      const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
      const e2eJsonCollectionName = 'tt_amt_org';
      //创建触发器节点数据表
      const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
      const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
      const triggerNodeFieldName = 'status_singleselect';
      const triggerNodeFieldDisplayName = '公司状态(下拉单选)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

      // 创建更新节点数据表
      const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
      const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
      const updateNodeFieldName = 'status_singleselect';
      const updateNodeFieldDisplayName = '公司状态(下拉单选)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
      // 定义随机4位数小数的数值
      // const updateNodeCollectionRecordOne = faker.datatype.float({ min: 0, max: 10000, precision: 4 });
      const updateNodeCollectionRecordOne = '1';
      const updateNodeCollectionRecordTwo = '2';
      const updateNodeCollectionRecordThree = '3';
      const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ status_singleselect: updateNodeCollectionRecordOne }, { status_singleselect: updateNodeCollectionRecordTwo }, { status_singleselect: updateNodeCollectionRecordThree }]);

      //配置工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      const workflowManagement = new WorkflowManagement(page);
      await workflowManagement.addNewButton.click();
      const createWorkFlow = new CreateWorkFlow(page);
      const workFlowName = caseTitle + triggerNodeAppendText;
      await createWorkFlow.name.fill(workFlowName);
      await createWorkFlow.triggerType.click();
      await page.getByTitle('Collection event').getByText('Collection event').click();
      await createWorkFlow.submitButton.click();
      await expect(page.getByText(workFlowName)).toBeVisible();

      //配置工作流触发器
      const workflowListRecords = new WorkflowListRecords(page, workFlowName);
      await workflowListRecords.configureAction.click();
      const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
      await collectionTriggerNode.nodeConfigure.click();
      await collectionTriggerNode.collectionDropDown.click();
      await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
      await collectionTriggerNode.triggerOnDropdown.click();
      await page.getByText('After record added', { exact: true }).click();
      await collectionTriggerNode.submitButton.click();

      //配置更新数据节点
      await collectionTriggerNode.addNodeButton.click();
      await page.getByRole('button', { name: 'update', exact: true }).click();
      const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page
        .getByLabel('Update record-Update record', { exact: true })
        .getByRole('textbox')
        .fill(updateRecordNodeName);
      const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
      await updateRecordNode.nodeConfigure.click();
      await updateRecordNode.collectionDropDown.click();
      await page.getByText(updateNodeCollectionDisplayName).click();
      await updateRecordNode.articleByArticleUpdateModeRadio.click();
      // 设置过滤条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('filter-select-field').click();
      await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
      await page.getByTestId('filter-select-operator').click();
      await page.getByRole('option', { name: 'is not empty' }).click();

      // 设置字段
      await updateRecordNode.addFieldsButton.click();
      await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
      const updayteRecordNodefieldData = '注销';
      await page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByTestId('select-single').getByLabel('Search').click();
      await page.getByRole('option', { name: '注销' }).click();
      await updateRecordNode.submitButton.click();

      await page.getByRole('link', { name: 'Workflow' }).click();
      await workflowListRecords.editAction.click();
      const editWorkFlow = new EditWorkFlow(page, workFlowName);
      await editWorkFlow.statusIsOn.check();
      await editWorkFlow.submitButton.click();

      // 配置更新数据节点的数据表页面，查看更新前数据
      const updateNodeCollectionPage = mockPage();
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
      await page.mouse.move(300, 0);
      await page.getByText('Configure columns').hover();
      await page.getByText(updateNodeFieldDisplayName).click();
      await page.mouse.move(300, 0);
      await expect(page.getByText('存续')).toBeVisible();
      await expect(page.getByText('在业')).toBeVisible();
      await expect(page.getByText('吊销')).toBeVisible();
      await expect(page.getByText('注销')).not.toBeVisible();

      //配置新增数据触发工作流页面
      const addDataTriggerWorkflowPage = mockPage();
      await addDataTriggerWorkflowPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page.getByText('Configure columns').hover();
      await page.getByText(triggerNodeFieldDisplayName).click();
      await page.getByText('Configure actions').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
      await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

      await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
      await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: 'form Form' }).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

      await page.mouse.move(300, 0);

      // 2、测试步骤：录入数据触发工作流
      const addDataTriggerWorkflowPagefieldData = '注销';
      await page.getByTestId('select-single').getByLabel('Search').click();
      await page.getByRole('option', { name: '注销' }).click();
      await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
      await expect(page.getByRole('button', { name: '注销' })).toBeVisible();
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await expect(workflowListRecords.executionCountPopup).toHaveText('1');
      // 配置更新数据节点的数据表页面，查看更新后数据
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('存续')).not.toBeVisible();
      await expect(page.getByText('在业')).not.toBeVisible();
      await expect(page.getByText('吊销')).not.toBeVisible();
      await expect(page.getByText('注销').first()).toBeVisible();
      await expect(page.getByText('注销').nth(1)).toBeVisible();
      await expect(page.getByText('注销').nth(2)).toBeVisible();

      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.executionCountPopup.click();
      await page.getByText('View').click();
      await page.waitForLoadState('networkidle');
      await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
      await page.waitForLoadState('networkidle');
      //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
      const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
      const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
      // 判断字符串包含createRecordNodefieldData
      expect(nodeResultString).toContain('3');
      await page.getByLabel('Close', { exact: true }).click();

      // 4、后置处理：删除工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.deleteAction.click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, update item by item, filter dropdown radio field not empty, common table dropdown radio field data, set trigger node dropdown radio field variable', async ({
      page,
      mockCollections,
      mockRecords,
      mockPage,
    }) => {
      //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
      const triggerNodeAppendText = faker.lorem.word(4);
      const updateNodeAppendText = faker.lorem.word(4);
      //用例标题
      const caseTitle =
        'Collection event add data trigger, update item by item, filter dropdown radio field not empty, common table dropdown radio field data, set trigger node dropdown radio field variable';

      // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
      //创建数据表
      const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
      const e2eJsonCollectionName = 'tt_amt_org';
      //创建触发器节点数据表
      const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
      const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
      const triggerNodeFieldName = 'status_singleselect';
      const triggerNodeFieldDisplayName = '公司状态(下拉单选)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

      // 创建更新节点数据表
      const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
      const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
      const updateNodeFieldName = 'status_singleselect';
      const updateNodeFieldDisplayName = '公司状态(下拉单选)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
      const updateNodeCollectionRecordOne = '1';
      const updateNodeCollectionRecordTwo = '2';
      const updateNodeCollectionRecordThree = '3';
      const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ status_singleselect: updateNodeCollectionRecordOne }, { status_singleselect: updateNodeCollectionRecordTwo }, { status_singleselect: updateNodeCollectionRecordThree }]);

      //配置工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      const workflowManagement = new WorkflowManagement(page);
      await workflowManagement.addNewButton.click();
      const createWorkFlow = new CreateWorkFlow(page);
      const workFlowName = caseTitle + triggerNodeAppendText;
      await createWorkFlow.name.fill(workFlowName);
      await createWorkFlow.triggerType.click();
      await page.getByTitle('Collection event').getByText('Collection event').click();
      await createWorkFlow.submitButton.click();
      await expect(page.getByText(workFlowName)).toBeVisible();

      //配置工作流触发器
      const workflowListRecords = new WorkflowListRecords(page, workFlowName);
      await workflowListRecords.configureAction.click();
      const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
      await collectionTriggerNode.nodeConfigure.click();
      await collectionTriggerNode.collectionDropDown.click();
      await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
      await collectionTriggerNode.triggerOnDropdown.click();
      await page.getByText('After record added', { exact: true }).click();
      await collectionTriggerNode.submitButton.click();

      //配置更新数据节点
      await collectionTriggerNode.addNodeButton.click();
      await page.getByRole('button', { name: 'update', exact: true }).click();
      const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page
        .getByLabel('Update record-Update record', { exact: true })
        .getByRole('textbox')
        .fill(updateRecordNodeName);
      const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
      await updateRecordNode.nodeConfigure.click();
      await updateRecordNode.collectionDropDown.click();
      await page.getByText(updateNodeCollectionDisplayName).click();
      await updateRecordNode.articleByArticleUpdateModeRadio.click();
      // 设置过滤条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('filter-select-field').click();
      await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
      await page.getByTestId('filter-select-operator').click();
      await page.getByRole('option', { name: 'is not empty' }).click();

      // 设置字段
      await updateRecordNode.addFieldsButton.click();
      await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
      await page.getByLabel('variable-button').click();
      await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
      await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
      await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
      await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
      await updateRecordNode.submitButton.click();
      await page.getByRole('link', { name: 'Workflow' }).click();
      await workflowListRecords.editAction.click();
      const editWorkFlow = new EditWorkFlow(page, workFlowName);
      await editWorkFlow.statusIsOn.check();
      await editWorkFlow.submitButton.click();

      // 配置更新数据节点的数据表页面，查看更新前数据
      const updateNodeCollectionPage = mockPage();
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
      await page.mouse.move(300, 0);
      await page.getByText('Configure columns').hover();
      await page.getByText(updateNodeFieldDisplayName).click();
      await page.mouse.move(300, 0);
      // const updayteRecordNodefieldData = '注销';
      await expect(page.getByText('存续')).toBeVisible();
      await expect(page.getByText('在业')).toBeVisible();
      await expect(page.getByText('吊销')).toBeVisible();
      await expect(page.getByText('注销')).not.toBeVisible();

      //配置新增数据触发工作流页面
      const addDataTriggerWorkflowPage = mockPage();
      await addDataTriggerWorkflowPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page.getByText('Configure columns').hover();
      await page.getByText(triggerNodeFieldDisplayName).click();
      await page.getByText('Configure actions').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
      await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

      await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
      await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: 'form Form' }).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

      await page.mouse.move(300, 0);

      // 2、测试步骤：录入数据触发工作流
      const addDataTriggerWorkflowPagefieldData = '注销';
      await page.getByTestId('select-single').getByLabel('Search').click();
      await page.getByRole('option', { name: '注销' }).click();
      await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
      await expect(page.getByRole('button', { name: '注销' })).toBeVisible();
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await expect(workflowListRecords.executionCountPopup).toHaveText('1');
      // 配置更新数据节点的数据表页面，查看更新后数据
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('存续')).not.toBeVisible();
      await expect(page.getByText('在业')).not.toBeVisible();
      await expect(page.getByText('吊销')).not.toBeVisible();
      await expect(page.getByText('注销').first()).toBeVisible();
      await expect(page.getByText('注销').nth(1)).toBeVisible();
      await expect(page.getByText('注销').nth(2)).toBeVisible();

      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.executionCountPopup.click();
      await page.getByText('View').click();
      await page.waitForLoadState('networkidle');
      await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
      await page.waitForLoadState('networkidle');
      //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
      const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
      const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
      // 判断字符串包含createRecordNodefieldData
      expect(nodeResultString).toContain('3');
      await page.getByLabel('Close', { exact: true }).click();

      // 4、后置处理：删除工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.deleteAction.click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, update item by item, filter dropdown radio fields not null, common table dropdown radio fields data, set dropdown radio fields constant data', async ({
      page,
      mockCollections,
      mockRecords,
      mockPage,
    }) => {
      //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
      const triggerNodeAppendText = faker.lorem.word(4);
      const updateNodeAppendText = faker.lorem.word(4);
      //用例标题
      const caseTitle =
        'Collection event add data trigger, update item by item, filter dropdown radio fields not null, common table dropdown radio fields data, set dropdown radio fields constant data';

      // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
      //创建数据表
      const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
      const e2eJsonCollectionName = 'tt_amt_org';
      //创建触发器节点数据表
      const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
      const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
      const triggerNodeFieldName = 'range_multipleselect';
      const triggerNodeFieldDisplayName = '经营范围(下拉多选)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

      // 创建更新节点数据表
      const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
      const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
      const updateNodeFieldName = 'range_multipleselect';
      const updateNodeFieldDisplayName = '经营范围(下拉多选)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
      // 定义随机4位数小数的数值
      // const updateNodeCollectionRecordOne = faker.datatype.float({ min: 0, max: 10000, precision: 4 });
      const updateNodeCollectionRecordOne = ['F3134','I3006'];
      const updateNodeCollectionRecordTwo = ['F3134','I3007'];
      const updateNodeCollectionRecordThree = ['I3006','I3007'];
      const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ range_multipleselect: updateNodeCollectionRecordOne }, { range_multipleselect: updateNodeCollectionRecordTwo }, { range_multipleselect: updateNodeCollectionRecordThree }]);

      //配置工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      const workflowManagement = new WorkflowManagement(page);
      await workflowManagement.addNewButton.click();
      const createWorkFlow = new CreateWorkFlow(page);
      const workFlowName = caseTitle + triggerNodeAppendText;
      await createWorkFlow.name.fill(workFlowName);
      await createWorkFlow.triggerType.click();
      await page.getByTitle('Collection event').getByText('Collection event').click();
      await createWorkFlow.submitButton.click();
      await expect(page.getByText(workFlowName)).toBeVisible();

      //配置工作流触发器
      const workflowListRecords = new WorkflowListRecords(page, workFlowName);
      await workflowListRecords.configureAction.click();
      const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
      await collectionTriggerNode.nodeConfigure.click();
      await collectionTriggerNode.collectionDropDown.click();
      await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
      await collectionTriggerNode.triggerOnDropdown.click();
      await page.getByText('After record added', { exact: true }).click();
      await collectionTriggerNode.submitButton.click();

      //配置更新数据节点
      await collectionTriggerNode.addNodeButton.click();
      await page.getByRole('button', { name: 'update', exact: true }).click();
      const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page
        .getByLabel('Update record-Update record', { exact: true })
        .getByRole('textbox')
        .fill(updateRecordNodeName);
      const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
      await updateRecordNode.nodeConfigure.click();
      await updateRecordNode.collectionDropDown.click();
      await page.getByText(updateNodeCollectionDisplayName).click();
      await updateRecordNode.articleByArticleUpdateModeRadio.click();
      // 设置过滤条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('filter-select-field').click();
      await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
      await page.getByTestId('filter-select-operator').click();
      await page.getByRole('option', { name: 'is not empty' }).click();

      // 设置字段
      await updateRecordNode.addFieldsButton.click();
      await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
      // const createRecordNodefieldData = faker.number.int();
      await page.getByTestId('select-multiple').getByLabel('Search').click();
      await page.getByRole('option', { name: '数据处理服务', exact: true }).click();
      await page.getByRole('option', { name: '计算机系统服务', exact: true }).click();
      await updateRecordNode.submitButton.click();

      await page.getByRole('link', { name: 'Workflow' }).click();
      await workflowListRecords.editAction.click();
      const editWorkFlow = new EditWorkFlow(page, workFlowName);
      await editWorkFlow.statusIsOn.check();
      await editWorkFlow.submitButton.click();

      // 配置更新数据节点的数据表页面，查看更新前数据
      const updateNodeCollectionPage = mockPage();
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
      await page.mouse.move(300, 0);
      await page.getByText('Configure columns').hover();
      await page.getByText(updateNodeFieldDisplayName).click();
      await page.mouse.move(300, 0);
      await expect(page.getByRole('button', { name: '软件销售 软件开发' })).toBeVisible();
      await expect(page.getByRole('button', { name: '软件销售 人工智能基础软件开发' })).toBeVisible();
      await expect(page.getByRole('button', { name: '软件开发 人工智能基础软件开发' })).toBeVisible();
      await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' })).not.toBeVisible();

      //配置新增数据触发工作流页面
      const addDataTriggerWorkflowPage = mockPage();
      await addDataTriggerWorkflowPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page.getByText('Configure columns').hover();
      await page.getByText(triggerNodeFieldDisplayName).click();
      await page.getByText('Configure actions').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
      await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

      await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
      await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: 'form Form' }).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

      await page.mouse.move(300, 0);

      // 2、测试步骤：录入数据触发工作流
      // const addDataTriggerWorkflowPagefieldData = '注销';
      await page.getByTestId('select-multiple').click();
      await page.getByRole('option', { name: '数据处理服务', exact: true }).click();
      await page.getByRole('option', { name: '计算机系统服务', exact: true }).click();
      await page.getByTestId('select-multiple').click();
      await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
      await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' })).toBeVisible();
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await expect(workflowListRecords.executionCountPopup).toHaveText('1');
      // 配置更新数据节点的数据表页面，查看更新后数据
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('button', { name: '软件销售 软件开发' })).not.toBeVisible();
      await expect(page.getByRole('button', { name: '软件销售 人工智能基础软件开发' })).not.toBeVisible();
      await expect(page.getByRole('button', { name: '软件开发 人工智能基础软件开发' })).not.toBeVisible();
      await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' }).nth(1)).toBeVisible();
      await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' }).nth(2)).toBeVisible();

      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.executionCountPopup.click();
      await page.getByText('View').click();
      await page.waitForLoadState('networkidle');
      await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
      await page.waitForLoadState('networkidle');
      //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
      const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
      const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
      // 判断字符串包含createRecordNodefieldData
      expect(nodeResultString).toContain('3');
      await page.getByLabel('Close', { exact: true }).click();

      // 4、后置处理：删除工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.deleteAction.click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, update item by item, filter dropdown radio fields not empty, common table dropdown radio fields data, set trigger node dropdown radio fields variable', async ({
      page,
      mockCollections,
      mockRecords,
      mockPage,
    }) => {
      //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
      const triggerNodeAppendText = faker.lorem.word(4);
      const updateNodeAppendText = faker.lorem.word(4);
      //用例标题
      const caseTitle =
        'Collection event add data trigger, update item by item, filter dropdown radio fields not empty, common table dropdown radio fields data, set trigger node dropdown radio fields variable';

      // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
      //创建数据表
      const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
      const e2eJsonCollectionName = 'tt_amt_org';
      //创建触发器节点数据表
      const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
      const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
      const triggerNodeFieldName = 'range_multipleselect';
      const triggerNodeFieldDisplayName = '经营范围(下拉多选)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

      // 创建更新节点数据表
      const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
      const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
      const updateNodeFieldName = 'range_multipleselect';
      const updateNodeFieldDisplayName = '经营范围(下拉多选)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
      const updateNodeCollectionRecordOne = ['F3134','I3006'];
      const updateNodeCollectionRecordTwo = ['F3134','I3007'];
      const updateNodeCollectionRecordThree = ['I3006','I3007'];
      const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ range_multipleselect: updateNodeCollectionRecordOne }, { range_multipleselect: updateNodeCollectionRecordTwo }, { range_multipleselect: updateNodeCollectionRecordThree }]);

      //配置工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      const workflowManagement = new WorkflowManagement(page);
      await workflowManagement.addNewButton.click();
      const createWorkFlow = new CreateWorkFlow(page);
      const workFlowName = caseTitle + triggerNodeAppendText;
      await createWorkFlow.name.fill(workFlowName);
      await createWorkFlow.triggerType.click();
      await page.getByTitle('Collection event').getByText('Collection event').click();
      await createWorkFlow.submitButton.click();
      await expect(page.getByText(workFlowName)).toBeVisible();

      //配置工作流触发器
      const workflowListRecords = new WorkflowListRecords(page, workFlowName);
      await workflowListRecords.configureAction.click();
      const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
      await collectionTriggerNode.nodeConfigure.click();
      await collectionTriggerNode.collectionDropDown.click();
      await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
      await collectionTriggerNode.triggerOnDropdown.click();
      await page.getByText('After record added', { exact: true }).click();
      await collectionTriggerNode.submitButton.click();

      //配置更新数据节点
      await collectionTriggerNode.addNodeButton.click();
      await page.getByRole('button', { name: 'update', exact: true }).click();
      const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page
        .getByLabel('Update record-Update record', { exact: true })
        .getByRole('textbox')
        .fill(updateRecordNodeName);
      const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
      await updateRecordNode.nodeConfigure.click();
      await updateRecordNode.collectionDropDown.click();
      await page.getByText(updateNodeCollectionDisplayName).click();
      await updateRecordNode.articleByArticleUpdateModeRadio.click();
      // 设置过滤条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('filter-select-field').click();
      await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
      await page.getByTestId('filter-select-operator').click();
      await page.getByRole('option', { name: 'is not empty' }).click();

      // 设置字段
      await updateRecordNode.addFieldsButton.click();
      await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
      await page.getByLabel('variable-button').click();
      await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
      await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
      await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
      await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
      await updateRecordNode.submitButton.click();
      await page.getByRole('link', { name: 'Workflow' }).click();
      await workflowListRecords.editAction.click();
      const editWorkFlow = new EditWorkFlow(page, workFlowName);
      await editWorkFlow.statusIsOn.check();
      await editWorkFlow.submitButton.click();

      // 配置更新数据节点的数据表页面，查看更新前数据
      const updateNodeCollectionPage = mockPage();
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
      await page.mouse.move(300, 0);
      await page.getByText('Configure columns').hover();
      await page.getByText(updateNodeFieldDisplayName).click();
      await page.mouse.move(300, 0);
      // const updayteRecordNodefieldData = '注销';
      await expect(page.getByRole('button', { name: '软件销售 软件开发' })).toBeVisible();
      await expect(page.getByRole('button', { name: '软件销售 人工智能基础软件开发' })).toBeVisible();
      await expect(page.getByRole('button', { name: '软件开发 人工智能基础软件开发' })).toBeVisible();
      await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' })).not.toBeVisible();

      //配置新增数据触发工作流页面
      const addDataTriggerWorkflowPage = mockPage();
      await addDataTriggerWorkflowPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page.getByText('Configure columns').hover();
      await page.getByText(triggerNodeFieldDisplayName).click();
      await page.getByText('Configure actions').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
      await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

      await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
      await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: 'form Form' }).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

      await page.mouse.move(300, 0);

          // 2、测试步骤：录入数据触发工作流
      // const addDataTriggerWorkflowPagefieldData = '注销';
      await page.getByTestId('select-multiple').click();
      await page.getByRole('option', { name: '数据处理服务', exact: true }).click();
      await page.getByRole('option', { name: '计算机系统服务', exact: true }).click();
      await page.getByTestId('select-multiple').click();
      await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
      await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' })).toBeVisible();
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await expect(workflowListRecords.executionCountPopup).toHaveText('1');
      // 配置更新数据节点的数据表页面，查看更新后数据
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('button', { name: '软件销售 软件开发' })).not.toBeVisible();
      await expect(page.getByRole('button', { name: '软件销售 人工智能基础软件开发' })).not.toBeVisible();
      await expect(page.getByRole('button', { name: '软件开发 人工智能基础软件开发' })).not.toBeVisible();
      await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' }).nth(1)).toBeVisible();
      await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' }).nth(2)).toBeVisible();

      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.executionCountPopup.click();
      await page.getByText('View').click();
      await page.waitForLoadState('networkidle');
      await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
      await page.waitForLoadState('networkidle');
      //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
      const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
      const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
      // 判断字符串包含createRecordNodefieldData
      expect(nodeResultString).toContain('3');
      await page.getByLabel('Close', { exact: true }).click();

      // 4、后置处理：删除工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.deleteAction.click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, update item by item, filter date field not null, common table date field data, set date field constant data', async ({
      page,
      mockCollections,
      mockRecords,
      mockPage,
    }) => {
      //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
      const triggerNodeAppendText = faker.lorem.word(4);
      const updateNodeAppendText = faker.lorem.word(4);
      //用例标题
      const caseTitle =
        'Collection event add data trigger, update item by item, filter dropdown radio fields not null, common table dropdown radio fields data, set dropdown radio fields constant data';

      // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
      //创建数据表
      const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
      const e2eJsonCollectionName = 'tt_amt_org';
      //创建触发器节点数据表
      const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
      const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
      const triggerNodeFieldName = 'establishdate';
      const triggerNodeFieldDisplayName = '成立日期(日期)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

      // 创建更新节点数据表
      const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
      const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
      const updateNodeFieldName = 'establishdate';
      const updateNodeFieldDisplayName = '成立日期(日期)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
      // 定义随机4位数小数的数值
      // const updateNodeCollectionRecordOne = faker.datatype.float({ min: 0, max: 10000, precision: 4 });
      const updateNodeCollectionRecordOne = dayjs().add(-3,'day').format('YYYY-MM-DD');
      const updateNodeCollectionRecordTwo = dayjs().add(-2,'day').format('YYYY-MM-DD');
      const updateNodeCollectionRecordThree = dayjs().add(-1,'day').format('YYYY-MM-DD');
      const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ establishdate: updateNodeCollectionRecordOne }, { establishdate: updateNodeCollectionRecordTwo }, { establishdate: updateNodeCollectionRecordThree }]);

      //配置工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      const workflowManagement = new WorkflowManagement(page);
      await workflowManagement.addNewButton.click();
      const createWorkFlow = new CreateWorkFlow(page);
      const workFlowName = caseTitle + triggerNodeAppendText;
      await createWorkFlow.name.fill(workFlowName);
      await createWorkFlow.triggerType.click();
      await page.getByTitle('Collection event').getByText('Collection event').click();
      await createWorkFlow.submitButton.click();
      await expect(page.getByText(workFlowName)).toBeVisible();

      //配置工作流触发器
      const workflowListRecords = new WorkflowListRecords(page, workFlowName);
      await workflowListRecords.configureAction.click();
      const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
      await collectionTriggerNode.nodeConfigure.click();
      await collectionTriggerNode.collectionDropDown.click();
      await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
      await collectionTriggerNode.triggerOnDropdown.click();
      await page.getByText('After record added', { exact: true }).click();
      await collectionTriggerNode.submitButton.click();

      //配置更新数据节点
      await collectionTriggerNode.addNodeButton.click();
      await page.getByRole('button', { name: 'update', exact: true }).click();
      const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page
        .getByLabel('Update record-Update record', { exact: true })
        .getByRole('textbox')
        .fill(updateRecordNodeName);
      const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
      await updateRecordNode.nodeConfigure.click();
      await updateRecordNode.collectionDropDown.click();
      await page.getByText(updateNodeCollectionDisplayName).click();
      await updateRecordNode.articleByArticleUpdateModeRadio.click();
      // 设置过滤条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('filter-select-field').click();
      await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
      await page.getByTestId('filter-select-operator').click();
      await page.getByRole('option', { name: 'is not empty' }).click();

      // 设置字段
      await updateRecordNode.addFieldsButton.click();
      await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
      const updateRecordNodefieldData = dayjs().format('YYYY-MM-DD');
      await page.getByLabel('block-item-CollectionFieldset').getByPlaceholder('Select date').click();
      await page.getByLabel('block-item-CollectionFieldset').getByPlaceholder('Select date').fill(updateRecordNodefieldData);
      await page.getByTitle(updateRecordNodefieldData.toString()).locator('div').click();
      await updateRecordNode.submitButton.click();

      await page.getByRole('link', { name: 'Workflow' }).click();
      await workflowListRecords.editAction.click();
      const editWorkFlow = new EditWorkFlow(page, workFlowName);
      await editWorkFlow.statusIsOn.check();
      await editWorkFlow.submitButton.click();

      // 配置更新数据节点的数据表页面，查看更新前数据
      const updateNodeCollectionPage = mockPage();
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
      await page.mouse.move(300, 0);
      await page.getByText('Configure columns').hover();
      await page.getByText(updateNodeFieldDisplayName).click();
      await page.mouse.move(300, 0);
      const updayteRecordNodefieldData = dayjs().format('YYYY-MM-DD');
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

      //配置新增数据触发工作流页面
      const addDataTriggerWorkflowPage = mockPage();
      await addDataTriggerWorkflowPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page.getByText('Configure columns').hover();
      await page.getByText(triggerNodeFieldDisplayName).click();
      await page.getByText('Configure actions').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
      await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

      await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
      await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: 'form Form' }).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

      await page.mouse.move(300, 0);

      // 2、测试步骤：录入数据触发工作流
      const addDataTriggerWorkflowPagefieldData = dayjs().format('YYYY-MM-DD');
      await page.getByPlaceholder('Select date').click();
      await page.getByTitle(addDataTriggerWorkflowPagefieldData.toString()).click();
      await page.mouse.move(300, 0, { steps: 100 });
      await page.mouse.click(300, 0);
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
      await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await expect(workflowListRecords.executionCountPopup).toHaveText('1');
      // 配置更新数据节点的数据表页面，查看更新后数据
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.executionCountPopup.click();
      await page.getByText('View').click();
      await page.waitForLoadState('networkidle');
      await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
      await page.waitForLoadState('networkidle');
      //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
      const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
      const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
      // 判断字符串包含createRecordNodefieldData
      expect(nodeResultString).toContain('3');
      await page.getByLabel('Close', { exact: true }).click();

      // 4、后置处理：删除工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.deleteAction.click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, update item by item, filter date field not empty, common table date field data, set trigger node date field variable', async ({
      page,
      mockCollections,
      mockRecords,
      mockPage,
    }) => {
      //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
      const triggerNodeAppendText = faker.lorem.word(4);
      const updateNodeAppendText = faker.lorem.word(4);
      //用例标题
      const caseTitle =
        'Collection event add data trigger, update item by item, filter dropdown radio fields not empty, common table dropdown radio fields data, set trigger node dropdown radio fields variable';

      // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
      //创建数据表
      const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
      const e2eJsonCollectionName = 'tt_amt_org';
      //创建触发器节点数据表
      const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
      const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
      const triggerNodeFieldName = 'establishdate';
      const triggerNodeFieldDisplayName = '成立日期(日期)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

      // 创建更新节点数据表
      const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
      const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
      const updateNodeFieldName = 'establishdate';
      const updateNodeFieldDisplayName = '成立日期(日期)';
      await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
      const updateNodeCollectionRecordOne = dayjs().add(-3,'day').format('YYYY-MM-DD');
      const updateNodeCollectionRecordTwo = dayjs().add(-2,'day').format('YYYY-MM-DD');
      const updateNodeCollectionRecordThree = dayjs().add(-1,'day').format('YYYY-MM-DD');
      const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ establishdate: updateNodeCollectionRecordOne }, { establishdate: updateNodeCollectionRecordTwo }, { establishdate: updateNodeCollectionRecordThree }]);

      //配置工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      const workflowManagement = new WorkflowManagement(page);
      await workflowManagement.addNewButton.click();
      const createWorkFlow = new CreateWorkFlow(page);
      const workFlowName = caseTitle + triggerNodeAppendText;
      await createWorkFlow.name.fill(workFlowName);
      await createWorkFlow.triggerType.click();
      await page.getByTitle('Collection event').getByText('Collection event').click();
      await createWorkFlow.submitButton.click();
      await expect(page.getByText(workFlowName)).toBeVisible();

      //配置工作流触发器
      const workflowListRecords = new WorkflowListRecords(page, workFlowName);
      await workflowListRecords.configureAction.click();
      const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
      await collectionTriggerNode.nodeConfigure.click();
      await collectionTriggerNode.collectionDropDown.click();
      await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
      await collectionTriggerNode.triggerOnDropdown.click();
      await page.getByText('After record added', { exact: true }).click();
      await collectionTriggerNode.submitButton.click();

      //配置更新数据节点
      await collectionTriggerNode.addNodeButton.click();
      await page.getByRole('button', { name: 'update', exact: true }).click();
      const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
      await page
        .getByLabel('Update record-Update record', { exact: true })
        .getByRole('textbox')
        .fill(updateRecordNodeName);
      const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
      await updateRecordNode.nodeConfigure.click();
      await updateRecordNode.collectionDropDown.click();
      await page.getByText(updateNodeCollectionDisplayName).click();
      await updateRecordNode.articleByArticleUpdateModeRadio.click();
      // 设置过滤条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('filter-select-field').click();
      await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
      await page.getByTestId('filter-select-operator').click();
      await page.getByRole('option', { name: 'is not empty' }).click();

      // 设置字段
      await updateRecordNode.addFieldsButton.click();
      await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
      await page.getByLabel('variable-button').click();
      await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
      await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
      await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
      await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
      await updateRecordNode.submitButton.click();
      await page.getByRole('link', { name: 'Workflow' }).click();
      await workflowListRecords.editAction.click();
      const editWorkFlow = new EditWorkFlow(page, workFlowName);
      await editWorkFlow.statusIsOn.check();
      await editWorkFlow.submitButton.click();

      // 配置更新数据节点的数据表页面，查看更新前数据
      const updateNodeCollectionPage = mockPage();
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
      await page.mouse.move(300, 0);
      await page.getByText('Configure columns').hover();
      await page.getByText(updateNodeFieldDisplayName).click();
      await page.mouse.move(300, 0);
      const updayteRecordNodefieldData = dayjs().format('YYYY-MM-DD');
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

      //配置新增数据触发工作流页面
      const addDataTriggerWorkflowPage = mockPage();
      await addDataTriggerWorkflowPage.goto();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
      await page.getByRole('menuitem', { name: 'table Table' }).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page.getByText('Configure columns').hover();
      await page.getByText(triggerNodeFieldDisplayName).click();
      await page.getByText('Configure actions').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
      await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

      await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
      await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: 'form Form' }).click();

      // 移开鼠标，关闭菜单
      await page.mouse.move(300, 0);

      await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
      await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

      await page.mouse.move(300, 0);

          // 2、测试步骤：录入数据触发工作流
      const addDataTriggerWorkflowPagefieldData = updayteRecordNodefieldData;
      await page.getByPlaceholder('Select date').click();
      await page.getByTitle(addDataTriggerWorkflowPagefieldData.toString()).click();
      await page.mouse.move(300, 0, { steps: 100 });
      await page.mouse.click(300, 0);
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
      await page.waitForLoadState('networkidle');

      // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
      await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await expect(workflowListRecords.executionCountPopup).toHaveText('1');
      // 配置更新数据节点的数据表页面，查看更新后数据
      await updateNodeCollectionPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
      await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
      await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.executionCountPopup.click();
      await page.getByText('View').click();
      await page.waitForLoadState('networkidle');
      await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
      await page.waitForLoadState('networkidle');
      //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
      const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
      const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
      // 判断字符串包含createRecordNodefieldData
      expect(nodeResultString).toContain('3');
      await page.getByLabel('Close', { exact: true }).click();

      // 4、后置处理：删除工作流
      await page.goto('/admin/settings/workflow');
      await page.waitForLoadState('networkidle');
      await workflowListRecords.deleteAction.click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(workFlowName)).toBeHidden();
    });
  });
