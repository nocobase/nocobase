import { circle } from './circle';
import { lineString } from './lineString';
import { point } from './point';
import { polygon } from './polygon';

export const fields = [point, polygon, lineString, circle];

export const interfaces = fields.reduce((ins, field) => {
  ins[field.name] = field;
  return ins;
}, {});
