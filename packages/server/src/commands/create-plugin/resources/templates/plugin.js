const fs = require('fs');
const path = require('path');
const _ = require('lodash');

module.exports = ({ name }) => {
  const tmpl = fs.readFileSync(path.join(__dirname, 'plugin-class.template'));
  const compile = _.template(tmpl);

  return compile({
    name,
    className: _.startCase(_.camelCase(name)),
  });
};
