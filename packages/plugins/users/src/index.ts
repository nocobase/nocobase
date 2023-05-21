import pkg from '../package.json' assert { type: 'json' };

export { default } from './server';

export const namespace = pkg.name;
