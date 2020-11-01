import { readdirSync } from 'fs';
import { join } from 'path';

// utils must build before core
// runtime must build before renderer-react
const headPkgs = [
  'database',
  'resourcer',
  'actions',
  'client',
];
const tailPkgs = [];
const otherPkgs = readdirSync(join(__dirname, 'packages')).filter(
  (pkg) => {
    return !['father-build', 'app'].includes(pkg) && pkg.charAt(0) !== '.' && !headPkgs.includes(pkg) && !tailPkgs.includes(pkg)
  },
);

export default {
  target: 'node',
  cjs: { type: 'babel', lazy: true },
  // disableTypeCheck: true,
  pkgs: [...headPkgs, ...otherPkgs, ...tailPkgs],
};
