const chalk = require('chalk');
const { existsSync } = require('fs');
const { join, resolve } = require('path');
const { Generator } = require('@umijs/utils');
const { readFile } = require('fs').promises;

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
    const packageName = await getProjectName();
    const packageVersion = await getProjectVersion();
    return {
      ...this.context,
      packageName: `@${packageName}/${name}`,
      packageVersion: packageVersion,
      pascalCaseName: capitalize(camelize(name)),
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
    console.log(`The plugin folder is in ${chalk.green(`packages/plugins/${name}`)}`);
  }
}

exports.PluginGenerator = PluginGenerator;
