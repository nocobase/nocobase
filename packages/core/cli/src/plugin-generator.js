const chalk = require('chalk');
const { existsSync } = require('fs');
const { join, resolve } = require('path');
const { Generator } = require('@umijs/utils');
const { readFile, writeFile } = require('fs').promises;
const { genTsConfigPaths } = require('./util');

const execa = require('execa');

function camelize(str) {
  return str.trim().replace(/[-_\s]+(.)?/g, (match, c) => c.toUpperCase());
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

async function getProjectName() {
  const content = await readFile(resolve(process.cwd(), 'package.json'), 'utf-8');
  const json = JSON.parse(content);
  return json.name;
}

async function getProjectVersion() {
  const content = await readFile(resolve(process.cwd(), 'lerna.json'), 'utf-8');
  const json = JSON.parse(content);
  return json.version || '0.1.0';
}

class PluginGenerator extends Generator {
  constructor(options) {
    const { context = {}, ...opts } = options;
    super(opts);
    this.context = context;
  }

  async getContext() {
    const { name } = this.context;
    const nocobaseVersion = require('@nocobase/server/package.json').version;
    const packageVersion = await getProjectVersion();
    return {
      ...this.context,
      packageName: name,
      packageVersion,
      nocobaseVersion,
      pascalCaseName: capitalize(camelize(name.split('/').pop())),
    };
  }

  async writing() {
    const { name } = this.context;
    const target = resolve(process.cwd(), 'packages/plugins/', name);
    if (existsSync(target)) {
      console.log(chalk.red(`[${name}] plugin already exists.`));
      return;
    }
    console.log('Creating plugin');
    this.copyDirectory({
      target,
      context: await this.getContext(),
      path: join(__dirname, '../templates/plugin'),
    });
    console.log('');
    genTsConfigPaths();
    execa.sync('yarn', ['install'], { shell: true, stdio: 'inherit' });
    // execa.sync('yarn', ['build', `plugins/${name}`], { shell: true, stdio: 'inherit' });
    console.log(`The plugin folder is in ${chalk.green(`packages/plugins/${name}`)}`);
  }
}

exports.PluginGenerator = PluginGenerator;
