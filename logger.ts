import winston from "winston";
const { combine, timestamp, json } = winston.format;

const logger = winston.createLogger({
  level: "debug",
  format: combine(timestamp(), json()),
  transports: [
    new winston.transports.File({
      filename: "app.log"
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export { logger };

