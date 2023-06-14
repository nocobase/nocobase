import http from 'http';

export class Gateway {
  private static instance: Gateway;

  private server: http.Server | null = null;

  private port: number;
  private host: string;

  private constructor() {}

  public static getInstance(): Gateway {
    if (!Gateway.instance) {
      Gateway.instance = new Gateway();
    }
    return Gateway.instance;
  }

  start() {
    this.server = http.createServer();
    this.server.listen(this.port);
  }
}
