import { Action } from '../action';
import { RecordPicker } from './RecordPicker';

RecordPicker.Viewer = Action.Container;
RecordPicker.Selector = Action.Container;

export { RecordPicker };
export * from './useFieldNames';
export * from './util';
export * from './ReadPrettyRecordPicker';
export * from './InputRecordPicker';
