import { ISchema } from '@formily/react';

import { select } from './select';
import { string } from './string';
import { subTable } from './subTable';
import { textarea } from './textarea';

export const interfaces = new Map<string, ISchema>();

interfaces.set('select', select);
interfaces.set('string', string);
interfaces.set('subTable', subTable);
interfaces.set('textarea', textarea);
