#!/usr/bin/env node

const keys = process.argv;
const dotenv = require('dotenv');
dotenv.config();
require('../lib/index');
