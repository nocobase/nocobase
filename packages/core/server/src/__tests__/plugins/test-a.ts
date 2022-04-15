import { Plugin } from '../../plugin';

export default class TestA extends Plugin {
  getName(): string {
    return 'test-a';
  }
}
