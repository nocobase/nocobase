import { Plugin } from '../../plugin';

export default function abc(this: Plugin) {
  this.app.collection({
    name: 'tests',
  });
}
