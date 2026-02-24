import Transport from 'winston-transport';

export class CacheTransport extends Transport {
  private logs: string[] = [];

  log(info: any, next: () => void): any {
    this.logs.push(info.message);
    next();
  }

  getLogs(): string[] {
    return this.logs.slice();
  }
}
