export interface BaseMutexInterface {
  acquire(name: string): Promise<any>;
  release(name: string): Promise<any>;
  close(): Promise<any>;
}

