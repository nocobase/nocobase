import { Locator, Page } from '@nocobase/test/e2e';
export class CreateWorkFlow {
  readonly page: Page;
  name: Locator;
  triggerType: Locator;
  description: Locator;
  autoDeleteHistory: Locator;
  submitButton: Locator;
  cancelButton: Locator;
  constructor(page: Page) {
    this.page = page;
    this.name = page.getByLabel('block-item-CollectionField-workflows-Name').getByRole('textbox');
    this.triggerType = page.getByTestId('select-single');
    this.description = page.getByTestId('description-item').getByRole('textbox');
    this.autoDeleteHistory = page.getByTestId('select-multiple');
    this.submitButton = page.getByLabel('action-Action-Submit-workflows');
    this.cancelButton = page.getByLabel('action-Action-Cancel-workflows');
  }
}

export class EditWorkFlow {
  readonly page: Page;
  name: Locator;
  statusIsOn: Locator;
  statusIisOff: Locator;
  description: Locator;
  autoDeleteHistory: Locator;
  submitButton: Locator;
  cancelButton: Locator;
  constructor(page: Page, workFlowName: string) {
    this.page = page;
    this.name = page.getByLabel('block-item-CollectionField-workflows-Name').getByRole('textbox');
    this.statusIsOn = page.getByLabel('On', { exact: true });
    this.statusIisOff = page.getByLabel('Off');
    this.description = page.getByTestId('description-item').getByRole('textbox');
    this.autoDeleteHistory = page
      .getByTestId('deleteExecutionOnStatus-item')
      .getByTestId('antd-select')
      .locator('div')
      .nth(1);
    this.submitButton = page.getByLabel(`action-Action-Submit-workflows-${workFlowName}`);
    this.cancelButton = page.getByLabel(`action-Action-Cancel-workflows-${workFlowName}`);
  }
}

export class WorkflowManagement {
  readonly page: Page;
  addNewButton: Locator;
  deleteButton: Locator;
  filterButton: Locator;
  constructor(page: Page) {
    this.page = page;
    this.addNewButton = page.getByLabel('action-Action-Add new-workflows');
    this.deleteButton = page.getByLabel('action-Action-Delete-workflows');
    this.filterButton = page.getByLabel('action-Filter.Action-Filter-filter-workflows');
  }
}

