const example = process.argv[2];
process.argv.splice(2, 1);
console.log(process.argv);
require(`./${example}/src`);
