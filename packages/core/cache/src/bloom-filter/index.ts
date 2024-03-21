export interface BloomFilter {
  reserve(key: string, errorRate: number, capacity: number): Promise<void>;
  add(key: string, val: string): Promise<void>;
  mAdd(key: string, vals: string[]): Promise<void>;
  exists(key: string, val: string): Promise<boolean>;
}
