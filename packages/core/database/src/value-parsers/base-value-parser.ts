export class BaseValueParser {
  ctx: any;
  field: any;
  value: any;
  errors: string[] = [];

  constructor(field: any, ctx: any) {
    this.field = field;
    this.ctx = ctx;
  }

  toString() {
    return this.value;
  }

  getValue() {
    return this.value;
  }

  async setValue(value: any) {
    this.value = value;
  }
}
