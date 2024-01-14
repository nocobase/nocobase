import { Plugin } from '../application/Plugin';
import { filterCollapseBlockSettings } from '../modules/collapse-filter/schemaSettings';
import { multiDataDetailsBlockSettings } from '../modules/details-multi-data/schemaSettings';
import {
  detailsBlockFieldSettings,
  singleDataDetailsBlockSettings,
} from '../modules/details-single-data/schemaSettings';
import {
  attachmentComponentFieldSettings,
  cascadeSelectComponentFieldSettings,
  creationFormBlockFieldSettings,
  creationFormBlockSettings,
  customizeSaveRecordActionSettings,
  customizeSubmitToWorkflowActionSettings,
  datePickerComponentFieldSettings,
  fileManagerComponentFieldSettings,
  recordPickerComponentFieldSettings,
  selectComponentFieldSettings,
  subformComponentFieldSettings,
  subformPopoverComponentFieldSettings,
  submitActionSettings,
  subtablePopoverComponentFieldSettings,
  tagComponentFieldSettings,
} from '../modules/form-creation/schemaSettings';
import { editFormBlockFieldSettings, editFormBlockSettings } from '../modules/form-edit/schemaSettings';
import { filterFormBlockFieldSettings, filterFormBlockSettings } from '../modules/form-filter/schemaSettings';
import { gridCardBlockSettings } from '../modules/grid-card/schemaSettings';
import { listBlockSettings } from '../modules/list/schemaSettings';
import { markdownBlockSettings } from '../modules/markdown/schemaSettings';
import { dataSelectorBlockSettings } from '../modules/table-data-selector/schemaSettings';
import {
  addNewActionSettings,
  bulkDeleteActionSettings,
  columnCascaderComponentFieldSettings,
  columnCheckboxComponentFieldSettings,
  columnCheckboxGroupComponentFieldSettings,
  columnCollectionSelectComponentFieldSettings,
  columnColorPickerComponentFieldSettings,
  columnDatePickerComponentFieldSettings,
  columnFormulaResultComponentFieldSettings,
  columnIconPickerComponentFieldSettings,
  columnInputComponentFieldSettings,
  columnInputJSONComponentFieldSettings,
  columnInputNumberComponentFieldSettings,
  columnInputTextAreaComponentFieldSettings,
  columnInputURLComponentFieldSettings,
  columnMarkdownComponentFieldSettings,
  columnPasswordComponentFieldSettings,
  columnPercentComponentFieldSettings,
  columnRadioGroupComponentFieldSettings,
  columnRichTextComponentFieldSettings,
  columnSelectComponentFieldSettings,
  columnTagComponentFieldSettings,
  columnTimePickerComponentFieldSettings,
  columnUploadAttachmentComponentFieldSettings,
  customizeAddRecordActionSettings,
  customizePopupActionSettings,
  customizeUpdateRecordActionSettings,
  deleteActionSettings,
  editActionSettings,
  filterActionSettings,
  refreshActionSettings,
  tableBlockColumnSettings,
  tableBlockSettings,
  viewActionSettings,
} from '../modules/table/schemaSettings';

export class SchemaSettingsPlugin extends Plugin {
  async load() {
    // block settings
    this.schemaSettingsManager.add(tableBlockSettings);
    this.schemaSettingsManager.add(creationFormBlockSettings);
    this.schemaSettingsManager.add(editFormBlockSettings);
    this.schemaSettingsManager.add(filterFormBlockSettings);
    this.schemaSettingsManager.add(filterFormBlockFieldSettings);
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
    this.schemaSettingsManager.add(creationFormBlockFieldSettings);
    this.schemaSettingsManager.add(selectComponentFieldSettings);
    this.schemaSettingsManager.add(recordPickerComponentFieldSettings);
    this.schemaSettingsManager.add(subformComponentFieldSettings);
    this.schemaSettingsManager.add(subformPopoverComponentFieldSettings);
    this.schemaSettingsManager.add(subtablePopoverComponentFieldSettings);
    this.schemaSettingsManager.add(datePickerComponentFieldSettings);
    this.schemaSettingsManager.add(fileManagerComponentFieldSettings);
    this.schemaSettingsManager.add(tagComponentFieldSettings);
    this.schemaSettingsManager.add(cascadeSelectComponentFieldSettings);
    this.schemaSettingsManager.add(attachmentComponentFieldSettings);
    this.schemaSettingsManager.add(editFormBlockFieldSettings);
    this.schemaSettingsManager.add(detailsBlockFieldSettings);
    this.schemaSettingsManager.add(tableBlockColumnSettings);

    // column settings
    this.schemaSettingsManager.add(columnPercentComponentFieldSettings);
    this.schemaSettingsManager.add(columnIconPickerComponentFieldSettings);
    this.schemaSettingsManager.add(columnColorPickerComponentFieldSettings);
    this.schemaSettingsManager.add(columnPasswordComponentFieldSettings);
    this.schemaSettingsManager.add(columnInputNumberComponentFieldSettings);
    this.schemaSettingsManager.add(columnInputURLComponentFieldSettings);
    this.schemaSettingsManager.add(columnInputComponentFieldSettings);
    this.schemaSettingsManager.add(columnInputTextAreaComponentFieldSettings);
    this.schemaSettingsManager.add(columnCollectionSelectComponentFieldSettings);
    this.schemaSettingsManager.add(columnInputJSONComponentFieldSettings);
    this.schemaSettingsManager.add(columnFormulaResultComponentFieldSettings);
    this.schemaSettingsManager.add(columnTimePickerComponentFieldSettings);
    this.schemaSettingsManager.add(columnDatePickerComponentFieldSettings);
    this.schemaSettingsManager.add(columnUploadAttachmentComponentFieldSettings);
    this.schemaSettingsManager.add(columnRichTextComponentFieldSettings);
    this.schemaSettingsManager.add(columnMarkdownComponentFieldSettings);
    this.schemaSettingsManager.add(columnSelectComponentFieldSettings);
    this.schemaSettingsManager.add(columnRadioGroupComponentFieldSettings);
    this.schemaSettingsManager.add(columnCascaderComponentFieldSettings);
    this.schemaSettingsManager.add(columnCheckboxGroupComponentFieldSettings);
    this.schemaSettingsManager.add(columnCheckboxComponentFieldSettings);
    this.schemaSettingsManager.add(columnTagComponentFieldSettings);
  }
}
