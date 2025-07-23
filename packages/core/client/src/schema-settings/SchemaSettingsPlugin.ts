/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '../application/Plugin';
import { addChildActionSettings } from '../modules/actions/add-child/addChildActionSettings';
import { addNewActionSettings } from '../modules/actions/add-new/addNewActionSettings';
import { customizeAddRecordActionSettings } from '../modules/actions/add-record/customizeAddRecordActionSettings';
import { associateActionSettings } from '../modules/actions/associate/associateActionSettings';
import { bulkDeleteActionSettings } from '../modules/actions/bulk-destroy/bulkDeleteActionSettings';
import { deleteActionSettings } from '../modules/actions/delete/deleteActionSettings';
import { disassociateActionSettings } from '../modules/actions/disassociate/disassociateActionSettings';

import { expendableActionSettings } from '../modules/actions/expand-collapse/expendableActionSettings';
import { filterActionSettings } from '../modules/actions/filter/filterActionSettings';
import { customizeLinkActionSettings } from '../modules/actions/link/customizeLinkActionSettings';
import { refreshActionSettings } from '../modules/actions/refresh/refreshActionSettings';
import { editTableActionSettings } from '../modules/actions/edit-table/editTableActionSettings';
import { customizeSaveRecordActionSettings } from '../modules/actions/save-record/customizeSaveRecordActionSettings';
import { createSubmitActionSettings } from '../modules/actions/submit/createSubmitActionSettings';
import { submitActionSettings, updateSubmitActionSettings } from '../modules/actions/submit/updateSubmitActionSettings';
import { customizeUpdateRecordActionSettings } from '../modules/actions/update-record/customizeUpdateRecordActionSettings';
import { customizePopupActionSettings } from '../modules/actions/view-edit-popup/customizePopupActionSettings';

