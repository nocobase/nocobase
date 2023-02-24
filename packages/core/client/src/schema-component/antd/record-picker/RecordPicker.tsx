import { connect, mapProps, mapReadPretty } from '@formily/react';
import { InputRecordPicker } from './InputRecordPicker';
import { ReadPrettyRecordPicker } from './ReadPrettyRecordPicker';

export const RecordPicker: any = connect(
  InputRecordPicker,
  mapProps((props, field) => {
    return {
      ...props,
    };
  }),
  mapReadPretty(ReadPrettyRecordPicker),
);
