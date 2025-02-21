import winston from 'winston';
import constants from '@src/constants.js';

const logger = winston.createLogger({
  format:
    constants.development
      ? winston.format.combine(
          winston.format.splat(),
          winston.format.prettyPrint({ colorize: true })
        )
      : winston.format.combine(winston.format.splat(), winston.format.simple()),
  level: constants.debug ? 'debug' : 'info',

  transports: [new winston.transports.Console()],
  exitOnError: false,
  silent: false,
});

export default logger;
