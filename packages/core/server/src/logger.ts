import winston, { format } from 'winston';

const logger = winston.createLogger({
  level: 'debug',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new winston.transports.Console()],
});

export default logger;