export class WorkflowListRecords {
  readonly page: Page;
  executionCountPopup: Locator;
  configureAction: Locator;
  editAction: Locator;
  duplicateAction: Locator;
  deleteAction: Locator;
  constructor(page: Page, workFlowName: string) {
    this.page = page;
    this.executionCountPopup = page.getByLabel(`executed-${workFlowName}`);
    this.configureAction = page.getByLabel(`action-WorkflowLink-Configure-workflows-${workFlowName}`);
    this.editAction = page.getByLabel(`action-Action.Link-Edit-workflows-${workFlowName}`);
    this.duplicateAction = page.getByLabel(`action-Action.Link-Duplicate-workflows-${workFlowName}`);
    this.deleteAction = page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}`);
  }
}

export class ApprovalTriggerNode {
  readonly page: Page;
  node: Locator;
  nodeTitle: Locator;
  nodeConfigure: Locator;
  collectionDropDown: Locator;
  dataBlocksInitiationRadio: Locator;
  dataBlocksAndGlobalApprovalBlocksInitiationRadio: Locator;
  allowedToBeWithdrawnCheckbox: Locator;
  goToconfigureButton: Locator;
  addBlockButton: Locator;
  addApplyFormMenu: Locator;
  configureFieldsButton: Locator;
  configureActionsButton: Locator;
  saveDraftSwitch: Locator;
  submitButton: Locator;
  cancelButton: Locator;
  addNodeButton: Locator;
  constructor(page: Page, triggerName: string, collectionName: string) {
    this.page = page;
    this.node = page.getByText('TriggeraConfigure');
    this.nodeTitle = page.locator('textarea').filter({ hasText: triggerName });
    this.nodeConfigure = page.getByRole('button', { name: 'Configure' });
    this.collectionDropDown = page
      .getByLabel('block-item-DataSourceCollectionCascader-workflows-Collection')
      .locator('.ant-select-selection-search-input');
    this.dataBlocksInitiationRadio = page.getByLabel('Initiate and approve in data blocks only');
    this.dataBlocksAndGlobalApprovalBlocksInitiationRadio = page.getByLabel(
      'Initiate and approve in both data blocks and global approval blocks',
    );
    this.allowedToBeWithdrawnCheckbox = page.getByLabel('Allowed to be withdrawn');
    this.goToconfigureButton = page.getByRole('button', { name: 'Go to configure' });
    this.addBlockButton = page.getByLabel(`schema-initializer-Grid-ApprovalApplyAddBlockButton-${collectionName}`);
    this.addApplyFormMenu = page.getByRole('menuitem', { name: 'Apply form' });
    this.configureFieldsButton = page.getByLabel(`schema-initializer-Grid-form:configureFields-${collectionName}`);
    this.configureActionsButton = page.getByLabel(
      `schema-initializer-ActionBar-ApprovalApplyAddActionButton-${collectionName}`,
    );
    this.saveDraftSwitch = page.getByRole('menuitem', { name: 'Save draft' }).getByRole('switch');
    this.submitButton = page.getByLabel('action-Action-Submit-workflows');
    this.cancelButton = page.getByLabel('action-Action-Cancel-workflows');
    this.addNodeButton = this.addNodeButton = page.getByLabel('add-button', { exact: true });
  }
}

export class ApprovalPassthroughModeNode {
  readonly page: Page;
  node: Locator;
  nodeTitle: Locator;
  nodeConfigure: Locator;
  addAssigneesButton: Locator;
  assigneesDropDown: Locator;
  OrRadio: Locator;
  AndRadio: Locator;
  votingRadio: Locator;
  parallellyRadio: Locator;
  sequentiallyRadio: Locator;
  goToconfigureButton: Locator;
  addBlockButton: Locator;
  addDetailsMenu: Locator;
  detailsConfigureFieldsButton: Locator;
  addActionsMenu: Locator;
  actionsConfigureFieldsButton: Locator;
  actionsConfigureActionsButton: Locator;
  addApproveButton: Locator;
  addRejectButton: Locator;
  addReturnButton: Locator;
  addNodeResult: Locator;
  submitButton: Locator;
  cancelButton: Locator;
  addNodeButton: Locator;
  constructor(page: Page, nodeName: string, collectionName: string) {
    this.page = page;
    this.node = page.getByLabel(`Approval-${nodeName}`, { exact: true });
    this.nodeTitle = page.getByLabel(`Approval-${nodeName}`, { exact: true }).getByRole('textbox');
    this.nodeConfigure = page
      .getByLabel(`Approval-${nodeName}`, { exact: true })
      .getByRole('button', { name: 'Configure' });
    this.addAssigneesButton = page.getByRole('button', { name: 'plus Add assignee' });
    this.assigneesDropDown = page.getByTestId('select-single');
    this.OrRadio = page.getByLabel('Or', { exact: true });
    this.AndRadio = page.getByLabel('And', { exact: true });
    this.votingRadio = page.getByLabel('Voting', { exact: true });
    this.parallellyRadio = page.getByLabel('Parallelly', { exact: true });
    this.sequentiallyRadio = page.getByLabel('Sequentially', { exact: true });
    this.goToconfigureButton = page.getByRole('button', { name: 'Go to configure' });
    this.addBlockButton = page.getByLabel('schema-initializer-Grid-ApprovalProcessAddBlockButton-workflows');
    this.addDetailsMenu = page.getByRole('menuitem', { name: 'Details' });
    this.detailsConfigureFieldsButton = page.getByLabel(
      `schema-initializer-Grid-ReadPrettyFormItemInitializers-${collectionName}`,
    );
    this.addActionsMenu = page.getByRole('menuitem', { name: 'Actions' }).getByRole('switch');
    this.actionsConfigureFieldsButton = page.getByLabel('schema-initializer-Grid-FormItemInitializers-approvalRecords');
    this.actionsConfigureActionsButton = page.getByLabel(
      'schema-initializer-ActionBar-ApprovalProcessAddActionButton-approvalRecords',
    );
    this.addApproveButton = page.getByRole('menuitem', { name: 'Approve' }).getByRole('switch');
    this.addRejectButton = page.getByRole('menuitem', { name: 'Reject' }).getByRole('switch');
    this.addReturnButton = page.getByRole('menuitem', { name: 'Return' }).getByRole('switch');
    this.addNodeResult = page.getByRole('menuitem', { name: 'Node result right' });
    this.submitButton = page.getByLabel('action-Action-Submit-workflows');
    this.cancelButton = page.getByLabel('action-Action-Cancel-workflows');
    this.addNodeButton = page.getByLabel(`add-button-calculation-${nodeName}`, { exact: true });
  }
}

export class ScheduleTriggerNode {
  readonly page: Page;
  node: Locator;
  nodeTitle: Locator;
  nodeConfigure: Locator;
  customTimeTriggerOptions: Locator;
  startTimeEntryBox: Locator;
  RrpeatModeDropdown: Locator;

  dataTableTimeFieldOptions: Locator;
  collectionDropDown: Locator;
  startTimeDropdown: Locator;
  submitButton: Locator;
  cancelButton: Locator;
  addNodeButton: Locator;
  constructor(page: Page, triggerName: string, collectionName: string) {
    this.page = page;
    this.node = page.getByText('TriggeraConfigure');
    this.nodeTitle = page.locator('textarea').filter({ hasText: triggerName });
    this.nodeConfigure = page.getByRole('button', { name: 'Configure' });
    this.customTimeTriggerOptions = page.getByLabel('Based on certain date');
    this.startTimeEntryBox = page.getByPlaceholder('Select date');
    this.RrpeatModeDropdown = page.getByLabel('block-item-RepeatField-workflows-Repeat mode');

    this.dataTableTimeFieldOptions = page.getByLabel('Based on date field of collection');
    this.collectionDropDown = page
      .getByLabel('block-item-DataSourceCollectionCascader-workflows-Collection')
      .locator('.ant-select-selection-search-input');
    this.startTimeDropdown = page.getByLabel('block-item-OnField-workflows-Starts on');
    this.submitButton = page.getByLabel('action-Action-Submit-workflows');
    this.cancelButton = page.getByLabel('action-Action-Cancel-workflows');
    this.addNodeButton = page.getByLabel('add-button', { exact: true });
  }
}

export class CollectionTriggerNode {
  readonly page: Page;
  node: Locator;
  nodeTitle: Locator;
  nodeConfigure: Locator;
  collectionDropDown: Locator;
  triggerOnDropdown: Locator;
  submitButton: Locator;
  cancelButton: Locator;
  addNodeButton: Locator;
  constructor(page: Page, triggerName: string, collectionName: string) {
    this.page = page;
    this.node = page.getByLabel(`Trigger-${triggerName}`);
    this.nodeTitle = page.getByLabel(`Trigger-${triggerName}`).getByRole('textbox');
    this.nodeConfigure = page.getByLabel(`Trigger-${triggerName}`).getByRole('button', { name: 'Configure' });
    // this.collectionDropDown = page.getByRole('button', { name: 'Select collection' });
    this.collectionDropDown = page
      .getByLabel('block-item-DataSourceCollectionCascader-workflows-Collection')
      .locator('.ant-select-selection-search-input');
    this.triggerOnDropdown = page
      .getByLabel('block-item-Select-workflows-Trigger on')
      .getByRole('button', { name: 'Trigger on' });
    this.submitButton = page.getByLabel('action-Action-Submit-workflows');
    this.cancelButton = page.getByLabel('action-Action-Cancel-workflows');
    this.addNodeButton = page.getByLabel('add-button', { exact: true });
  }
}

export class FormEventTriggerNode {
  readonly page: Page;
  node: Locator;
  nodeTitle: Locator;
  nodeConfigure: Locator;
  collectionDropDown: Locator;
  relationalDataDropdown: Locator;
  submitButton: Locator;
  cancelButton: Locator;
  addNodeButton: Locator;
  constructor(page: Page, triggerName: string, collectionName: string) {
    this.page = page;
    this.node = page.getByLabel(`Trigger-${triggerName}`);
    this.nodeTitle = page.getByLabel(`Trigger-${triggerName}`).getByRole('textbox');
    this.nodeConfigure = page.getByLabel(`Trigger-${triggerName}`).getByRole('button', { name: 'Configure' });
    this.collectionDropDown = page
      .getByLabel('block-item-DataSourceCollectionCascader-workflows-Collection')
      .locator('.ant-select-selection-search-input');
    this.relationalDataDropdown = page.getByTestId('select-field-Preload associations');
    this.submitButton = page.getByLabel('action-Action-Submit-workflows');
    this.cancelButton = page.getByLabel('action-Action-Cancel-workflows');
    this.addNodeButton = page.getByLabel('add-button', { exact: true });
  }
}

export class ClculationNode {
  readonly page: Page;
  node: Locator;
  nodeTitle: Locator;
  nodeConfigure: Locator;
  mathCalculationEngine: Locator;
  formulaCalculationEngine: Locator;
  calculationExpression: Locator;
  submitButton: Locator;
  cancelButton: Locator;
  addNodeButton: Locator;
  constructor(page: Page, nodeName: string) {
    this.page = page;
    this.node = page.getByLabel(`Calculation-${nodeName}`, { exact: true });
    this.nodeTitle = page.getByLabel(`Calculation-${nodeName}`, { exact: true }).getByRole('textbox');
    this.nodeConfigure = page
      .getByLabel(`Calculation-${nodeName}`, { exact: true })
      .getByRole('button', { name: 'Configure' });
    this.mathCalculationEngine = page.getByLabel('Math.js');
    this.formulaCalculationEngine = page.getByLabel('Formula.js');
    this.calculationExpression = page.getByLabel('textbox');
    this.submitButton = page.getByLabel('action-Action-Submit-workflows');
    this.cancelButton = page.getByLabel('action-Action-Cancel-workflows');
    this.addNodeButton = page.getByLabel(`add-button-calculation-${nodeName}`, { exact: true });
  }
}

export class QueryRecordNode {
  readonly page: Page;
  node: Locator;
  nodeTitle: Locator;
  nodeConfigure: Locator;
  collectionDropDown: Locator;
  allowMultipleDataBoxesForResults: Locator;
  addSortFieldsButton: Locator;
  pageNumberEditBox: Locator;
  pageNumberVariableButton: Locator;
  pageSizeEditBox: Locator;
  exitProcessOptionsBoxWithEmptyResult: Locator;
  submitButton: Locator;
  cancelButton: Locator;
  addNodeButton: Locator;
  constructor(page: Page, nodeName: string) {
    this.page = page;
    this.node = page.getByLabel(`Query record-${nodeName}`, { exact: true });
    this.nodeTitle = page.getByLabel(`Query record-${nodeName}`, { exact: true }).getByRole('textbox');
    this.nodeConfigure = page
      .getByLabel(`Query record-${nodeName}`, { exact: true })
      .getByRole('button', { name: 'Configure' });
    this.collectionDropDown = page
      .getByLabel('block-item-DataSourceCollectionCascader-workflows-Collection')
      .locator('.ant-select-selection-search-input');
    this.allowMultipleDataBoxesForResults = page.getByLabel('Allow multiple records as');
    this.addSortFieldsButton = page.getByRole('button', { name: 'plus Add sort field' });
    this.pageNumberEditBox = page.getByLabel('variable-constant');
    this.pageNumberVariableButton = page.getByLabel('variable-button');
    this.pageSizeEditBox = page.getByLabel('block-item-InputNumber-workflows-Page size').getByRole('spinbutton');
    this.exitProcessOptionsBoxWithEmptyResult = page.getByLabel('Exit when query result is null');
    this.submitButton = page.getByLabel('action-Action-Submit-workflows');
    this.cancelButton = page.getByLabel('action-Action-Cancel-workflows');
    this.addNodeButton = page.getByLabel(`add-button-query-${nodeName}`, { exact: true });
  }
}

export class CreateRecordNode {
  readonly page: Page;
  node: Locator;
  nodeTitle: Locator;
  nodeConfigure: Locator;
  collectionDropDown: Locator;
  addFieldsButton: Locator;
  submitButton: Locator;
  cancelButton: Locator;
  addNodeButton: Locator;
  constructor(page: Page, nodeName: string) {
    this.page = page;
    this.node = page.getByLabel(`Create record-${nodeName}`, { exact: true });
    this.nodeTitle = page.getByLabel(`Create record-${nodeName}`, { exact: true }).getByRole('textbox');
    this.nodeConfigure = page
      .getByLabel(`Create record-${nodeName}`, { exact: true })
      .getByRole('button', { name: 'Configure' });
    this.collectionDropDown = page
      .getByLabel('block-item-DataSourceCollectionCascader-workflows-Collection')
      .locator('.ant-select-selection-search-input');
    this.addFieldsButton = page.getByRole('button', { name: 'plus Add field' });
    this.submitButton = page.getByLabel('action-Action-Submit-workflows');
    this.cancelButton = page.getByLabel('action-Action-Cancel-workflows');
    this.addNodeButton = page.getByLabel(`add-button-create-${nodeName}`, { exact: true });
  }
}

export class UpdateRecordNode {
  readonly page: Page;
  node: Locator;
  nodeTitle: Locator;
  nodeConfigure: Locator;
  collectionDropDown: Locator;
  batchUpdateModeRadio: Locator;
  articleByArticleUpdateModeRadio: Locator;
  addFieldsButton: Locator;
  submitButton: Locator;
  cancelButton: Locator;
  addNodeButton: Locator;
  constructor(page: Page, nodeName: string) {
    this.page = page;
    this.node = page.getByLabel(`Update record-${nodeName}`, { exact: true });
    this.nodeTitle = page.getByLabel(`Update record-${nodeName}`, { exact: true }).getByRole('textbox');
    this.nodeConfigure = page
      .getByLabel(`Update record-${nodeName}`, { exact: true })
      .getByRole('button', { name: 'Configure' });
    this.collectionDropDown = page
      .getByLabel('block-item-DataSourceCollectionCascader-workflows-Collection')
      .locator('.ant-select-selection-search-input');
    this.batchUpdateModeRadio = page
      .getByLabel('block-item-IndividualHooksRadioWithTooltip-workflows-Update mode')
      .getByLabel('Update in a batch');
    this.articleByArticleUpdateModeRadio = page
      .getByLabel('block-item-IndividualHooksRadioWithTooltip-workflows-Update mode')
      .getByLabel('Update one by one');
    this.addFieldsButton = page.getByRole('button', { name: 'plus Add field' });
    this.submitButton = page.getByLabel('action-Action-Submit-workflows');
    this.cancelButton = page.getByLabel('action-Action-Cancel-workflows');
    this.addNodeButton = page.getByLabel(`add-button-update-${nodeName}`, { exact: true });
  }
}

export class DeleteRecordNode {
  readonly page: Page;
  node: Locator;
  nodeTitle: Locator;
  nodeConfigure: Locator;
  collectionDropDown: Locator;
  submitButton: Locator;
  cancelButton: Locator;
  addNodeButton: Locator;
  constructor(page: Page, nodeName: string) {
    this.page = page;
    this.node = page.getByLabel(`Delete record-${nodeName}`, { exact: true });
    this.nodeTitle = page.getByLabel(`Delete record-${nodeName}`, { exact: true }).getByRole('textbox');
    this.nodeConfigure = page
      .getByLabel(`Delete record-${nodeName}`, { exact: true })
      .getByRole('button', { name: 'Configure' });
    this.collectionDropDown = page
      .getByLabel('block-item-DataSourceCollectionCascader-workflows-Collection')
      .locator('.ant-select-selection-search-input');
    this.submitButton = page.getByLabel('action-Action-Submit-workflows');
    this.cancelButton = page.getByLabel('action-Action-Cancel-workflows');
    this.addNodeButton = page.getByLabel(`add-button-delete-${nodeName}`, { exact: true });
  }
}

export class AggregateNode {
  readonly page: Page;
  node: Locator;
  nodeTitle: Locator;
  nodeConfigure: Locator;
  countRadio: Locator;
  sumRadio: Locator;
  avgRadio: Locator;
  maxRadio: Locator;
  minRadio: Locator;
  dataTableDataRadio: Locator;
  linkedDataTableDataRadio: Locator;
  collectionDropDown: Locator;
  aggregatedFieldDropDown: Locator;
  distinctCheckBox: Locator;
  submitButton: Locator;
  cancelButton: Locator;
  addNodeButton: Locator;
  constructor(page: Page, nodeName: string) {
    this.page = page;
    this.node = page.getByLabel(`Aggregate-${nodeName}`, { exact: true });
    this.nodeTitle = page.getByLabel(`Aggregate-${nodeName}`, { exact: true }).getByRole('textbox');
    this.nodeConfigure = page
      .getByLabel(`Aggregate-${nodeName}`, { exact: true })
      .getByRole('button', { name: 'Configure' });
    this.countRadio = page.getByLabel('COUNT');
    this.sumRadio = page.getByLabel('SUM', { exact: true });
    this.avgRadio = page.getByLabel('AVG', { exact: true });
    this.maxRadio = page.getByLabel('MAX', { exact: true });
    this.minRadio = page.getByLabel('MIN', { exact: true });
    this.dataTableDataRadio = page.getByLabel('Data of collection');
    this.linkedDataTableDataRadio = page.getByLabel('Data of associated collection');
    this.collectionDropDown = page
      .getByLabel('block-item-DataSourceCollectionCascader-workflows-Data of collection')
      .locator('.ant-select-selection-search-input');
    this.aggregatedFieldDropDown = page
      .getByLabel('block-item-FieldsSelect-workflows-Field to aggregate')
      .locator('.ant-select-selection-search-input');
    this.distinctCheckBox = page
      .getByLabel('block-item-Checkbox-workflows-Distinct')
      .locator('input.ant-checkbox-input[type="checkbox"]');
    this.submitButton = page.getByLabel('action-Action-Submit-workflows');
    this.cancelButton = page.getByLabel('action-Action-Cancel-workflows');
    this.addNodeButton = page.getByLabel(`add-button-aggregate-${nodeName}`, { exact: true });
  }
}

export class ManualNode {
  readonly page: Page;
  node: Locator;
  nodeTitle: Locator;
  nodeConfigure: Locator;
  assigneesDropDown: Locator;
  configureUserInterfaceButton: Locator;
  addBlockButton: Locator;
  triggerDataMenu: Locator;
  nodeDataMenu: Locator;
  customFormMenu: Locator;
  createRecordFormMenu: Locator;
  updateRecordFormMenu: Locator;
  submitButton: Locator;
  cancelButton: Locator;
  addNodeButton: Locator;
  constructor(page: Page, nodeName: string) {
    this.page = page;
    this.node = page.getByLabel(`Manual-${nodeName}`, { exact: true });
    this.nodeTitle = page.getByLabel(`Manual-${nodeName}`, { exact: true }).getByRole('textbox');
    this.nodeConfigure = page
      .getByLabel(`Manual-${nodeName}`, { exact: true })
      .getByRole('button', { name: 'Configure' });
    this.assigneesDropDown = page.getByTestId('select-single');
    this.configureUserInterfaceButton = page.getByRole('button', { name: 'Configure user interface' });
    this.addBlockButton = page.getByLabel(
      'schema-initializer-Grid-workflowManual:popup:configureUserInterface:addBlock-workflows',
    );
    this.triggerDataMenu = page.getByRole('menuitem', { name: 'Trigger data' });
    this.nodeDataMenu = page.getByRole('menuitem', { name: 'Node result right' });
    this.customFormMenu = page.getByRole('menuitem', { name: 'Custom form' });
    this.createRecordFormMenu = page.getByRole('menuitem', { name: 'Create record form right' });
    this.updateRecordFormMenu = page.getByRole('menuitem', { name: 'Update record form right' });
    this.submitButton = page.getByLabel('action-Action-Submit-workflows');
    this.cancelButton = page.getByLabel('action-Action-Cancel-workflows');
    this.addNodeButton = page.getByLabel(`add-button-manual-${nodeName}`, { exact: true });
  }
}

export class ConditionYesNode {
  readonly page: Page;
  node: Locator;
  nodeTitle: Locator;
  nodeConfigure: Locator;
  basicRadio: Locator;
  mathRadio: Locator;
  formulaRadio: Locator;
  conditionExpressionEditBox: Locator;
  submitButton: Locator;
  cancelButton: Locator;
  addNodeButton: Locator;
  constructor(page: Page, nodeName: string) {
    this.page = page;
    this.node = page.getByLabel(`Condition-${nodeName}`, { exact: true });
    this.nodeTitle = page.getByLabel(`Condition-${nodeName}`, { exact: true }).getByRole('textbox');
    this.nodeConfigure = page
      .getByLabel(`Condition-${nodeName}`, { exact: true })
      .getByRole('button', { name: 'Configure' });
    this.conditionExpressionEditBox = page.getByLabel('textbox');
    // await page.getByLabel('variable-constant').first().click();
    // await page.getByLabel('variable-button').first().click();
    // await page.getByLabel('select-operator-calc').first().click();
    // await page.getByRole('option', { name: '=' }).click();
    // await page.getByLabel('variable-constant').nth(1).click();
    // await page.getByLabel('variable-button').nth(1).click();
    this.basicRadio = page.getByLabel('Basic');
    this.mathRadio = page.getByLabel('Math.js');
    this.formulaRadio = page.getByLabel('Formula.js');
    this.submitButton = page.getByLabel('action-Action-Submit-workflows');
    this.cancelButton = page.getByLabel('action-Action-Cancel-workflows');
    this.addNodeButton = page.getByLabel(`add-button-condition-${nodeName}`, { exact: true });
  }
}

export class ConditionBranchNode {
  readonly page: Page;
  node: Locator;
  nodeTitle: Locator;
  nodeConfigure: Locator;
  basicRadio: Locator;
  mathRadio: Locator;
  formulaRadio: Locator;
  conditionExpressionEditBox: Locator;
  submitButton: Locator;
  cancelButton: Locator;
  addNoBranchNode: Locator;
  addYesBranchNode: Locator;
  addNodeButton: Locator;
  constructor(page: Page, nodeName: string) {
    this.page = page;
    this.node = page.getByLabel(`Condition-${nodeName}`, { exact: true });
    this.nodeTitle = page.getByLabel(`Condition-${nodeName}`, { exact: true }).getByRole('textbox');
    this.nodeConfigure = page
      .getByLabel(`Condition-${nodeName}`, { exact: true })
      .getByRole('button', { name: 'Configure' });
    this.conditionExpressionEditBox = page.getByLabel('textbox');
    this.submitButton = page.getByLabel('action-Action-Submit-workflows');
    this.cancelButton = page.getByLabel('action-Action-Cancel-workflows');
    this.addNodeButton = page.getByLabel(`add-button-condition-${nodeName}`, { exact: true });
    this.basicRadio = page.getByLabel('Basic');
    this.mathRadio = page.getByLabel('Math.js');
    this.formulaRadio = page.getByLabel('Formula.js');
    this.addNoBranchNode = page.getByLabel(`add-button-condition-${nodeName}-0`);
    this.addYesBranchNode = page.getByLabel(`add-button-condition-${nodeName}-1`);
  }
}

export class SQLNode {
  readonly page: Page;
  node: Locator;
  nodeTitle: Locator;
  nodeConfigure: Locator;
  sqlEditBox: Locator;
  submitButton: Locator;
  cancelButton: Locator;
  addNodeButton: Locator;
  constructor(page: Page, nodeName: string) {
    this.page = page;
    this.node = page.getByLabel(`SQL action-${nodeName}`, { exact: true });
    this.nodeTitle = page.getByLabel(`SQL action-${nodeName}`, { exact: true }).getByRole('textbox');
    this.nodeConfigure = page
      .getByLabel(`SQL action-${nodeName}`, { exact: true })
      .getByRole('button', { name: 'Configure' });
    this.sqlEditBox = page.getByLabel('block-item-WorkflowVariableRawTextArea-workflows-SQL').getByRole('textbox');
    this.submitButton = page.getByLabel('action-Action-Submit-workflows');
    this.cancelButton = page.getByLabel('action-Action-Cancel-workflows');
    this.addNodeButton = page.getByLabel(`add-button-sql-${nodeName}`, { exact: true });
  }
}

export class ParallelBranchNode {
  readonly page: Page;
  node: Locator;
  nodeTitle: Locator;
  nodeConfigure: Locator;
  addBranchButton: Locator;
  allSucceededRadio: Locator;
  anySucceededRadio: Locator;
  anySucceededOrFailedRadio: Locator;
  submitButton: Locator;
  cancelButton: Locator;
  addNodeButton: Locator;
  constructor(page: Page, nodeName: string) {
    this.page = page;
    this.node = page.getByLabel(`Parallel branch-${nodeName}`, { exact: true });
    this.nodeTitle = page.locator('textarea').filter({ hasText: nodeName });
    this.nodeConfigure = page.getByLabel(`Parallel branch-${nodeName}`).getByRole('button', { name: 'Configure' });
    this.addBranchButton = page.getByLabel(`add-button-parallel-${nodeName}-add-branch`, { exact: true });
    this.allSucceededRadio = page.getByLabel('All succeeded', { exact: true });
    this.anySucceededRadio = page.getByLabel('Any succeeded', { exact: true });
    this.anySucceededOrFailedRadio = page.getByLabel('Any succeeded or failed', { exact: true });
    this.submitButton = page.getByLabel('action-Action-Submit-workflows');
    this.cancelButton = page.getByLabel('action-Action-Cancel-workflows');
    this.addNodeButton = page.getByLabel(`add-button-parallel-${nodeName}`, { exact: true });
  }
}

export default module.exports = {
  CreateWorkFlow,
  EditWorkFlow,
  WorkflowManagement,
  WorkflowListRecords,
  ApprovalTriggerNode,
  ApprovalPassthroughModeNode,
  ScheduleTriggerNode,
  CollectionTriggerNode,
  FormEventTriggerNode,
  ClculationNode,
  QueryRecordNode,
  CreateRecordNode,
  UpdateRecordNode,
  DeleteRecordNode,
  AggregateNode,
  ManualNode,
  ConditionYesNode,
  ConditionBranchNode,
  SQLNode,
  ParallelBranchNode,
};
