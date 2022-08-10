const argv = process.argv;
const path = argv.splice(2, 1).shift();
const app = require(`./${path}`).default;
app.runAsCLI(argv);
