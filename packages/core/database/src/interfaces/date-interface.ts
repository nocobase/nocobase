import { DatetimeInterface } from './datetime-interface';

export class DateInterface extends DatetimeInterface {
  toString(value: any, ctx?: any): any {
    return value;
  }
}
