import { connect, mapReadPretty } from '@formily/react';
import { InputRecordPicker } from './InputRecordPicker';
import { ReadPrettyRecordPicker } from './ReadPrettyRecordPicker';

export const RecordPicker: any = connect(InputRecordPicker, mapReadPretty(ReadPrettyRecordPicker));
