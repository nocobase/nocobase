export class MultipleInstanceManager<Item> {
  map: Map<string, Item> = new Map();

  constructor() {}

  get(key: string) {
    return this.map.get(key);
  }

  set(key: string, value: Item) {
    this.map.set(key, value);
  }
}
