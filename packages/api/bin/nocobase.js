const keys = process.argv;

const key = keys.pop();

const dotenv = require('dotenv');

dotenv.config();

if (key === 'start') {
  require('../lib/index');
} else if (key === 'db-init') {
  require('../lib/migrations/init');
}
