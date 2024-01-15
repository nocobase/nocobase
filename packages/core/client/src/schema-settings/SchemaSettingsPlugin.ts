import { Plugin } from '../application/Plugin';
import { filterCollapseBlockSettings } from '../modules/collapse-filter/schemaSettings';
import { multiDataDetailsBlockSettings } from '../modules/details-multi-data/schemaSettings';
import { singleDataDetailsBlockSettings } from '../modules/details-single-data/schemaSettings';
import {
  cascadeSelectComponentFieldSettings,
  cascaderComponentFieldSettings,
  checkboxComponentFieldSettings,
  checkboxGroupComponentFieldSettings,
  collectionSelectComponentFieldSettings,
  colorPickerComponentFieldSettings,
  creationFormBlockSettings,
  customizeSaveRecordActionSettings,
  customizeSubmitToWorkflowActionSettings,
  datePickerComponentFieldSettings,
  fileManagerComponentFieldSettings,
  formItemFieldSettings,
  formulaResultComponentFieldSettings,
  iconPickerComponentFieldSettings,
  inputComponentFieldSettings,
  inputJSONComponentFieldSettings,
  inputNumberComponentFieldSettings,
  inputTextAreaComponentFieldSettings,
  inputURLComponentFieldSettings,
  markdownComponentFieldSettings,
  passwordComponentFieldSettings,
  percentComponentFieldSettings,
  radioGroupComponentFieldSettings,
  recordPickerComponentFieldSettings,
  richTextComponentFieldSettings,
  selectComponentFieldSettings,
  subformComponentFieldSettings,
  subformPopoverComponentFieldSettings,
  submitActionSettings,
  subtablePopoverComponentFieldSettings,
  tagComponentFieldSettings,
  timePickerComponentFieldSettings,
  uploadAttachmentComponentFieldSettings,
} from '../modules/form-creation/schemaSettings';
import { editFormBlockSettings } from '../modules/form-edit/schemaSettings';
import { filterFormBlockSettings, filterFormItemFieldSettings } from '../modules/form-filter/schemaSettings';
import { gridCardBlockSettings } from '../modules/grid-card/schemaSettings';
import { listBlockSettings } from '../modules/list/schemaSettings';
import { markdownBlockSettings } from '../modules/markdown/schemaSettings';
import { dataSelectorBlockSettings } from '../modules/table-data-selector/schemaSettings';
import {
  addNewActionSettings,
  bulkDeleteActionSettings,
  customizeAddRecordActionSettings,
  customizePopupActionSettings,
  customizeUpdateRecordActionSettings,
  deleteActionSettings,
  editActionSettings,
  filterActionSettings,
  refreshActionSettings,
  tableBlockSettings,
  tableColumnSettings,
  viewActionSettings,
} from '../modules/table/schemaSettings';

export class SchemaSettingsPlugin extends Plugin {
  async load() {
    // block settings
    this.schemaSettingsManager.add(tableBlockSettings);
    this.schemaSettingsManager.add(creationFormBlockSettings);
    this.schemaSettingsManager.add(editFormBlockSettings);
    this.schemaSettingsManager.add(filterFormBlockSettings);
    this.schemaSettingsManager.add(filterFormItemFieldSettings);
    this.schemaSettingsManager.add(multiDataDetailsBlockSettings);
    this.schemaSettingsManager.add(singleDataDetailsBlockSettings);
    this.schemaSettingsManager.add(dataSelectorBlockSettings);
    this.schemaSettingsManager.add(listBlockSettings);
    this.schemaSettingsManager.add(gridCardBlockSettings);
    this.schemaSettingsManager.add(filterCollapseBlockSettings);
    this.schemaSettingsManager.add(markdownBlockSettings);

    // action settings
    this.schemaSettingsManager.add(addNewActionSettings);
    this.schemaSettingsManager.add(filterActionSettings);
    this.schemaSettingsManager.add(refreshActionSettings);
    this.schemaSettingsManager.add(viewActionSettings);
    this.schemaSettingsManager.add(editActionSettings);
    this.schemaSettingsManager.add(deleteActionSettings);
    this.schemaSettingsManager.add(bulkDeleteActionSettings);
    this.schemaSettingsManager.add(customizeAddRecordActionSettings);
    this.schemaSettingsManager.add(customizePopupActionSettings);
    this.schemaSettingsManager.add(customizeUpdateRecordActionSettings);
    this.schemaSettingsManager.add(submitActionSettings);
    this.schemaSettingsManager.add(customizeSaveRecordActionSettings);
    this.schemaSettingsManager.add(customizeSubmitToWorkflowActionSettings);

    // field settings
    this.schemaSettingsManager.add(formItemFieldSettings);
    this.schemaSettingsManager.add(tableColumnSettings);

    // field component settings
    this.schemaSettingsManager.add(selectComponentFieldSettings);
    this.schemaSettingsManager.add(recordPickerComponentFieldSettings);
    this.schemaSettingsManager.add(subformComponentFieldSettings);
    this.schemaSettingsManager.add(subformPopoverComponentFieldSettings);
    this.schemaSettingsManager.add(subtablePopoverComponentFieldSettings);
    this.schemaSettingsManager.add(datePickerComponentFieldSettings);
    this.schemaSettingsManager.add(fileManagerComponentFieldSettings);
    this.schemaSettingsManager.add(tagComponentFieldSettings);
    this.schemaSettingsManager.add(cascadeSelectComponentFieldSettings);
    this.schemaSettingsManager.add(uploadAttachmentComponentFieldSettings);
    this.schemaSettingsManager.add(percentComponentFieldSettings);
    this.schemaSettingsManager.add(iconPickerComponentFieldSettings);
    this.schemaSettingsManager.add(colorPickerComponentFieldSettings);
    this.schemaSettingsManager.add(passwordComponentFieldSettings);
    this.schemaSettingsManager.add(inputNumberComponentFieldSettings);
    this.schemaSettingsManager.add(inputURLComponentFieldSettings);
    this.schemaSettingsManager.add(inputComponentFieldSettings);
    this.schemaSettingsManager.add(inputTextAreaComponentFieldSettings);
    this.schemaSettingsManager.add(collectionSelectComponentFieldSettings);
    this.schemaSettingsManager.add(inputJSONComponentFieldSettings);
    this.schemaSettingsManager.add(formulaResultComponentFieldSettings);
    this.schemaSettingsManager.add(timePickerComponentFieldSettings);
    this.schemaSettingsManager.add(richTextComponentFieldSettings);
    this.schemaSettingsManager.add(markdownComponentFieldSettings);
    this.schemaSettingsManager.add(radioGroupComponentFieldSettings);
    this.schemaSettingsManager.add(cascaderComponentFieldSettings);
    this.schemaSettingsManager.add(checkboxGroupComponentFieldSettings);
    this.schemaSettingsManager.add(checkboxComponentFieldSettings);
  }
}
