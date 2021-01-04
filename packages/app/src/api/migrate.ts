
const args = process.argv;
const fileName: string = args.pop();

require(`./migrations/${fileName}`);
