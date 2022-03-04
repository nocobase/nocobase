import { BlockInitializers } from './BlockInitializers';
import { CalendarActionInitializers } from './CalendarActionInitializers';
import { DetailsActionInitializers } from './DetailsActionInitializers';
import { FormActionInitializers } from './FormActionInitializers';
import { GridFormItemInitializers } from './GridFormItemInitializers';
import * as Items from './Items';
import { PopupFormActionInitializers } from './PopupFormActionInitializers';
import { RecordBlockInitializers } from './RecordBlockInitializers';
import { RecordDetailsActionInitializers } from './RecordDetailsActionInitializers';
import { RecordFormActionInitializers } from './RecordFormActionInitializers';
import { TableActionInitializers } from './TableActionInitializers';
import { TableColumnInitializers } from './TableColumnInitializers';
import { TableFieldRecordActionInitializers } from './TableFieldRecordActionInitializers';
import { TableRecordActionInitializers } from './TableRecordActionInitializers';
import { TabPaneInitializers } from './TabPaneInitializers';

export const items = { ...Items };

export const initializes = {
  // 页面里的「添加区块」
  BlockInitializers,
  // 日历的「操作配置」
  CalendarActionInitializers,
  // 详情的「操作配置」
  DetailsActionInitializers,
  // 普通表单的「操作配置」
  FormActionInitializers,
  // Grid 组件里「配置字段」
  GridFormItemInitializers,
  // 弹窗表单的「操作配置」
  PopupFormActionInitializers,
  // 当前行记录所在面板的「添加区块」
  RecordBlockInitializers,
  // 表格「操作配置」
  TableActionInitializers,
  // 表格「列配置」
  TableColumnInitializers,
  // 表格当前行记录的「操作配置」
  TableRecordActionInitializers,
  // 表格字段（子表格）场景的当前行记录的「操作配置」
  TableFieldRecordActionInitializers,
  // 添加标签页
  TabPaneInitializers,

  RecordDetailsActionInitializers,

  RecordFormActionInitializers,
};
