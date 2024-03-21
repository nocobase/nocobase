import ActionContainer from '../action/Action.Container';
import { RecordPicker } from './RecordPicker';

RecordPicker.Viewer = ActionContainer;
RecordPicker.Selector = ActionContainer;

export { RecordPicker };
export * from './useFieldNames';
export * from './util';
export * from './ReadPrettyRecordPicker';
export * from './InputRecordPicker';