import { editActionSettings } from '../modules/actions/view-edit-popup/editActionSettings';
import { viewActionSettings } from '../modules/actions/view-edit-popup/viewActionSettings';
import {
  detailsWithPaginationSettings,
  multiDataDetailsBlockSettings,
} from '../modules/blocks/data-blocks/details-multi/detailsWithPaginationSettings';
import {
  detailsBlockSettings,
  singleDataDetailsBlockSettings,
} from '../modules/blocks/data-blocks/details-single/detailsBlockSettings';
import { createFormBlockSettings } from '../modules/blocks/data-blocks/form/createFormBlockSettings';
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
import {
  datePickerComponentFieldSettings,
  rangePickerPickerComponentFieldSettings,
} from '../modules/fields/component/DatePicker/datePickerComponentFieldSettings';
import { fileManagerComponentFieldSettings } from '../modules/fields/component/FileManager/fileManagerComponentFieldSettings';
import { previewComponentFieldSettings } from '../modules/fields/component/FileManager/previewComponentFieldSettings';
import { uploadAttachmentComponentFieldSettings } from '../modules/fields/component/FileManager/uploadAttachmentComponentFieldSettings';
import { inputJSONSettings } from '../modules/fields/component/Input.JSON/inputJSONSettings';
import { inputPreviewComponentFieldSettings } from '../modules/fields/component/Input.Preview/settings';
import { inputTextAreaSettings } from '../modules/fields/component/Input.TextArea/inputTextAreaSettings';
import { inputURLSettings } from '../modules/fields/component/Input.URL/inputURLSettings';
import { inputComponentSettings } from '../modules/fields/component/Input/inputComponentSettings';
import { markdownSettings } from '../modules/fields/component/Markdown/markdownSettings';
import { markdownVditorSettings } from '../modules/fields/component/MarkdownVditor/markdownVditorSettings';
import { richTextSettings } from '../modules/fields/component/RichText/richTextSettings';
// import { inputURLComponentFieldSettings } from '../modules/fields/component/Input.URL/settings';
import { dividerSettings } from '../modules/blocks/other-blocks/divider/dividerSettings';
import { inputNumberComponentFieldSettings } from '../modules/fields/component/InputNumber/inputNumberComponentFieldSettings';
import { subformComponentFieldSettings } from '../modules/fields/component/Nester/subformComponentFieldSettings';
import {
  filterRecordPickerComponentFieldSettings,
  recordPickerComponentFieldSettings,
} from '../modules/fields/component/Picker/recordPickerComponentFieldSettings';
import { subformPopoverComponentFieldSettings } from '../modules/fields/component/PopoverNester/subformPopoverComponentFieldSettings';
import {
  filterSelectComponentFieldSettings,
  selectComponentFieldSettings,
} from '../modules/fields/component/Select/selectComponentFieldSettings';
import { subTablePopoverComponentFieldSettings } from '../modules/fields/component/SubTable/subTablePopoverComponentFieldSettings';
import { tagComponentFieldSettings } from '../modules/fields/component/Tag/tagComponentFieldSettings';
import { timePickerComponentFieldSettings } from '../modules/fields/component/TimePicker/timePickerComponentFieldSettings';
import { unixTimestampComponentFieldSettings } from '../modules/fields/component/UnixTimestamp/unixTimestampComponentFieldSettings';
import { menuItemSettings } from '../route-switch/antd/admin-layout/menuItemSettings';
export class SchemaSettingsPlugin extends Plugin {
  async load() {
    // block settings
    this.schemaSettingsManager.add(tableBlockSettings);
    this.schemaSettingsManager.add(createFormBlockSettings);
    this.schemaSettingsManager.add(editFormBlockSettings);
    this.schemaSettingsManager.add(filterFormBlockSettings);
    this.schemaSettingsManager.add(filterFormItemFieldSettings);
    this.schemaSettingsManager.add(multiDataDetailsBlockSettings);
    this.schemaSettingsManager.add(detailsWithPaginationSettings);
    this.schemaSettingsManager.add(singleDataDetailsBlockSettings);
    this.schemaSettingsManager.add(detailsBlockSettings);
    this.schemaSettingsManager.add(tableSelectorBlockSettings);
    this.schemaSettingsManager.add(listBlockSettings);
    this.schemaSettingsManager.add(gridCardBlockSettings);
    this.schemaSettingsManager.add(filterCollapseBlockSettings);
    this.schemaSettingsManager.add(markdownBlockSettings);

    // action settings
    this.schemaSettingsManager.add(addNewActionSettings);
    this.schemaSettingsManager.add(filterActionSettings);
    this.schemaSettingsManager.add(refreshActionSettings);
    this.schemaSettingsManager.add(editTableActionSettings);
    this.schemaSettingsManager.add(viewActionSettings);
    this.schemaSettingsManager.add(editActionSettings);
    this.schemaSettingsManager.add(deleteActionSettings);
    this.schemaSettingsManager.add(disassociateActionSettings);
    this.schemaSettingsManager.add(associateActionSettings);
    this.schemaSettingsManager.add(bulkDeleteActionSettings);
    this.schemaSettingsManager.add(customizeAddRecordActionSettings);
    this.schemaSettingsManager.add(customizePopupActionSettings);
    this.schemaSettingsManager.add(customizeLinkActionSettings);
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
    this.schemaSettingsManager.add(filterSelectComponentFieldSettings);
    this.schemaSettingsManager.add(recordPickerComponentFieldSettings);
    this.schemaSettingsManager.add(filterRecordPickerComponentFieldSettings);
    this.schemaSettingsManager.add(subformComponentFieldSettings);
    this.schemaSettingsManager.add(subformPopoverComponentFieldSettings);
    this.schemaSettingsManager.add(subTablePopoverComponentFieldSettings);
    this.schemaSettingsManager.add(datePickerComponentFieldSettings);
    this.schemaSettingsManager.add(rangePickerPickerComponentFieldSettings);
    this.schemaSettingsManager.add(unixTimestampComponentFieldSettings);
    this.schemaSettingsManager.add(inputNumberComponentFieldSettings);
    this.schemaSettingsManager.add(inputComponentSettings);
    this.schemaSettingsManager.add(inputURLSettings);
    this.schemaSettingsManager.add(inputTextAreaSettings);
    this.schemaSettingsManager.add(inputJSONSettings);
    this.schemaSettingsManager.add(markdownSettings);
    this.schemaSettingsManager.add(markdownVditorSettings);
    this.schemaSettingsManager.add(richTextSettings);
    this.schemaSettingsManager.add(fileManagerComponentFieldSettings);
    this.schemaSettingsManager.add(tagComponentFieldSettings);
    this.schemaSettingsManager.add(cascadeSelectComponentFieldSettings);
    this.schemaSettingsManager.add(inputPreviewComponentFieldSettings);
    // this.schemaSettingsManager.add(inputURLComponentFieldSettings);
    this.schemaSettingsManager.add(uploadAttachmentComponentFieldSettings);
    this.schemaSettingsManager.add(previewComponentFieldSettings);
    this.schemaSettingsManager.add(dividerSettings);
    this.schemaSettingsManager.add(timePickerComponentFieldSettings);

    // menu settings
    this.schemaSettingsManager.add(menuItemSettings);
  }
}
