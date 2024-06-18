// @ts-ignore
const axios = require('axios');
const glob = require('glob');
const path = require('path');
const fs = require('fs/promises');
const lerna = require('./lerna.json');

const files = glob.sync(path.resolve(__dirname, './node_modules/@nocobase/**/package.json'));

(async () => {
  for (const file of files) {
    const content = await fs.readFile(file);
    const json = JSON.parse(content.toString());
    const url = `https://registry.npmmirror.com/${json.name}`;
    try {
      const response = await axios.get(url);
      const latest = response?.data?.['dist-tags']?.latest;
      if (latest !== lerna.version) {
        console.log(json.name, latest);
        console.log(`https://www.npmmirror.com/package/${json.name}`);
        const response = await axios.put(`https://registry-direct.npmmirror.com/-/package/${json.name}/syncs`);
        console.log(response.data);
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve(null);
          }, 1000);
        });
      }
    } catch (error) {
      // ...
    }
  }
})();
