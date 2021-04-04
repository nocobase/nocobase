import Resourcer from '@nocobase/resourcer';
import _export from './actions/export';



export default async function (options = {}) {
  const resourcer: Resourcer = this.resourcer;

  resourcer.registerActionHandler('export', _export);
}
