import { CreateWorkFlow, EditWorkFlow, WorkflowManagement, WorkflowListRecords } from '@nocobase/plugin-workflow-test';
import { e2e_GeneralFormsTable, appendJsonCollectionName } from '@nocobase/plugin-workflow-test';
import { CollectionTriggerNode, ConditionYesNode, QueryRecordNode } from '@nocobase/plugin-workflow-test';
import { ClculationNode, ConditionBranchNode } from '@nocobase/plugin-workflow-test';
import { expect, test } from '@nocobase/test/client';
import { dayjs } from '@nocobase/utils';
import { faker } from '@faker-js/faker';

test.describe('Continue when "Yes"', () => {
    test('Collection event add data trigger, basic type, determines that the trigger node single line text field variable is equal to an equal constant, passes.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event add data trigger, basic type, determines that the trigger node single line text field variable is equal to an equal constant, passes.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'orgname';
        const triggerNodeFieldDisplayName = '公司名称(单行文本)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置判断节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('rejectOnFalse').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionYesNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByLabel('variable-button').first().click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByText('公司名称(单行文本)').click();
        await expect(page.getByLabel('variable-tag')).toHaveText('Trigger variables / Trigger data / 公司名称(单行文本)');
        const conditionalRightConstant = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('variable-constant').fill(conditionalRightConstant);
        await conditionNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = conditionalRightConstant;
        await page.getByRole('textbox').fill(fieldData);
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');

        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(fieldData)).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('true');

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, basic type, determines that the trigger node single line text field variable is equal to an unequal constant, fails.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event add data trigger, basic type, determines that the trigger node single line text field variable is equal to an unequal constant, fails.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'orgname';
        const triggerNodeFieldDisplayName = '公司名称(单行文本)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置判断节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('rejectOnFalse').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionYesNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByLabel('variable-button').first().click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByText('公司名称(单行文本)').click();
        await expect(page.getByLabel('variable-tag')).toHaveText('Trigger variables / Trigger data / 公司名称(单行文本)');
        const conditionalRightConstant = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('variable-constant').fill(conditionalRightConstant);
        await conditionNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = conditionalRightConstant + '1';
        await page.getByRole('textbox').fill(fieldData);
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');

        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(fieldData)).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'exclamation' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('false');

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event Add Data Trigger, basic type, determines that the trigger node single line text field variable is not equal to an equal constant, fails.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event Add Data Trigger, basic type, determines that the trigger node single line text field variable is not equal to an equal constant, fails.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'orgname';
        const triggerNodeFieldDisplayName = '公司名称(单行文本)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置判断节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('rejectOnFalse').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionYesNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByLabel('variable-button').first().click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByText('公司名称(单行文本)').click();
        await expect(page.getByLabel('variable-tag')).toHaveText('Trigger variables / Trigger data / 公司名称(单行文本)');
        await page.getByLabel('select-operator-calc').first().click();
        await page.getByRole('option', { name: '≠' }).click();
        const conditionalRightConstant = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('variable-constant').fill(conditionalRightConstant);
        await conditionNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = conditionalRightConstant;
        await page.getByRole('textbox').fill(fieldData);
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');

        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(fieldData)).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'exclamation' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('false');

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, basic type, determines that the trigger node single line text field variable is not equal to an unequal constant, passes.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event add data trigger, basic type, determines that the trigger node single line text field variable is not equal to an unequal constant, passes.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'orgname';
        const triggerNodeFieldDisplayName = '公司名称(单行文本)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置判断节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('rejectOnFalse').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionYesNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByLabel('variable-button').first().click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByText('公司名称(单行文本)').click();
        await expect(page.getByLabel('variable-tag')).toHaveText('Trigger variables / Trigger data / 公司名称(单行文本)');
        await page.getByLabel('select-operator-calc').first().click();
        await page.getByRole('option', { name: '≠' }).click();
        const conditionalRightConstant = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('variable-constant').fill(conditionalRightConstant);
        await conditionNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = conditionalRightConstant + '1';
        await page.getByRole('textbox').fill(fieldData);
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');

        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(fieldData)).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('true');

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, basic type, determine trigger node integer variable equal to query node equal integer variable, pass.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event add data trigger, basic type, determine trigger node integer variable equal to query node equal integer variable, pass.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'staffnum';
        const triggerNodeFieldDisplayName = '员工人数(整数)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置前置查询节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'query', exact: true }).click();
        const preQueryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Query record-Query record', { exact: true })
            .getByRole('textbox')
            .fill(preQueryRecordNodeName);
        const preQueryRecordNode = new QueryRecordNode(page, preQueryRecordNodeName);
        await preQueryRecordNode.nodeConfigure.click();
        await preQueryRecordNode.collectionDropDown.click();
        await page.getByText(triggerNodeCollectionDisplayName).click();
        // 设置过滤条件
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByTestId('filter-select-field').getByLabel('Search').click();
        await page.getByText('ID', { exact: true }).click();
        await page.getByLabel('block-item-Filter-workflows-').getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
        await preQueryRecordNode.submitButton.click();

        //配置判断节点
        await preQueryRecordNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('rejectOnFalse').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionYesNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByLabel('variable-button').first().click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await expect(page.getByLabel('variable-tag')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`,
        );
        await page.getByLabel('variable-button').nth(1).click();
        await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
        await page.getByRole('menuitemcheckbox', { name: preQueryRecordNodeName }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await expect(page.getByLabel('variable-tag').nth(1)).toHaveText(
            `Node result / ${preQueryRecordNodeName} / ${triggerNodeFieldDisplayName}`,
        );
        await conditionNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = faker.number.int();
        await page.getByRole('spinbutton').fill(fieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');

        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(fieldData.toString())).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('true');

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, basic type, determine trigger node integer variable is equal to query node not equal integer variable, not pass.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event add data trigger, basic type, determine trigger node integer variable is equal to query node not equal integer variable, not pass.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'staffnum';
        const triggerNodeFieldDisplayName = '员工人数(整数)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        // 过滤条件
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByTestId('filter-select-field').getByLabel('Search').click();
        await page.getByText('ID').click();
        await page.getByRole('spinbutton').click();
        await page.getByRole('spinbutton').fill('2');
        await collectionTriggerNode.submitButton.click();

        //配置前置查询节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'query', exact: true }).click();
        const preQueryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Query record-Query record', { exact: true })
            .getByRole('textbox')
            .fill(preQueryRecordNodeName);
        const preQueryRecordNode = new QueryRecordNode(page, preQueryRecordNodeName);
        await preQueryRecordNode.nodeConfigure.click();
        await preQueryRecordNode.collectionDropDown.click();
        await page.getByText(triggerNodeCollectionDisplayName).click();
        // 设置过滤条件
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByTestId('filter-select-field').getByLabel('Search').click();
        await page.getByText('ID', { exact: true }).click();
        await page.getByTestId('filter-select-operator').click();
        await page.getByRole('option', { name: 'is not' }).click();
        await page.getByLabel('block-item-Filter-workflows-').getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables right' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data right' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
        await preQueryRecordNode.submitButton.click();

        //配置判断节点
        await preQueryRecordNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('rejectOnFalse').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionYesNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByLabel('variable-button').first().click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await expect(page.getByLabel('variable-tag')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`,
        );
        await page.getByLabel('variable-button').nth(1).click();
        await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
        await page.getByRole('menuitemcheckbox', { name: preQueryRecordNodeName }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await expect(page.getByLabel('variable-tag').nth(1)).toHaveText(
            `Node result / ${preQueryRecordNodeName} / ${triggerNodeFieldDisplayName}`,
        );
        await conditionNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const IDisOneFieldData = faker.number.int();
        await page.getByRole('spinbutton').fill(IDisOneFieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');
        await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
        const IDisTwoFieldData = faker.number.int();
        await page.getByRole('spinbutton').fill(IDisTwoFieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');
        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(IDisOneFieldData.toString())).toBeVisible();
        await expect(page.getByText(IDisTwoFieldData.toString())).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'exclamation' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('false');

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, basic type, determine trigger node integer variable is not equal to query node equal integer variable, not pass.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event add data trigger, basic type, determine trigger node integer variable is not equal to query node equal integer variable, not pass.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'staffnum';
        const triggerNodeFieldDisplayName = '员工人数(整数)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();
        //配置前置查询节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'query', exact: true }).click();
        const preQueryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Query record-Query record', { exact: true })
            .getByRole('textbox')
            .fill(preQueryRecordNodeName);
        const preQueryRecordNode = new QueryRecordNode(page, preQueryRecordNodeName);
        await preQueryRecordNode.nodeConfigure.click();
        await preQueryRecordNode.collectionDropDown.click();
        await page.getByText(triggerNodeCollectionDisplayName).click();
        // 设置过滤条件
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByTestId('filter-select-field').getByLabel('Search').click();
        await page.getByText('ID', { exact: true }).click();
        await page.getByLabel('block-item-Filter-workflows-').getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables right' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data right' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
        await preQueryRecordNode.submitButton.click();

        //配置判断节点
        await preQueryRecordNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('rejectOnFalse').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionYesNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByLabel('variable-button').first().click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await expect(page.getByLabel('variable-tag')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`,
        );
        await page.getByLabel('select-operator-calc').first().click();
        await page.getByRole('option', { name: '≠' }).click();
        await page.getByLabel('variable-button').nth(1).click();
        await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
        await page.getByRole('menuitemcheckbox', { name: preQueryRecordNodeName }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await expect(page.getByLabel('variable-tag').nth(1)).toHaveText(
            `Node result / ${preQueryRecordNodeName} / ${triggerNodeFieldDisplayName}`,
        );
        await conditionNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const IDisOneFieldData = faker.number.int();
        await page.getByRole('spinbutton').fill(IDisOneFieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');
        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(IDisOneFieldData.toString())).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'exclamation' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('false');

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, basic type, determine trigger node integer variable is not equal to query node not equal integer variable, pass.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event add data trigger, basic type, determine trigger node integer variable is not equal to query node not equal integer variable, pass.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'staffnum';
        const triggerNodeFieldDisplayName = '员工人数(整数)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        // 过滤条件
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByTestId('filter-select-field').getByLabel('Search').click();
        await page.getByText('ID').click();
        await page.getByRole('spinbutton').click();
        await page.getByRole('spinbutton').fill('2');
        await collectionTriggerNode.submitButton.click();
        //配置前置查询节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'query', exact: true }).click();
        const preQueryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Query record-Query record', { exact: true })
            .getByRole('textbox')
            .fill(preQueryRecordNodeName);
        const preQueryRecordNode = new QueryRecordNode(page, preQueryRecordNodeName);
        await preQueryRecordNode.nodeConfigure.click();
        await preQueryRecordNode.collectionDropDown.click();
        await page.getByText(triggerNodeCollectionDisplayName).click();
        // 设置过滤条件
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByTestId('filter-select-field').getByLabel('Search').click();
        await page.getByText('ID', { exact: true }).click();
        await page.getByTestId('filter-select-operator').click();
        await page.getByRole('option', { name: 'is not' }).click();
        await page.getByLabel('block-item-Filter-workflows-').getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables right' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data right' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
        await preQueryRecordNode.submitButton.click();

        //配置判断节点
        await preQueryRecordNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('rejectOnFalse').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionYesNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByLabel('variable-button').first().click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await expect(page.getByLabel('variable-tag')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`,
        );
        await page.getByLabel('select-operator-calc').first().click();
        await page.getByRole('option', { name: '≠' }).click();
        await page.getByLabel('variable-button').nth(1).click();
        await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
        await page.getByRole('menuitemcheckbox', { name: preQueryRecordNodeName }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await expect(page.getByLabel('variable-tag').nth(1)).toHaveText(
            `Node result / ${preQueryRecordNodeName} / ${triggerNodeFieldDisplayName}`,
        );
        await conditionNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const IDisOneFieldData = faker.number.int();
        await page.getByRole('spinbutton').fill(IDisOneFieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');
        await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
        const IDisTwoFieldData = faker.number.int();
        await page.getByRole('spinbutton').fill(IDisTwoFieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');
        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(IDisOneFieldData.toString())).toBeVisible();
        await expect(page.getByText(IDisTwoFieldData.toString())).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('true');

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, Math engine, determine trigger node integer field variable is equal to an equal constant, pass.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event add data trigger, Math engine, determine trigger node integer field variable is equal to an equal constant, pass.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'staffnum';
        const triggerNodeFieldDisplayName = '员工人数(整数)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置判断节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('rejectOnFalse').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionYesNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await conditionNode.mathRadio.click();
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await page.getByLabel('textbox').focus();
        const conditionalRightConstant = faker.number.int();
        await page.keyboard.type(`==${conditionalRightConstant}`);
        await expect(page.getByLabel('textbox')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}==${conditionalRightConstant}`,
        );
        await conditionNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = conditionalRightConstant;
        await page.getByRole('spinbutton').fill(fieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');

        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(`${fieldData}`)).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('true');

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event Add Data Trigger, Math engine, determines that the trigger node integer field variable is equal to an unequal constant, fails.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event Add Data Trigger, Math engine, determines that the trigger node integer field variable is equal to an unequal constant, fails.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'staffnum';
        const triggerNodeFieldDisplayName = '员工人数(整数)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置判断节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('rejectOnFalse').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionYesNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await conditionNode.mathRadio.click();
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await page.getByLabel('textbox').focus();
        const conditionalRightConstant = faker.number.int();
        await page.keyboard.type(`==${conditionalRightConstant}`);
        await expect(page.getByLabel('textbox')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}==${conditionalRightConstant}`,
        );
        await conditionNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = faker.number.int();
        await page.getByRole('spinbutton').fill(fieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');

        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(`${fieldData}`)).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'exclamation' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('false');

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event Add Data Trigger, Math engine, determines that the trigger node integer field variable is not equal to an equal constant, fails.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event Add Data Trigger, Math engine, determines that the trigger node integer field variable is not equal to an equal constant, fails.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'staffnum';
        const triggerNodeFieldDisplayName = '员工人数(整数)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置判断节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('rejectOnFalse').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionYesNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await conditionNode.mathRadio.click();
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await page.getByLabel('textbox').focus();
        const conditionalRightConstant = faker.number.int();
        await page.keyboard.type(`!=${conditionalRightConstant}`);
        await expect(page.getByLabel('textbox')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}!=${conditionalRightConstant}`,
        );
        await conditionNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = conditionalRightConstant;
        await page.getByRole('spinbutton').fill(fieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');

        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(fieldData.toString())).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'exclamation' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('false');

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, Math engine, determines that the trigger node integer field variable is not equal to an unequal constant, passes.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event add data trigger, Math engine, determines that the trigger node integer field variable is not equal to an unequal constant, passes.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'staffnum';
        const triggerNodeFieldDisplayName = '员工人数(整数)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置判断节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('rejectOnFalse').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionYesNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await conditionNode.mathRadio.click();
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await page.getByLabel('textbox').focus();
        const conditionalRightConstant = faker.number.int();
        await page.keyboard.type(`!=${conditionalRightConstant}`);
        await expect(page.getByLabel('textbox')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}!=${conditionalRightConstant}`,
        );
        await conditionNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = faker.number.int();
        await page.getByRole('spinbutton').fill(fieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');

        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(fieldData.toString())).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('true');

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event Add Data Trigger, Formula engine, determines that the trigger node single line text field variable is equal to an equal constant, passes.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event Add Data Trigger, Formula engine, determines that the trigger node single line text field variable is equal to an equal constant, passes.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'orgname';
        const triggerNodeFieldDisplayName = '公司名称(单行文本)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置判断节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('rejectOnFalse').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionYesNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await conditionNode.formulaRadio.click();
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await page.getByLabel('textbox').focus();
        const conditionalRightConstant = faker.lorem.words();
        await page.keyboard.type(`=='${conditionalRightConstant}'`);
        await expect(page.getByLabel('textbox')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}=='${conditionalRightConstant}'`,
        );
        await conditionNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = conditionalRightConstant;
        await page.getByRole('textbox').fill(fieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');

        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(fieldData.toString())).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('true');

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event Add Data Trigger, Formula engine, determines that the trigger node single line text field variable is equal to an unequal constant, fails.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event Add Data Trigger, Formula engine, determines that the trigger node single line text field variable is equal to an unequal constant, fails.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'orgname';
        const triggerNodeFieldDisplayName = '公司名称(单行文本)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置判断节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('rejectOnFalse').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionYesNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await conditionNode.formulaRadio.click();
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await page.getByLabel('textbox').focus();
        const conditionalRightConstant = faker.lorem.words();
        await page.keyboard.type(`=='${conditionalRightConstant}'`);
        await expect(page.getByLabel('textbox')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}=='${conditionalRightConstant}'`,
        );
        await conditionNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = faker.lorem.words();
        await page.getByRole('textbox').fill(fieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');

        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(fieldData.toString())).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'exclamation' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('false');

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event Add Data Trigger, Formula engine, determines that the trigger node single line text field variable is not equal to an equal constant, fails.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event Add Data Trigger, Formula engine, determines that the trigger node single line text field variable is not equal to an equal constant, fails.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'orgname';
        const triggerNodeFieldDisplayName = '公司名称(单行文本)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置判断节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('rejectOnFalse').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionYesNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await conditionNode.formulaRadio.click();
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await page.getByLabel('textbox').focus();
        const conditionalRightConstant = faker.lorem.words();
        await page.keyboard.type(`!='${conditionalRightConstant}'`);
        await expect(page.getByLabel('textbox')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}!='${conditionalRightConstant}'`,
        );
        await conditionNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = conditionalRightConstant;
        await page.getByRole('textbox').fill(fieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');

        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(fieldData.toString())).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'exclamation' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('false');

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event Add Data Trigger, Formula engine, determines that the trigger node single line text field variable is not equal to an unequal constant, passes.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event Add Data Trigger, Formula engine, determines that the trigger node single line text field variable is not equal to an unequal constant, passes.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'orgname';
        const triggerNodeFieldDisplayName = '公司名称(单行文本)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置判断节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('rejectOnFalse').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionYesNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await conditionNode.formulaRadio.click();
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await page.getByLabel('textbox').focus();
        const conditionalRightConstant = faker.lorem.words();
        await page.keyboard.type(`!='${conditionalRightConstant}'`);
        await expect(page.getByLabel('textbox')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}!='${conditionalRightConstant}'`,
        );
        await conditionNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = faker.lorem.words();
        await page.getByRole('textbox').fill(fieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');

        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(fieldData.toString())).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('true');

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, Formula engine, determine the trigger node integer variable is equal to the query node equal integer variable, pass.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event add data trigger, Formula engine, determine the trigger node integer variable is equal to the query node equal integer variable, pass.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'staffnum';
        const triggerNodeFieldDisplayName = '员工人数(整数)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置前置查询节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'query', exact: true }).click();
        const preQueryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Query record-Query record', { exact: true })
            .getByRole('textbox')
            .fill(preQueryRecordNodeName);
        const preQueryRecordNode = new QueryRecordNode(page, preQueryRecordNodeName);
        await preQueryRecordNode.nodeConfigure.click();
        await preQueryRecordNode.collectionDropDown.click();
        await page.getByText(triggerNodeCollectionDisplayName).click();
        // 设置过滤条件
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByTestId('filter-select-field').getByLabel('Search').click();
        await page.getByText('ID', { exact: true }).click();
        await page.getByLabel('block-item-Filter-workflows-').getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
        await preQueryRecordNode.submitButton.click();

        //配置判断节点
        await preQueryRecordNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('rejectOnFalse').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionYesNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await conditionNode.formulaRadio.click();
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await page.getByLabel('textbox').focus();
        await page.keyboard.type('==');
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
        await page.getByRole('menuitemcheckbox', { name: preQueryRecordNodeName }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await expect(page.getByLabel('textbox')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}==Node result / ${preQueryRecordNodeName} / ${triggerNodeFieldDisplayName}`,
        );
        await conditionNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = faker.number.int();
        await page.getByRole('spinbutton').fill(fieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');
        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(fieldData.toString())).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('true');

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, Formula engine, determine trigger node integer variable is equal to query node not equal integer variable, not pass.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event add data trigger, Formula engine, determine trigger node integer variable is equal to query node not equal integer variable, not pass.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'staffnum';
        const triggerNodeFieldDisplayName = '员工人数(整数)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        // 过滤条件
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByTestId('filter-select-field').getByLabel('Search').click();
        await page.getByText('ID').click();
        await page.getByRole('spinbutton').click();
        await page.getByRole('spinbutton').fill('2');
        await collectionTriggerNode.submitButton.click();

        //配置前置查询节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'query', exact: true }).click();
        const preQueryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Query record-Query record', { exact: true })
            .getByRole('textbox')
            .fill(preQueryRecordNodeName);
        const preQueryRecordNode = new QueryRecordNode(page, preQueryRecordNodeName);
        await preQueryRecordNode.nodeConfigure.click();
        await preQueryRecordNode.collectionDropDown.click();
        await page.getByText(triggerNodeCollectionDisplayName).click();
        // 设置过滤条件
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByTestId('filter-select-field').getByLabel('Search').click();
        await page.getByText('ID', { exact: true }).click();
        await page.getByTestId('filter-select-operator').click();
        await page.getByRole('option', { name: 'is not' }).click();
        await page.getByLabel('block-item-Filter-workflows-').getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
        await preQueryRecordNode.submitButton.click();

        //配置判断节点
        await preQueryRecordNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('rejectOnFalse').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionYesNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await conditionNode.formulaRadio.click();
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await page.getByLabel('textbox').focus();
        await page.keyboard.type('==');
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
        await page.getByRole('menuitemcheckbox', { name: preQueryRecordNodeName }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await expect(page.getByLabel('textbox')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}==Node result / ${preQueryRecordNodeName} / ${triggerNodeFieldDisplayName}`,
        );
        await conditionNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const IDisOneFieldData = faker.number.int();
        await page.getByRole('spinbutton').fill(IDisOneFieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');
        await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
        const IDisTwoFieldData = faker.number.int();
        await page.getByRole('spinbutton').fill(IDisTwoFieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');
        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(IDisOneFieldData.toString())).toBeVisible();
        await expect(page.getByText(IDisTwoFieldData.toString())).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'exclamation' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('false');

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, Formula engine, determine trigger node integer variable is not equal to query node equal integer variable, not pass.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event add data trigger, Formula engine, determine trigger node integer variable is not equal to query node equal integer variable, not pass.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'staffnum';
        const triggerNodeFieldDisplayName = '员工人数(整数)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置前置查询节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'query', exact: true }).click();
        const preQueryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Query record-Query record', { exact: true })
            .getByRole('textbox')
            .fill(preQueryRecordNodeName);
        const preQueryRecordNode = new QueryRecordNode(page, preQueryRecordNodeName);
        await preQueryRecordNode.nodeConfigure.click();
        await preQueryRecordNode.collectionDropDown.click();
        await page.getByText(triggerNodeCollectionDisplayName).click();
        // 设置过滤条件
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByTestId('filter-select-field').getByLabel('Search').click();
        await page.getByText('ID', { exact: true }).click();
        await page.getByLabel('block-item-Filter-workflows-').getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
        await preQueryRecordNode.submitButton.click();

        //配置判断节点
        await preQueryRecordNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('rejectOnFalse').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionYesNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await conditionNode.formulaRadio.click();
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await page.getByLabel('textbox').focus();
        await page.keyboard.type('!=');
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
        await page.getByRole('menuitemcheckbox', { name: preQueryRecordNodeName }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await expect(page.getByLabel('textbox')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}!=Node result / ${preQueryRecordNodeName} / ${triggerNodeFieldDisplayName}`,
        );
        await conditionNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = faker.number.int();
        await page.getByRole('spinbutton').fill(fieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');

        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(fieldData.toString())).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'exclamation' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('false');

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, Formula engine, determine the trigger node integer variable is not equal to the query node not equal integer variable, pass.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event add data trigger, Formula engine, determine the trigger node integer variable is not equal to the query node not equal integer variable, pass.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'staffnum';
        const triggerNodeFieldDisplayName = '员工人数(整数)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        // 过滤条件
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByTestId('filter-select-field').getByLabel('Search').click();
        await page.getByText('ID').click();
        await page.getByRole('spinbutton').click();
        await page.getByRole('spinbutton').fill('2');
        await collectionTriggerNode.submitButton.click();

        //配置前置查询节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'query', exact: true }).click();
        const preQueryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Query record-Query record', { exact: true })
            .getByRole('textbox')
            .fill(preQueryRecordNodeName);
        const preQueryRecordNode = new QueryRecordNode(page, preQueryRecordNodeName);
        await preQueryRecordNode.nodeConfigure.click();
        await preQueryRecordNode.collectionDropDown.click();
        await page.getByText(triggerNodeCollectionDisplayName).click();
        // 设置过滤条件
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByTestId('filter-select-field').getByLabel('Search').click();
        await page.getByText('ID', { exact: true }).click();
        await page.getByTestId('filter-select-operator').click();
        await page.getByRole('option', { name: 'is not' }).click();
        await page.getByLabel('block-item-Filter-workflows-').getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
        await preQueryRecordNode.submitButton.click();

        //配置判断节点
        await preQueryRecordNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('rejectOnFalse').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionYesNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await conditionNode.formulaRadio.click();
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await page.getByLabel('textbox').focus();
        const conditionalRightConstant = faker.lorem.words();
        await page.keyboard.type(`!='${conditionalRightConstant}'`);
        await expect(page.getByLabel('textbox')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}!='${conditionalRightConstant}'`,
        );
        await conditionNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const IDisOneFieldData = faker.number.int();
        await page.getByRole('spinbutton').fill(IDisOneFieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');
        await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
        const IDisTwoFieldData = faker.number.int();
        await page.getByRole('spinbutton').fill(IDisTwoFieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');
        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(IDisOneFieldData.toString())).toBeVisible();
        await expect(page.getByText(IDisTwoFieldData.toString())).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('true');

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });
});

