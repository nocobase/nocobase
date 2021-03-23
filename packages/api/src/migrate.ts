
// @ts-ignore
const keys = process.argv;

// @ts-ignore
global.sync = {
  force: false,
  alter: {
    drop: false,
  },
};

// @ts-ignore
const filename: string = keys.pop();

require(`./migrations/${filename}`);
