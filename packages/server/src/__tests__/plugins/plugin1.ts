import { Plugin } from '../../plugin';

export default function abc(this: Plugin) {
  this.app.db.table({
    name: 'tests',
  });
}
