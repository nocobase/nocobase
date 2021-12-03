import { readdirSync } from 'fs';
import { join } from 'path';

// utils must build before core
// runtime must build before renderer-react
const headPkgs = [
  'utils',
  'database',
  'resourcer',
  'actions',
  'client',
  'server',
];
const tailPkgs = [];
const otherPkgs = readdirSync(join(__dirname, 'packages')).filter(
  (pkg) => {
    return !['father-build', 'app'].includes(pkg) && pkg.charAt(0) !== '.' && !headPkgs.includes(pkg) && !tailPkgs.includes(pkg)
  },
);

let pkgs = [];

if (process.argv.length > 2) {
  pkgs = process.argv;
  pkgs.shift();
  pkgs.shift();
} else {
  pkgs = [...headPkgs, ...otherPkgs, ...tailPkgs];
}

console.log(pkgs);

export default {
  target: 'node',
  cjs: { type: 'babel', lazy: true },
  // disableTypeCheck: true,
  pkgs,
};
