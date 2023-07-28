import { Gateway } from '../gateway';

export class WSServer {
  wss;

  constructor(private gateway: Gateway) {}
}
