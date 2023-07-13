import React from 'react';

import { Input } from '../input';
import { RawTextArea } from './RawTextArea';

export function JSONInput(props) {
  return <RawTextArea {...props} component={Input.JSON} />;
}
