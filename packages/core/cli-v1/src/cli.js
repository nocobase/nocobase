/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const { Command } = require('commander');
const commands = require('./commands');

const cli = new Command();

cli.version(require('../package.json').version);

const argv = process.argv.slice(2);
const emptyArgs = argv.length === 0;
const isPmListCommand = argv[0] === 'pm' && argv[1] === 'list';
const hasSilentLikeFlag = argv.includes('--help') || argv.includes('-h') || argv.includes('--silent');

if (emptyArgs || isPmListCommand || hasSilentLikeFlag) {
  process.env.LOGGER_SILENT = 'true';
}

commands(cli);

module.exports = cli;
