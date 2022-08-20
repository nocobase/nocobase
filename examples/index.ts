import Database from '@nocobase/database';
import Application from '@nocobase/server';

const argv = process.argv;
const path = argv.splice(2, 1).shift();
const app = require(`./${path}`).default;

if (app instanceof Application) {
  app.runAsCLI(argv);
}

if (app instanceof Database) {
  console.log('Table prefix: ', app.getTablePrefix());
}
