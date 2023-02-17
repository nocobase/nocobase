import { percent2float } from '../utils';
import { BaseValueParser } from './base-value-parser';

export class NumberValueParser extends BaseValueParser {
  async setValue(value: any) {
    if (value === null || value === undefined || typeof value === 'number') {
      this.value = value;
    }
    if (typeof value === 'string') {
      if (!value) {
        this.value = null;
      } else if (['n/a', '-'].includes(value.toLowerCase())) {
        this.value = null;
      } else if (value.endsWith('%')) {
        this.value = percent2float(value);
        console.log(value, this.value);
      } else {
        const val = +value;
        this.value = isNaN(val) ? null : val;
      }
    }
  }
}
