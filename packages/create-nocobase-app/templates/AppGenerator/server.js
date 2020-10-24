const api = require('@nocobase/api');

require('dotenv').config();

api.listen(23000, () => {
  console.log('http://localhost:23000/');
});
