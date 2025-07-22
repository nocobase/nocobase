const Joi = require('joi');

console.log(Joi.number().integer().min(1900).max(2013).describe().valueOf());
