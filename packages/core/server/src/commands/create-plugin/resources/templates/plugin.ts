import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';

export default ({ name }) => {
  const tmpl = fs.readFileSync(path.join(__dirname, 'plugin-class.template'), { encoding: 'utf-8' });
  const compile = _.template(tmpl);

  return compile({
    name,
    className: _.startCase(_.camelCase(name)),
  });
};
