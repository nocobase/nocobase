import { RequestMethod, RequestOptionsInit } from 'umi-request';

export class ClientSDK {
  options: any;

  constructor(options) {
    this.options = options;
  }

  request(url: string, options?: RequestOptionsInit): RequestMethod {
    return this.options.request(url, options);
  }

  resource(name) {

  }
}

export default ClientSDK;
