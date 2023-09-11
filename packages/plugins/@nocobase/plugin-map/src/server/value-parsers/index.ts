import { BaseValueParser } from '@nocobase/database';

export class PointValueParser extends BaseValueParser {
  async setValue(value) {
    if (Array.isArray(value)) {
      this.value = value;
    } else if (typeof value === 'string') {
      this.value = value.split(',');
    } else {
      this.errors.push('Value invalid');
    }
  }
}

export class PolygonValueParser extends BaseValueParser {
  async setValue(value) {
    if (Array.isArray(value)) {
      this.value = value;
    } else if (typeof value === 'string') {
      this.value = value
        .substring(1, value.length - 1)
        .split('),(')
        .map((v) => v.split(','));
    } else {
      this.errors.push('Value invalid');
    }
  }
}

export class LineStringValueParser extends BaseValueParser {
  async setValue(value) {
    if (Array.isArray(value)) {
      this.value = value;
    } else if (typeof value === 'string') {
      this.value = value
        .substring(1, value.length - 1)
        .split('),(')
        .map((v) => v.split(','));
    } else {
      this.errors.push('Value invalid');
    }
  }
}

export class CircleValueParser extends BaseValueParser {
  async setValue(value) {
    if (Array.isArray(value)) {
      this.value = value;
    } else if (typeof value === 'string') {
      this.value = value.split(',');
    } else {
      this.errors.push('Value invalid');
    }
  }
}
