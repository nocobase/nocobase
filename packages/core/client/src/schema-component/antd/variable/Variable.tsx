import { connect, mapReadPretty } from '@formily/react';

import type { IField } from '../../../collection-manager';
import { Input } from './Input';
import { JSONInput } from './JSONInput';
import { TextArea } from './TextArea';

export function Variable() {
  return null;
}

Variable.Input = connect(Input);

Variable.TextArea = connect(TextArea, mapReadPretty(TextArea.ReadPretty));

Variable.JSON = connect(JSONInput);

export default Variable;

export function isInvariable(value: IField) {
  return !!value?.invariable;
}
