import { Plugin } from '../application/Plugin';
import { addChildActionSettings } from '../modules/actions/add-child/addChildActionSettings';
import { addNewActionSettings } from '../modules/actions/add-new/addNewActionSettings';
import { customizeAddRecordActionSettings } from '../modules/actions/add-record/customizeAddRecordActionSettings';
import { bulkDeleteActionSettings } from '../modules/actions/bulk-destroy/bulkDeleteActionSettings';
import { deleteActionSettings } from '../modules/actions/delete/deleteActionSettings';
import { expendableActionSettings } from '../modules/actions/expand-collapse/expendableActionSettings';
import { filterActionSettings } from '../modules/actions/filter/filterActionSettings';
import { refreshActionSettings } from '../modules/actions/refresh/refreshActionSettings';
import { customizeSaveRecordActionSettings } from '../modules/actions/save-record/customizeSaveRecordActionSettings';
import { createSubmitActionSettings } from '../modules/actions/submit/createSubmitActionSettings';
import { submitActionSettings, updateSubmitActionSettings } from '../modules/actions/submit/updateSubmitActionSettings';
import { customizeUpdateRecordActionSettings } from '../modules/actions/update-record/customizeUpdateRecordActionSettings';
import { customizePopupActionSettings } from '../modules/actions/view-edit-popup/customizePopupActionSettings';
import { editActionSettings } from '../modules/actions/view-edit-popup/editActionSettings';
import { viewActionSettings } from '../modules/actions/view-edit-popup/viewActionSettings';
import { multiDataDetailsBlockSettings } from '../modules/blocks/data-blocks/details-multi/multiDataDetailsBlockSettings';
import { singleDataDetailsBlockSettings } from '../modules/blocks/data-blocks/details-single/singleDataDetailsBlockSettings';
import {
  createFormBlockSettings,
  creationFormBlockSettings,
} from '../modules/blocks/data-blocks/form/createFormBlockSettings';
import { editFormBlockSettings } from '../modules/blocks/data-blocks/form/editFormBlockSettings';
import { fieldSettingsFormItem } from '../modules/blocks/data-blocks/form/fieldSettingsFormItem';
import { gridCardBlockSettings } from '../modules/blocks/data-blocks/grid-card/gridCardBlockSettings';
import { listBlockSettings } from '../modules/blocks/data-blocks/list/listBlockSettings';
import { tableSelectorBlockSettings } from '../modules/blocks/data-blocks/table-selector/tableSelectorBlockSettings';
import { tableBlockSettings } from '../modules/blocks/data-blocks/table/tableBlockSettings';
import { tableColumnSettings } from '../modules/blocks/data-blocks/table/tableColumnSettings';
import { filterCollapseBlockSettings } from '../modules/blocks/filter-blocks/collapse/filterCollapseBlockSettings';
import { filterCollapseItemFieldSettings } from '../modules/blocks/filter-blocks/collapse/filterCollapseItemFieldSettings';
import { filterFormBlockSettings } from '../modules/blocks/filter-blocks/form/filterFormBlockSettings';
import { filterFormItemFieldSettings } from '../modules/blocks/filter-blocks/form/filterFormItemFieldSettings';
import { markdownBlockSettings } from '../modules/blocks/other-blocks/markdown/markdownBlockSettings';
import { cascadeSelectComponentFieldSettings } from '../modules/fields/component/CascadeSelect/cascadeSelectComponentFieldSettings';
import { datePickerComponentFieldSettings } from '../modules/fields/component/DatePicker/datePickerComponentFieldSettings';
import { fileManagerComponentFieldSettings } from '../modules/fields/component/FileManager/fileManagerComponentFieldSettings';
import { uploadAttachmentComponentFieldSettings } from '../modules/fields/component/FileManager/uploadAttachmentComponentFieldSettings';
import { subformComponentFieldSettings } from '../modules/fields/component/Nester/subformComponentFieldSettings';
import { recordPickerComponentFieldSettings } from '../modules/fields/component/Picker/recordPickerComponentFieldSettings';
import { subformPopoverComponentFieldSettings } from '../modules/fields/component/PopoverNester/subformPopoverComponentFieldSettings';
import { selectComponentFieldSettings } from '../modules/fields/component/Select/selectComponentFieldSettings';
import { subTablePopoverComponentFieldSettings } from '../modules/fields/component/SubTable/subTablePopoverComponentFieldSettings';
import { tagComponentFieldSettings } from '../modules/fields/component/Tag/tagComponentFieldSettings';

export class SchemaSettingsPlugin extends Plugin {
  async load() {
    // block settings
    this.schemaSettingsManager.add(tableBlockSettings);
    this.schemaSettingsManager.add(creationFormBlockSettings);
    this.schemaSettingsManager.add(createFormBlockSettings);
    this.schemaSettingsManager.add(editFormBlockSettings);
    this.schemaSettingsManager.add(filterFormBlockSettings);
    this.schemaSettingsManager.add(filterFormItemFieldSettings);
    this.schemaSettingsManager.add(multiDataDetailsBlockSettings);
    this.schemaSettingsManager.add(singleDataDetailsBlockSettings);
    this.schemaSettingsManager.add(tableSelectorBlockSettings);
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
    this.schemaSettingsManager.add(createSubmitActionSettings);
    this.schemaSettingsManager.add(updateSubmitActionSettings);
    this.schemaSettingsManager.add(submitActionSettings);
    this.schemaSettingsManager.add(customizeSaveRecordActionSettings);
    this.schemaSettingsManager.add(addChildActionSettings);
    this.schemaSettingsManager.add(expendableActionSettings);

    // field settings
    this.schemaSettingsManager.add(fieldSettingsFormItem);
    this.schemaSettingsManager.add(tableColumnSettings);
    this.schemaSettingsManager.add(filterCollapseItemFieldSettings);

    // field component settings
    this.schemaSettingsManager.add(selectComponentFieldSettings);
    this.schemaSettingsManager.add(recordPickerComponentFieldSettings);
    this.schemaSettingsManager.add(subformComponentFieldSettings);
    this.schemaSettingsManager.add(subformPopoverComponentFieldSettings);
    this.schemaSettingsManager.add(subTablePopoverComponentFieldSettings);
    this.schemaSettingsManager.add(datePickerComponentFieldSettings);
    this.schemaSettingsManager.add(fileManagerComponentFieldSettings);
    this.schemaSettingsManager.add(tagComponentFieldSettings);
    this.schemaSettingsManager.add(cascadeSelectComponentFieldSettings);
    this.schemaSettingsManager.add(uploadAttachmentComponentFieldSettings);
  }
}
