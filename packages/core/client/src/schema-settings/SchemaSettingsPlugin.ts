import { Plugin } from '../application/Plugin';
import { filterCollapseBlockSettings } from '../modules/collapse-filter/schemaSettings';
import { multiDataDetailsBlockSettings } from '../modules/details-multi-data/schemaSettings';
import { singleDataDetailsBlockSettings } from '../modules/details-single-data/schemaSettings';
import {
  creationFormBlockFieldSettings,
  creationFormBlockSettings,
  customizeSaveRecordActionSettings,
  customizeSubmitToWorkflowActionSettings,
  datePickerComponentFieldSettings,
  recordPickerComponentFieldSettings,
  selectComponentFieldSettings,
  subformComponentFieldSettings,
  subformPopoverComponentFieldSettings,
  submitActionSettings,
  subtablePopoverComponentFieldSettings,
} from '../modules/form-creation/schemaSettings';
import { editFormBlockSettings } from '../modules/form-edit/schemaSettings';
import { filterFormBlockSettings } from '../modules/form-filter/schemaSettings';
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
  viewActionSettings,
} from '../modules/table/schemaSettings';

export class SchemaSettingsPlugin extends Plugin {
  async load() {
    // block settings
    this.schemaSettingsManager.add(tableBlockSettings);
    this.schemaSettingsManager.add(creationFormBlockSettings);
    this.schemaSettingsManager.add(editFormBlockSettings);
    this.schemaSettingsManager.add(filterFormBlockSettings);
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
  }
}
