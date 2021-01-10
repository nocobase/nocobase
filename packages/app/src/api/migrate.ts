
const args = process.argv;

// @ts-ignore
global.sync = {
  force: true,
  alter: {
    drop: true,
  },
};

const fileName: string = args.pop();

require(`./migrations/${fileName}`);
