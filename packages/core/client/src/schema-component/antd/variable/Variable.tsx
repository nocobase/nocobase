import { connect, mapReadPretty } from '@formily/react';

import { IField } from '../../../collection-manager';
import { Input } from './Input';
import { JSONInput } from './JSONInput';
import { RawTextArea } from './RawTextArea';
import { TextArea } from './TextArea';

export function Variable() {
  return null;
}

Variable.Input = connect(Input);

Variable.TextArea = connect(TextArea, mapReadPretty(TextArea.ReadPretty));

Variable.RawTextArea = connect(RawTextArea);

Variable.JSON = connect(JSONInput);

export default Variable;

export function isInvariable(value: IField) {
  return !!value?.invariable;
}
