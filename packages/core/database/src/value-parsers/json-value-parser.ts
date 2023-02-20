import { BaseValueParser } from './base-value-parser';

export class JsonValueParser extends BaseValueParser {
  async setValue(value: any) {
    if (typeof value === 'string') {
      if (value.trim() === '') {
        this.value = null;
      } else {
        try {
          this.value = JSON.parse(value);
        } catch (error) {
          this.errors.push(error.message);
        }
      }
    } else {
      this.value = value;
    }
  }
}