test.describe('Branch into "Yes" and "No"', () => {
    test('Collection event add data trigger, basic type, determines that the trigger node single line text field variable is equal to an equal constant, passes.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event add data trigger, basic type, determines that the trigger node single line text field variable is equal to an equal constant, passes.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'orgname';
        const triggerNodeFieldDisplayName = '公司名称(单行文本)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置判断节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('branch').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionBranchNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByLabel('variable-button').first().click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByText('公司名称(单行文本)').click();
        await expect(page.getByLabel('variable-tag')).toHaveText('Trigger variables / Trigger data / 公司名称(单行文本)');
        const conditionalRightConstant = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('variable-constant').fill(conditionalRightConstant);
        await conditionNode.submitButton.click();
        //添加No分支计算节点
        await conditionNode.addNoBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const noBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(noBranchcalCulationNodeName);
        const noBranchcalCulationNode = new ClculationNode(page, noBranchcalCulationNodeName);
        await noBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('0');
        await noBranchcalCulationNode.submitButton.click();
        //添加Yes分支计算节点
        await conditionNode.addYesBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const yesBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(yesBranchcalCulationNodeName);
        const yesBranchcalCulationNode = new ClculationNode(page, yesBranchcalCulationNodeName);
        await yesBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('1');
        await yesBranchcalCulationNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = conditionalRightConstant;
        await page.getByRole('textbox').fill(fieldData);
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');

        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(fieldData)).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('true');
        await page.getByLabel('Close', { exact: true }).click();

        //无法判断未执行分支状态，无法获取按钮状态

        // await page.getByLabel(`Calculation-${noBranchcalCulationNodeName}`, { exact: true }).getByRole('button', { name: 'check' }).click();
        // await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('0');
        // await page.getByLabel('Close', { exact: true }).click();

        await page
            .getByLabel(`Calculation-${yesBranchcalCulationNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('1');
        await page.getByLabel('Close', { exact: true }).click();

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, basic type, determines that the trigger node single line text field variable is equal to an unequal constant, fails.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event add data trigger, basic type, determines that the trigger node single line text field variable is equal to an unequal constant, fails.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'orgname';
        const triggerNodeFieldDisplayName = '公司名称(单行文本)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置判断节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('branch').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionBranchNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByLabel('variable-button').first().click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByText('公司名称(单行文本)').click();
        await expect(page.getByLabel('variable-tag')).toHaveText('Trigger variables / Trigger data / 公司名称(单行文本)');
        const conditionalRightConstant = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('variable-constant').fill(conditionalRightConstant);
        await conditionNode.submitButton.click();
        //添加No分支计算节点
        await conditionNode.addNoBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const noBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(noBranchcalCulationNodeName);
        const noBranchcalCulationNode = new ClculationNode(page, noBranchcalCulationNodeName);
        await noBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('0');
        await noBranchcalCulationNode.submitButton.click();
        //添加Yes分支计算节点
        await conditionNode.addYesBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const yesBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(yesBranchcalCulationNodeName);
        const yesBranchcalCulationNode = new ClculationNode(page, yesBranchcalCulationNodeName);
        await yesBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('1');
        await yesBranchcalCulationNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = conditionalRightConstant + '1';
        await page.getByRole('textbox').fill(fieldData);
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');

        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(fieldData)).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('false');
        await page.getByLabel('Close', { exact: true }).click();

        //无法判断未执行分支状态，无法获取按钮状态

        await page
            .getByLabel(`Calculation-${noBranchcalCulationNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('0');
        await page.getByLabel('Close', { exact: true }).click();

        // await page.getByLabel(`Calculation-${yesBranchcalCulationNodeName}`, { exact: true }).getByRole('button', { name: 'check' }).click();
        // await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('1');
        // await page.getByLabel('Close', { exact: true }).click();

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event Add Data Trigger, basic type, determines that the trigger node single line text field variable is not equal to an equal constant, fails.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event Add Data Trigger, basic type, determines that the trigger node single line text field variable is not equal to an equal constant, fails.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'orgname';
        const triggerNodeFieldDisplayName = '公司名称(单行文本)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置判断节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('branch').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionBranchNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByLabel('variable-button').first().click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByText('公司名称(单行文本)').click();
        await expect(page.getByLabel('variable-tag')).toHaveText('Trigger variables / Trigger data / 公司名称(单行文本)');
        await page.getByLabel('select-operator-calc').first().click();
        await page.getByRole('option', { name: '≠' }).click();
        const conditionalRightConstant = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('variable-constant').fill(conditionalRightConstant);
        await conditionNode.submitButton.click();
        //添加No分支计算节点
        await conditionNode.addNoBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const noBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(noBranchcalCulationNodeName);
        const noBranchcalCulationNode = new ClculationNode(page, noBranchcalCulationNodeName);
        await noBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('0');
        await noBranchcalCulationNode.submitButton.click();
        //添加Yes分支计算节点
        await conditionNode.addYesBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const yesBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(yesBranchcalCulationNodeName);
        const yesBranchcalCulationNode = new ClculationNode(page, yesBranchcalCulationNodeName);
        await yesBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('1');
        await yesBranchcalCulationNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = conditionalRightConstant;
        await page.getByRole('textbox').fill(fieldData);
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');

        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(fieldData)).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('false');
        await page.getByLabel('Close', { exact: true }).click();
        //无法判断未执行分支状态，无法获取按钮状态

        await page
            .getByLabel(`Calculation-${noBranchcalCulationNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('0');
        await page.getByLabel('Close', { exact: true }).click();

        // await page.getByLabel(`Calculation-${yesBranchcalCulationNodeName}`, { exact: true }).getByRole('button', { name: 'check' }).click();
        // await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('1');
        // await page.getByLabel('Close', { exact: true }).click();

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, basic type, determines that the trigger node single line text field variable is not equal to an unequal constant, passes.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event add data trigger, basic type, determines that the trigger node single line text field variable is not equal to an unequal constant, passes.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'orgname';
        const triggerNodeFieldDisplayName = '公司名称(单行文本)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置判断节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('branch').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionBranchNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByLabel('variable-button').first().click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByText('公司名称(单行文本)').click();
        await expect(page.getByLabel('variable-tag')).toHaveText('Trigger variables / Trigger data / 公司名称(单行文本)');
        await page.getByLabel('select-operator-calc').first().click();
        await page.getByRole('option', { name: '≠' }).click();
        const conditionalRightConstant = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('variable-constant').fill(conditionalRightConstant);
        await conditionNode.submitButton.click();
        //添加No分支计算节点
        await conditionNode.addNoBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const noBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(noBranchcalCulationNodeName);
        const noBranchcalCulationNode = new ClculationNode(page, noBranchcalCulationNodeName);
        await noBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('0');
        await noBranchcalCulationNode.submitButton.click();
        //添加Yes分支计算节点
        await conditionNode.addYesBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const yesBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(yesBranchcalCulationNodeName);
        const yesBranchcalCulationNode = new ClculationNode(page, yesBranchcalCulationNodeName);
        await yesBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('1');
        await yesBranchcalCulationNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = conditionalRightConstant + '1';
        await page.getByRole('textbox').fill(fieldData);
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');

        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(fieldData)).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('true');
        await page.getByLabel('Close', { exact: true }).click();
        //无法判断未执行分支状态，无法获取按钮状态

        // await page.getByLabel(`Calculation-${noBranchcalCulationNodeName}`, { exact: true }).getByRole('button', { name: 'check' }).click();
        // await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('0');
        // await page.getByLabel('Close', { exact: true }).click();

        await page
            .getByLabel(`Calculation-${yesBranchcalCulationNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('1');
        await page.getByLabel('Close', { exact: true }).click();

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, basic type, determine trigger node integer variable equal to query node equal integer variable, pass.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event add data trigger, basic type, determine trigger node integer variable equal to query node equal integer variable, pass.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'staffnum';
        const triggerNodeFieldDisplayName = '员工人数(整数)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置前置查询节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'query', exact: true }).click();
        const preQueryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Query record-Query record', { exact: true })
            .getByRole('textbox')
            .fill(preQueryRecordNodeName);
        const preQueryRecordNode = new QueryRecordNode(page, preQueryRecordNodeName);
        await preQueryRecordNode.nodeConfigure.click();
        await preQueryRecordNode.collectionDropDown.click();
        await page.getByText(triggerNodeCollectionDisplayName).click();
        // 设置过滤条件
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByTestId('filter-select-field').getByLabel('Search').click();
        await page.getByText('ID', { exact: true }).click();
        await page.getByLabel('block-item-Filter-workflows-').getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
        await preQueryRecordNode.submitButton.click();

        //配置判断节点
        await preQueryRecordNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('branch').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionBranchNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByLabel('variable-button').first().click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await expect(page.getByLabel('variable-tag')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`,
        );
        await page.getByLabel('variable-button').nth(1).click();
        await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
        await page.getByRole('menuitemcheckbox', { name: preQueryRecordNodeName }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await expect(page.getByLabel('variable-tag').nth(1)).toHaveText(
            `Node result / ${preQueryRecordNodeName} / ${triggerNodeFieldDisplayName}`,
        );
        await conditionNode.submitButton.click();
        //添加No分支计算节点
        await conditionNode.addNoBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const noBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(noBranchcalCulationNodeName);
        const noBranchcalCulationNode = new ClculationNode(page, noBranchcalCulationNodeName);
        await noBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('0');
        await noBranchcalCulationNode.submitButton.click();
        //添加Yes分支计算节点
        await conditionNode.addYesBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const yesBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(yesBranchcalCulationNodeName);
        const yesBranchcalCulationNode = new ClculationNode(page, yesBranchcalCulationNodeName);
        await yesBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('1');
        await yesBranchcalCulationNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = faker.number.int();
        await page.getByRole('spinbutton').fill(fieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');

        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(fieldData.toString())).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('true');
        await page.getByLabel('Close', { exact: true }).click();
        //无法判断未执行分支状态，无法获取按钮状态

        // await page.getByLabel(`Calculation-${noBranchcalCulationNodeName}`, { exact: true }).getByRole('button', { name: 'check' }).click();
        // await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('0');
        // await page.getByLabel('Close', { exact: true }).click();

        await page
            .getByLabel(`Calculation-${yesBranchcalCulationNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('1');
        await page.getByLabel('Close', { exact: true }).click();

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, basic type, determine trigger node integer variable is equal to query node not equal integer variable, not pass.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event add data trigger, basic type, determine trigger node integer variable is equal to query node not equal integer variable, not pass.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'staffnum';
        const triggerNodeFieldDisplayName = '员工人数(整数)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        // 过滤条件
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByTestId('filter-select-field').getByLabel('Search').click();
        await page.getByText('ID').click();
        await page.getByRole('spinbutton').click();
        await page.getByRole('spinbutton').fill('2');
        await collectionTriggerNode.submitButton.click();

        //配置前置查询节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'query', exact: true }).click();
        const preQueryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Query record-Query record', { exact: true })
            .getByRole('textbox')
            .fill(preQueryRecordNodeName);
        const preQueryRecordNode = new QueryRecordNode(page, preQueryRecordNodeName);
        await preQueryRecordNode.nodeConfigure.click();
        await preQueryRecordNode.collectionDropDown.click();
        await page.getByText(triggerNodeCollectionDisplayName).click();
        // 设置过滤条件
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByTestId('filter-select-field').getByLabel('Search').click();
        await page.getByText('ID', { exact: true }).click();
        await page.getByTestId('filter-select-operator').click();
        await page.getByRole('option', { name: 'is not' }).click();
        await page.getByLabel('block-item-Filter-workflows-').getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables right' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data right' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
        await preQueryRecordNode.submitButton.click();

        //配置判断节点
        await preQueryRecordNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('branch').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionBranchNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByLabel('variable-button').first().click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await expect(page.getByLabel('variable-tag')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`,
        );
        await page.getByLabel('variable-button').nth(1).click();
        await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
        await page.getByRole('menuitemcheckbox', { name: preQueryRecordNodeName }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await expect(page.getByLabel('variable-tag').nth(1)).toHaveText(
            `Node result / ${preQueryRecordNodeName} / ${triggerNodeFieldDisplayName}`,
        );
        await conditionNode.submitButton.click();
        //添加No分支计算节点
        await conditionNode.addNoBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const noBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(noBranchcalCulationNodeName);
        const noBranchcalCulationNode = new ClculationNode(page, noBranchcalCulationNodeName);
        await noBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('0');
        await noBranchcalCulationNode.submitButton.click();
        //添加Yes分支计算节点
        await conditionNode.addYesBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const yesBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(yesBranchcalCulationNodeName);
        const yesBranchcalCulationNode = new ClculationNode(page, yesBranchcalCulationNodeName);
        await yesBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('1');
        await yesBranchcalCulationNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const IDisOneFieldData = faker.number.int();
        await page.getByRole('spinbutton').fill(IDisOneFieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');
        await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
        const IDisTwoFieldData = faker.number.int();
        await page.getByRole('spinbutton').fill(IDisTwoFieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');
        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(IDisOneFieldData.toString())).toBeVisible();
        await expect(page.getByText(IDisTwoFieldData.toString())).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('false');
        await page.getByLabel('Close', { exact: true }).click();
        //无法判断未执行分支状态，无法获取按钮状态

        await page
            .getByLabel(`Calculation-${noBranchcalCulationNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('0');
        await page.getByLabel('Close', { exact: true }).click();

        // await page.getByLabel(`Calculation-${yesBranchcalCulationNodeName}`, { exact: true }).getByRole('button', { name: 'check' }).click();
        // await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('1');
        // await page.getByLabel('Close', { exact: true }).click();

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, basic type, determine trigger node integer variable is not equal to query node equal integer variable, not pass.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event add data trigger, basic type, determine trigger node integer variable is not equal to query node equal integer variable, not pass.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'staffnum';
        const triggerNodeFieldDisplayName = '员工人数(整数)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();
        //配置前置查询节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'query', exact: true }).click();
        const preQueryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Query record-Query record', { exact: true })
            .getByRole('textbox')
            .fill(preQueryRecordNodeName);
        const preQueryRecordNode = new QueryRecordNode(page, preQueryRecordNodeName);
        await preQueryRecordNode.nodeConfigure.click();
        await preQueryRecordNode.collectionDropDown.click();
        await page.getByText(triggerNodeCollectionDisplayName).click();
        // 设置过滤条件
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByTestId('filter-select-field').getByLabel('Search').click();
        await page.getByText('ID', { exact: true }).click();
        await page.getByLabel('block-item-Filter-workflows-').getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables right' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data right' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
        await preQueryRecordNode.submitButton.click();

        //配置判断节点
        await preQueryRecordNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('branch').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionBranchNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByLabel('variable-button').first().click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await expect(page.getByLabel('variable-tag')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`,
        );
        await page.getByLabel('select-operator-calc').first().click();
        await page.getByRole('option', { name: '≠' }).click();
        await page.getByLabel('variable-button').nth(1).click();
        await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
        await page.getByRole('menuitemcheckbox', { name: preQueryRecordNodeName }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await expect(page.getByLabel('variable-tag').nth(1)).toHaveText(
            `Node result / ${preQueryRecordNodeName} / ${triggerNodeFieldDisplayName}`,
        );
        await conditionNode.submitButton.click();
        //添加No分支计算节点
        await conditionNode.addNoBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const noBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(noBranchcalCulationNodeName);
        const noBranchcalCulationNode = new ClculationNode(page, noBranchcalCulationNodeName);
        await noBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('0');
        await noBranchcalCulationNode.submitButton.click();
        //添加Yes分支计算节点
        await conditionNode.addYesBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const yesBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(yesBranchcalCulationNodeName);
        const yesBranchcalCulationNode = new ClculationNode(page, yesBranchcalCulationNodeName);
        await yesBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('1');
        await yesBranchcalCulationNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const IDisOneFieldData = faker.number.int();
        await page.getByRole('spinbutton').fill(IDisOneFieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');
        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(IDisOneFieldData.toString())).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('false');
        await page.getByLabel('Close', { exact: true }).click();
        //无法判断未执行分支状态，无法获取按钮状态

        await page
            .getByLabel(`Calculation-${noBranchcalCulationNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('0');
        await page.getByLabel('Close', { exact: true }).click();

        // await page.getByLabel(`Calculation-${yesBranchcalCulationNodeName}`, { exact: true }).getByRole('button', { name: 'check' }).click();
        // await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('1');
        // await page.getByLabel('Close', { exact: true }).click();

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, basic type, determine trigger node integer variable is not equal to query node not equal integer variable, pass.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event add data trigger, basic type, determine trigger node integer variable is not equal to query node not equal integer variable, pass.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'staffnum';
        const triggerNodeFieldDisplayName = '员工人数(整数)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        // 过滤条件
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByTestId('filter-select-field').getByLabel('Search').click();
        await page.getByText('ID').click();
        await page.getByRole('spinbutton').click();
        await page.getByRole('spinbutton').fill('2');
        await collectionTriggerNode.submitButton.click();
        //配置前置查询节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'query', exact: true }).click();
        const preQueryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Query record-Query record', { exact: true })
            .getByRole('textbox')
            .fill(preQueryRecordNodeName);
        const preQueryRecordNode = new QueryRecordNode(page, preQueryRecordNodeName);
        await preQueryRecordNode.nodeConfigure.click();
        await preQueryRecordNode.collectionDropDown.click();
        await page.getByText(triggerNodeCollectionDisplayName).click();
        // 设置过滤条件
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByTestId('filter-select-field').getByLabel('Search').click();
        await page.getByText('ID', { exact: true }).click();
        await page.getByTestId('filter-select-operator').click();
        await page.getByRole('option', { name: 'is not' }).click();
        await page.getByLabel('block-item-Filter-workflows-').getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables right' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data right' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
        await preQueryRecordNode.submitButton.click();

        //配置判断节点
        await preQueryRecordNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('branch').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionBranchNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByLabel('variable-button').first().click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await expect(page.getByLabel('variable-tag')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`,
        );
        await page.getByLabel('select-operator-calc').first().click();
        await page.getByRole('option', { name: '≠' }).click();
        await page.getByLabel('variable-button').nth(1).click();
        await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
        await page.getByRole('menuitemcheckbox', { name: preQueryRecordNodeName }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await expect(page.getByLabel('variable-tag').nth(1)).toHaveText(
            `Node result / ${preQueryRecordNodeName} / ${triggerNodeFieldDisplayName}`,
        );
        await conditionNode.submitButton.click();
        //添加No分支计算节点
        await conditionNode.addNoBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const noBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(noBranchcalCulationNodeName);
        const noBranchcalCulationNode = new ClculationNode(page, noBranchcalCulationNodeName);
        await noBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('0');
        await noBranchcalCulationNode.submitButton.click();
        //添加Yes分支计算节点
        await conditionNode.addYesBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const yesBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(yesBranchcalCulationNodeName);
        const yesBranchcalCulationNode = new ClculationNode(page, yesBranchcalCulationNodeName);
        await yesBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('1');
        await yesBranchcalCulationNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const IDisOneFieldData = faker.number.int();
        await page.getByRole('spinbutton').fill(IDisOneFieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');
        await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
        const IDisTwoFieldData = faker.number.int();
        await page.getByRole('spinbutton').fill(IDisTwoFieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');
        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(IDisOneFieldData.toString())).toBeVisible();
        await expect(page.getByText(IDisTwoFieldData.toString())).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('true');
        await page.getByLabel('Close', { exact: true }).click();
        //无法判断未执行分支状态，无法获取按钮状态

        // await page.getByLabel(`Calculation-${noBranchcalCulationNodeName}`, { exact: true }).getByRole('button', { name: 'check' }).click();
        // await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('0');
        // await page.getByLabel('Close', { exact: true }).click();

        await page
            .getByLabel(`Calculation-${yesBranchcalCulationNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('1');
        await page.getByLabel('Close', { exact: true }).click();

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, Math engine, determine trigger node integer field variable is equal to an equal constant, pass.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event add data trigger, Math engine, determine trigger node integer field variable is equal to an equal constant, pass.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'staffnum';
        const triggerNodeFieldDisplayName = '员工人数(整数)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置判断节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('branch').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionBranchNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await conditionNode.mathRadio.click();
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await page.getByLabel('textbox').focus();
        const conditionalRightConstant = faker.number.int();
        await page.keyboard.type(`==${conditionalRightConstant}`);
        await expect(page.getByLabel('textbox')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}==${conditionalRightConstant}`,
        );
        await conditionNode.submitButton.click();
        //添加No分支计算节点
        await conditionNode.addNoBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const noBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(noBranchcalCulationNodeName);
        const noBranchcalCulationNode = new ClculationNode(page, noBranchcalCulationNodeName);
        await noBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('0');
        await noBranchcalCulationNode.submitButton.click();
        //添加Yes分支计算节点
        await conditionNode.addYesBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const yesBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(yesBranchcalCulationNodeName);
        const yesBranchcalCulationNode = new ClculationNode(page, yesBranchcalCulationNodeName);
        await yesBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('1');
        await yesBranchcalCulationNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = conditionalRightConstant;
        await page.getByRole('spinbutton').fill(fieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');

        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(`${fieldData}`)).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('true');
        await page.getByLabel('Close', { exact: true }).click();
        //无法判断未执行分支状态，无法获取按钮状态

        // await page.getByLabel(`Calculation-${noBranchcalCulationNodeName}`, { exact: true }).getByRole('button', { name: 'check' }).click();
        // await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('0');
        // await page.getByLabel('Close', { exact: true }).click();

        await page
            .getByLabel(`Calculation-${yesBranchcalCulationNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('1');
        await page.getByLabel('Close', { exact: true }).click();

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event Add Data Trigger, Math engine, determines that the trigger node integer field variable is equal to an unequal constant, fails.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event Add Data Trigger, Math engine, determines that the trigger node integer field variable is equal to an unequal constant, fails.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'staffnum';
        const triggerNodeFieldDisplayName = '员工人数(整数)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置判断节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('branch').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionBranchNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await conditionNode.mathRadio.click();
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await page.getByLabel('textbox').focus();
        const conditionalRightConstant = faker.number.int();
        await page.keyboard.type(`==${conditionalRightConstant}`);
        await expect(page.getByLabel('textbox')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}==${conditionalRightConstant}`,
        );
        await conditionNode.submitButton.click();
        //添加No分支计算节点
        await conditionNode.addNoBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const noBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(noBranchcalCulationNodeName);
        const noBranchcalCulationNode = new ClculationNode(page, noBranchcalCulationNodeName);
        await noBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('0');
        await noBranchcalCulationNode.submitButton.click();
        //添加Yes分支计算节点
        await conditionNode.addYesBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const yesBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(yesBranchcalCulationNodeName);
        const yesBranchcalCulationNode = new ClculationNode(page, yesBranchcalCulationNodeName);
        await yesBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('1');
        await yesBranchcalCulationNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = faker.number.int();
        await page.getByRole('spinbutton').fill(fieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');

        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(`${fieldData}`)).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('false');
        await page.getByLabel('Close', { exact: true }).click();
        //无法判断未执行分支状态，无法获取按钮状态

        await page
            .getByLabel(`Calculation-${noBranchcalCulationNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('0');
        await page.getByLabel('Close', { exact: true }).click();

        // await page.getByLabel(`Calculation-${yesBranchcalCulationNodeName}`, { exact: true }).getByRole('button', { name: 'check' }).click();
        // await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('1');
        // await page.getByLabel('Close', { exact: true }).click();

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event Add Data Trigger, Math engine, determines that the trigger node integer field variable is not equal to an equal constant, fails.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event Add Data Trigger, Math engine, determines that the trigger node integer field variable is not equal to an equal constant, fails.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'staffnum';
        const triggerNodeFieldDisplayName = '员工人数(整数)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置判断节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('branch').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionBranchNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await conditionNode.mathRadio.click();
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await page.getByLabel('textbox').focus();
        const conditionalRightConstant = faker.number.int();
        await page.keyboard.type(`!=${conditionalRightConstant}`);
        await expect(page.getByLabel('textbox')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}!=${conditionalRightConstant}`,
        );
        await conditionNode.submitButton.click();
        //添加No分支计算节点
        await conditionNode.addNoBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const noBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(noBranchcalCulationNodeName);
        const noBranchcalCulationNode = new ClculationNode(page, noBranchcalCulationNodeName);
        await noBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('0');
        await noBranchcalCulationNode.submitButton.click();
        //添加Yes分支计算节点
        await conditionNode.addYesBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const yesBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(yesBranchcalCulationNodeName);
        const yesBranchcalCulationNode = new ClculationNode(page, yesBranchcalCulationNodeName);
        await yesBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('1');
        await yesBranchcalCulationNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = conditionalRightConstant;
        await page.getByRole('spinbutton').fill(fieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');

        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(fieldData.toString())).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('false');
        await page.getByLabel('Close', { exact: true }).click();
        //无法判断未执行分支状态，无法获取按钮状态

        await page
            .getByLabel(`Calculation-${noBranchcalCulationNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('0');
        await page.getByLabel('Close', { exact: true }).click();

        // await page.getByLabel(`Calculation-${yesBranchcalCulationNodeName}`, { exact: true }).getByRole('button', { name: 'check' }).click();
        // await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('1');
        // await page.getByLabel('Close', { exact: true }).click();

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, Math engine, determines that the trigger node integer field variable is not equal to an unequal constant, passes.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event add data trigger, Math engine, determines that the trigger node integer field variable is not equal to an unequal constant, passes.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'staffnum';
        const triggerNodeFieldDisplayName = '员工人数(整数)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置判断节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('branch').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionBranchNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await conditionNode.mathRadio.click();
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await page.getByLabel('textbox').focus();
        const conditionalRightConstant = faker.number.int();
        await page.keyboard.type(`!=${conditionalRightConstant}`);
        await expect(page.getByLabel('textbox')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}!=${conditionalRightConstant}`,
        );
        await conditionNode.submitButton.click();
        //添加No分支计算节点
        await conditionNode.addNoBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const noBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(noBranchcalCulationNodeName);
        const noBranchcalCulationNode = new ClculationNode(page, noBranchcalCulationNodeName);
        await noBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('0');
        await noBranchcalCulationNode.submitButton.click();
        //添加Yes分支计算节点
        await conditionNode.addYesBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const yesBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(yesBranchcalCulationNodeName);
        const yesBranchcalCulationNode = new ClculationNode(page, yesBranchcalCulationNodeName);
        await yesBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('1');
        await yesBranchcalCulationNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = faker.number.int();
        await page.getByRole('spinbutton').fill(fieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');

        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(fieldData.toString())).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('true');
        await page.getByLabel('Close', { exact: true }).click();
        //无法判断未执行分支状态，无法获取按钮状态

        // await page.getByLabel(`Calculation-${noBranchcalCulationNodeName}`, { exact: true }).getByRole('button', { name: 'check' }).click();
        // await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('0');
        // await page.getByLabel('Close', { exact: true }).click();

        await page
            .getByLabel(`Calculation-${yesBranchcalCulationNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('1');
        await page.getByLabel('Close', { exact: true }).click();

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event Add Data Trigger, Formula engine, determines that the trigger node single line text field variable is equal to an equal constant, passes.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event Add Data Trigger, Formula engine, determines that the trigger node single line text field variable is equal to an equal constant, passes.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'orgname';
        const triggerNodeFieldDisplayName = '公司名称(单行文本)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置判断节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('branch').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionBranchNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await conditionNode.formulaRadio.click();
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await page.getByLabel('textbox').focus();
        const conditionalRightConstant = faker.lorem.words();
        await page.keyboard.type(`=='${conditionalRightConstant}'`);
        await expect(page.getByLabel('textbox')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}=='${conditionalRightConstant}'`,
        );
        await conditionNode.submitButton.click();
        //添加No分支计算节点
        await conditionNode.addNoBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const noBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(noBranchcalCulationNodeName);
        const noBranchcalCulationNode = new ClculationNode(page, noBranchcalCulationNodeName);
        await noBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('0');
        await noBranchcalCulationNode.submitButton.click();
        //添加Yes分支计算节点
        await conditionNode.addYesBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const yesBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(yesBranchcalCulationNodeName);
        const yesBranchcalCulationNode = new ClculationNode(page, yesBranchcalCulationNodeName);
        await yesBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('1');
        await yesBranchcalCulationNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = conditionalRightConstant;
        await page.getByRole('textbox').fill(fieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');

        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(fieldData.toString())).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('true');
        await page.getByLabel('Close', { exact: true }).click();
        //无法判断未执行分支状态，无法获取按钮状态

        // await page.getByLabel(`Calculation-${noBranchcalCulationNodeName}`, { exact: true }).getByRole('button', { name: 'check' }).click();
        // await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('0');
        // await page.getByLabel('Close', { exact: true }).click();

        await page
            .getByLabel(`Calculation-${yesBranchcalCulationNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('1');
        await page.getByLabel('Close', { exact: true }).click();

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event Add Data Trigger, Formula engine, determines that the trigger node single line text field variable is equal to an unequal constant, fails.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event Add Data Trigger, Formula engine, determines that the trigger node single line text field variable is equal to an unequal constant, fails.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'orgname';
        const triggerNodeFieldDisplayName = '公司名称(单行文本)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置判断节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('branch').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionBranchNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await conditionNode.formulaRadio.click();
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await page.getByLabel('textbox').focus();
        const conditionalRightConstant = faker.lorem.words();
        await page.keyboard.type(`=='${conditionalRightConstant}'`);
        await expect(page.getByLabel('textbox')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}=='${conditionalRightConstant}'`,
        );
        await conditionNode.submitButton.click();
        //添加No分支计算节点
        await conditionNode.addNoBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const noBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(noBranchcalCulationNodeName);
        const noBranchcalCulationNode = new ClculationNode(page, noBranchcalCulationNodeName);
        await noBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('0');
        await noBranchcalCulationNode.submitButton.click();
        //添加Yes分支计算节点
        await conditionNode.addYesBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const yesBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(yesBranchcalCulationNodeName);
        const yesBranchcalCulationNode = new ClculationNode(page, yesBranchcalCulationNodeName);
        await yesBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('1');
        await yesBranchcalCulationNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = faker.lorem.words();
        await page.getByRole('textbox').fill(fieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');

        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(fieldData.toString())).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('false');
        await page.getByLabel('Close', { exact: true }).click();
        //无法判断未执行分支状态，无法获取按钮状态

        await page
            .getByLabel(`Calculation-${noBranchcalCulationNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('0');
        await page.getByLabel('Close', { exact: true }).click();

        // await page.getByLabel(`Calculation-${yesBranchcalCulationNodeName}`, { exact: true }).getByRole('button', { name: 'check' }).click();
        // await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('1');
        // await page.getByLabel('Close', { exact: true }).click();

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event Add Data Trigger, Formula engine, determines that the trigger node single line text field variable is not equal to an equal constant, fails.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event Add Data Trigger, Formula engine, determines that the trigger node single line text field variable is not equal to an equal constant, fails.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'orgname';
        const triggerNodeFieldDisplayName = '公司名称(单行文本)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置判断节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('branch').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionBranchNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await conditionNode.formulaRadio.click();
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await page.getByLabel('textbox').focus();
        const conditionalRightConstant = faker.lorem.words();
        await page.keyboard.type(`!='${conditionalRightConstant}'`);
        await expect(page.getByLabel('textbox')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}!='${conditionalRightConstant}'`,
        );
        await conditionNode.submitButton.click();
        //添加No分支计算节点
        await conditionNode.addNoBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const noBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(noBranchcalCulationNodeName);
        const noBranchcalCulationNode = new ClculationNode(page, noBranchcalCulationNodeName);
        await noBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('0');
        await noBranchcalCulationNode.submitButton.click();
        //添加Yes分支计算节点
        await conditionNode.addYesBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const yesBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(yesBranchcalCulationNodeName);
        const yesBranchcalCulationNode = new ClculationNode(page, yesBranchcalCulationNodeName);
        await yesBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('1');
        await yesBranchcalCulationNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = conditionalRightConstant;
        await page.getByRole('textbox').fill(fieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');

        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(fieldData.toString())).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('false');
        await page.getByLabel('Close', { exact: true }).click();
        //无法判断未执行分支状态，无法获取按钮状态

        await page
            .getByLabel(`Calculation-${noBranchcalCulationNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('0');
        await page.getByLabel('Close', { exact: true }).click();

        // await page.getByLabel(`Calculation-${yesBranchcalCulationNodeName}`, { exact: true }).getByRole('button', { name: 'check' }).click();
        // await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('1');
        // await page.getByLabel('Close', { exact: true }).click();

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event Add Data Trigger, Formula engine, determines that the trigger node single line text field variable is not equal to an unequal constant, passes.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event Add Data Trigger, Formula engine, determines that the trigger node single line text field variable is not equal to an unequal constant, passes.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'orgname';
        const triggerNodeFieldDisplayName = '公司名称(单行文本)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置判断节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('branch').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionBranchNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await conditionNode.formulaRadio.click();
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await page.getByLabel('textbox').focus();
        const conditionalRightConstant = faker.lorem.words();
        await page.keyboard.type(`!='${conditionalRightConstant}'`);
        await expect(page.getByLabel('textbox')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}!='${conditionalRightConstant}'`,
        );
        await conditionNode.submitButton.click();
        //添加No分支计算节点
        await conditionNode.addNoBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const noBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(noBranchcalCulationNodeName);
        const noBranchcalCulationNode = new ClculationNode(page, noBranchcalCulationNodeName);
        await noBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('0');
        await noBranchcalCulationNode.submitButton.click();
        //添加Yes分支计算节点
        await conditionNode.addYesBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const yesBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(yesBranchcalCulationNodeName);
        const yesBranchcalCulationNode = new ClculationNode(page, yesBranchcalCulationNodeName);
        await yesBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('1');
        await yesBranchcalCulationNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = faker.lorem.words();
        await page.getByRole('textbox').fill(fieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');

        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(fieldData.toString())).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('true');
        await page.getByLabel('Close', { exact: true }).click();
        //无法判断未执行分支状态，无法获取按钮状态

        // await page.getByLabel(`Calculation-${noBranchcalCulationNodeName}`, { exact: true }).getByRole('button', { name: 'check' }).click();
        // await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('0');
        // await page.getByLabel('Close', { exact: true }).click();

        await page
            .getByLabel(`Calculation-${yesBranchcalCulationNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('1');
        await page.getByLabel('Close', { exact: true }).click();

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, Formula engine, determine the trigger node integer variable is equal to the query node equal integer variable, pass.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event add data trigger, Formula engine, determine the trigger node integer variable is equal to the query node equal integer variable, pass.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'staffnum';
        const triggerNodeFieldDisplayName = '员工人数(整数)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置前置查询节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'query', exact: true }).click();
        const preQueryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Query record-Query record', { exact: true })
            .getByRole('textbox')
            .fill(preQueryRecordNodeName);
        const preQueryRecordNode = new QueryRecordNode(page, preQueryRecordNodeName);
        await preQueryRecordNode.nodeConfigure.click();
        await preQueryRecordNode.collectionDropDown.click();
        await page.getByText(triggerNodeCollectionDisplayName).click();
        // 设置过滤条件
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByTestId('filter-select-field').getByLabel('Search').click();
        await page.getByText('ID', { exact: true }).click();
        await page.getByLabel('block-item-Filter-workflows-').getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
        await preQueryRecordNode.submitButton.click();

        //配置判断节点
        await preQueryRecordNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('branch').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionBranchNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await conditionNode.formulaRadio.click();
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await page.getByLabel('textbox').focus();
        await page.keyboard.type('==');
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
        await page.getByRole('menuitemcheckbox', { name: preQueryRecordNodeName }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await expect(page.getByLabel('textbox')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}==Node result / ${preQueryRecordNodeName} / ${triggerNodeFieldDisplayName}`,
        );
        await conditionNode.submitButton.click();
        //添加No分支计算节点
        await conditionNode.addNoBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const noBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(noBranchcalCulationNodeName);
        const noBranchcalCulationNode = new ClculationNode(page, noBranchcalCulationNodeName);
        await noBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('0');
        await noBranchcalCulationNode.submitButton.click();
        //添加Yes分支计算节点
        await conditionNode.addYesBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const yesBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(yesBranchcalCulationNodeName);
        const yesBranchcalCulationNode = new ClculationNode(page, yesBranchcalCulationNodeName);
        await yesBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('1');
        await yesBranchcalCulationNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = faker.number.int();
        await page.getByRole('spinbutton').fill(fieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');
        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(fieldData.toString())).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('true');
        await page.getByLabel('Close', { exact: true }).click();
        //无法判断未执行分支状态，无法获取按钮状态

        // await page.getByLabel(`Calculation-${noBranchcalCulationNodeName}`, { exact: true }).getByRole('button', { name: 'check' }).click();
        // await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('0');
        // await page.getByLabel('Close', { exact: true }).click();

        await page
            .getByLabel(`Calculation-${yesBranchcalCulationNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('1');
        await page.getByLabel('Close', { exact: true }).click();

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, Formula engine, determine trigger node integer variable is equal to query node not equal integer variable, not pass.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event add data trigger, Formula engine, determine trigger node integer variable is equal to query node not equal integer variable, not pass.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'staffnum';
        const triggerNodeFieldDisplayName = '员工人数(整数)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        // 过滤条件
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByTestId('filter-select-field').getByLabel('Search').click();
        await page.getByText('ID').click();
        await page.getByRole('spinbutton').click();
        await page.getByRole('spinbutton').fill('2');
        await collectionTriggerNode.submitButton.click();

        //配置前置查询节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'query', exact: true }).click();
        const preQueryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Query record-Query record', { exact: true })
            .getByRole('textbox')
            .fill(preQueryRecordNodeName);
        const preQueryRecordNode = new QueryRecordNode(page, preQueryRecordNodeName);
        await preQueryRecordNode.nodeConfigure.click();
        await preQueryRecordNode.collectionDropDown.click();
        await page.getByText(triggerNodeCollectionDisplayName).click();
        // 设置过滤条件
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByTestId('filter-select-field').getByLabel('Search').click();
        await page.getByText('ID', { exact: true }).click();
        await page.getByTestId('filter-select-operator').click();
        await page.getByRole('option', { name: 'is not' }).click();
        await page.getByLabel('block-item-Filter-workflows-').getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
        await preQueryRecordNode.submitButton.click();

        //配置判断节点
        await preQueryRecordNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('branch').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionBranchNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await conditionNode.formulaRadio.click();
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await page.getByLabel('textbox').focus();
        await page.keyboard.type('==');
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
        await page.getByRole('menuitemcheckbox', { name: preQueryRecordNodeName }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await expect(page.getByLabel('textbox')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}==Node result / ${preQueryRecordNodeName} / ${triggerNodeFieldDisplayName}`,
        );
        await conditionNode.submitButton.click();
        //添加No分支计算节点
        await conditionNode.addNoBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const noBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(noBranchcalCulationNodeName);
        const noBranchcalCulationNode = new ClculationNode(page, noBranchcalCulationNodeName);
        await noBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('0');
        await noBranchcalCulationNode.submitButton.click();
        //添加Yes分支计算节点
        await conditionNode.addYesBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const yesBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(yesBranchcalCulationNodeName);
        const yesBranchcalCulationNode = new ClculationNode(page, yesBranchcalCulationNodeName);
        await yesBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('1');
        await yesBranchcalCulationNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const IDisOneFieldData = faker.number.int();
        await page.getByRole('spinbutton').fill(IDisOneFieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');
        await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
        const IDisTwoFieldData = faker.number.int();
        await page.getByRole('spinbutton').fill(IDisTwoFieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');
        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(IDisOneFieldData.toString())).toBeVisible();
        await expect(page.getByText(IDisTwoFieldData.toString())).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('false');
        await page.getByLabel('Close', { exact: true }).click();
        //无法判断未执行分支状态，无法获取按钮状态

        await page
            .getByLabel(`Calculation-${noBranchcalCulationNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('0');
        await page.getByLabel('Close', { exact: true }).click();

        // await page.getByLabel(`Calculation-${yesBranchcalCulationNodeName}`, { exact: true }).getByRole('button', { name: 'check' }).click();
        // await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('1');
        // await page.getByLabel('Close', { exact: true }).click();

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, Formula engine, determine trigger node integer variable is not equal to query node equal integer variable, not pass.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event add data trigger, Formula engine, determine trigger node integer variable is not equal to query node equal integer variable, not pass.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'staffnum';
        const triggerNodeFieldDisplayName = '员工人数(整数)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        await collectionTriggerNode.submitButton.click();

        //配置前置查询节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'query', exact: true }).click();
        const preQueryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Query record-Query record', { exact: true })
            .getByRole('textbox')
            .fill(preQueryRecordNodeName);
        const preQueryRecordNode = new QueryRecordNode(page, preQueryRecordNodeName);
        await preQueryRecordNode.nodeConfigure.click();
        await preQueryRecordNode.collectionDropDown.click();
        await page.getByText(triggerNodeCollectionDisplayName).click();
        // 设置过滤条件
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByTestId('filter-select-field').getByLabel('Search').click();
        await page.getByText('ID', { exact: true }).click();
        await page.getByLabel('block-item-Filter-workflows-').getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
        await preQueryRecordNode.submitButton.click();

        //配置判断节点
        await preQueryRecordNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('branch').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionBranchNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await conditionNode.formulaRadio.click();
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await page.getByLabel('textbox').focus();
        await page.keyboard.type('!=');
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
        await page.getByRole('menuitemcheckbox', { name: preQueryRecordNodeName }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await expect(page.getByLabel('textbox')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}!=Node result / ${preQueryRecordNodeName} / ${triggerNodeFieldDisplayName}`,
        );
        await conditionNode.submitButton.click();
        //添加No分支计算节点
        await conditionNode.addNoBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const noBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(noBranchcalCulationNodeName);
        const noBranchcalCulationNode = new ClculationNode(page, noBranchcalCulationNodeName);
        await noBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('0');
        await noBranchcalCulationNode.submitButton.click();
        //添加Yes分支计算节点
        await conditionNode.addYesBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const yesBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(yesBranchcalCulationNodeName);
        const yesBranchcalCulationNode = new ClculationNode(page, yesBranchcalCulationNodeName);
        await yesBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('1');
        await yesBranchcalCulationNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const fieldData = faker.number.int();
        await page.getByRole('spinbutton').fill(fieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');

        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(fieldData.toString())).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('false');
        await page.getByLabel('Close', { exact: true }).click();
        //无法判断未执行分支状态，无法获取按钮状态

        await page
            .getByLabel(`Calculation-${noBranchcalCulationNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('0');
        await page.getByLabel('Close', { exact: true }).click();

        // await page.getByLabel(`Calculation-${yesBranchcalCulationNodeName}`, { exact: true }).getByRole('button', { name: 'check' }).click();
        // await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('1');
        // await page.getByLabel('Close', { exact: true }).click();

        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Collection event add data trigger, Formula engine, determine the trigger node integer variable is not equal to the query node not equal integer variable, pass.', async ({
        page,
        mockCollections,
        mockRecords,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const triggerNodeAppendText = faker.lorem.word(4);
        const createRecordFormAppendText = faker.lorem.word(4);
        //用例标题
        const caseTitle =
            'Collection event add data trigger, Formula engine, determine the trigger node integer variable is not equal to the query node not equal integer variable, pass.';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
        const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
        const triggerNodeFieldName = 'staffnum';
        const triggerNodeFieldDisplayName = '员工人数(整数)';
        await mockCollections(
            appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
        );

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
        await page.getByText(triggerNodeCollectionDisplayName).click();
        await collectionTriggerNode.triggerOnDropdown.click();
        await page.getByText('After record added', { exact: true }).click();
        // 过滤条件
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByTestId('filter-select-field').getByLabel('Search').click();
        await page.getByText('ID').click();
        await page.getByRole('spinbutton').click();
        await page.getByRole('spinbutton').fill('2');
        await collectionTriggerNode.submitButton.click();

        //配置前置查询节点
        await collectionTriggerNode.addNodeButton.click();
        await page.getByRole('button', { name: 'query', exact: true }).click();
        const preQueryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Query record-Query record', { exact: true })
            .getByRole('textbox')
            .fill(preQueryRecordNodeName);
        const preQueryRecordNode = new QueryRecordNode(page, preQueryRecordNodeName);
        await preQueryRecordNode.nodeConfigure.click();
        await preQueryRecordNode.collectionDropDown.click();
        await page.getByText(triggerNodeCollectionDisplayName).click();
        // 设置过滤条件
        await page.getByText('Add condition', { exact: true }).click();
        await page.getByTestId('filter-select-field').getByLabel('Search').click();
        await page.getByText('ID', { exact: true }).click();
        await page.getByTestId('filter-select-operator').click();
        await page.getByRole('option', { name: 'is not' }).click();
        await page.getByLabel('block-item-Filter-workflows-').getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
        await preQueryRecordNode.submitButton.click();

        //配置判断节点
        await preQueryRecordNode.addNodeButton.click();
        await page.getByRole('button', { name: 'condition', exact: true }).hover();
        await page.getByLabel('branch').click();
        const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
        const conditionNode = new ConditionBranchNode(page, conditionNodeName);
        await conditionNode.nodeConfigure.click();
        await conditionNode.formulaRadio.click();
        await page.getByLabel('variable-button').click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
        await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
        await page.getByLabel('textbox').focus();
        const conditionalRightConstant = faker.lorem.words();
        await page.keyboard.type(`!='${conditionalRightConstant}'`);
        await expect(page.getByLabel('textbox')).toHaveText(
            `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}!='${conditionalRightConstant}'`,
        );
        await conditionNode.submitButton.click();
        //添加No分支计算节点
        await conditionNode.addNoBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const noBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(noBranchcalCulationNodeName);
        const noBranchcalCulationNode = new ClculationNode(page, noBranchcalCulationNodeName);
        await noBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('0');
        await noBranchcalCulationNode.submitButton.click();
        //添加Yes分支计算节点
        await conditionNode.addYesBranchNode.click();
        await page.getByRole('button', { name: 'calculation', exact: true }).click();
        const yesBranchcalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await page
            .getByLabel('Calculation-Calculation', { exact: true })
            .getByRole('textbox')
            .fill(yesBranchcalCulationNodeName);
        const yesBranchcalCulationNode = new ClculationNode(page, yesBranchcalCulationNodeName);
        await yesBranchcalCulationNode.nodeConfigure.click();
        await page.getByLabel('textbox').fill('1');
        await yesBranchcalCulationNode.submitButton.click();

        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        //配置录入数据区块
        const addDataPage = mockPage();
        await addDataPage.goto();
        await page.waitForLoadState('networkidle');
        await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
        await page.getByRole('menuitem', { name: 'table Table' }).hover();
        await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

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

        // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
        const IDisOneFieldData = faker.number.int();
        await page.getByRole('spinbutton').fill(IDisOneFieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');
        await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
        const IDisTwoFieldData = faker.number.int();
        await page.getByRole('spinbutton').fill(IDisTwoFieldData.toString());
        await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
        await page.waitForLoadState('networkidle');
        // 3、预期结果：数据添加成功，工作流成功触发,判断节点true通过
        await expect(page.getByText(IDisOneFieldData.toString())).toBeVisible();
        await expect(page.getByText(IDisTwoFieldData.toString())).toBeVisible();
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page
            .getByLabel(`Condition-${conditionNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('true');
        await page.getByLabel('Close', { exact: true }).click();
        //无法判断未执行分支状态，无法获取按钮状态

        // await page.getByLabel(`Calculation-${noBranchcalCulationNodeName}`, { exact: true }).getByRole('button', { name: 'check' }).click();
        // await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('0');
        // await page.getByLabel('Close', { exact: true }).click();

        await page
            .getByLabel(`Calculation-${yesBranchcalCulationNodeName}`, { exact: true })
            .getByRole('button', { name: 'check' })
            .click();
        await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('1');
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