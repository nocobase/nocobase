import { Plugin } from '@nocobase/client';
const dayjs = import('dayjs');

console.log(dayjs);

class AclPlugin extends Plugin {
  async load() {
    // code
  }
}

export default AclPlugin;
