
const args = process.argv;

// @ts-ignore
global.sync = {
  force: false,
  alter: {
    drop: false,
  },
};

const fileName: string = args.pop();

require(`./migrations/${fileName}`);
