import IStorage from './IStorage';

export default class Local implements IStorage {
  options: any;

  constructor(options: any) {
    this.options = options;
  }

  async put(file, data) {
    
  }
}
