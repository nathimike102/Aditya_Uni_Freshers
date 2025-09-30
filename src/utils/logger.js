// Production-ready logging utility
const isDevelopment = import.meta.env.MODE === 'development';

class Logger {
  static log(...args) {
    if (isDevelopment) {
      console.log(...args);
    }
  }

  static warn(...args) {
    if (isDevelopment) {
      console.warn(...args);
    }
  }

  static error(...args) {
    console.error(...args);
  }

  static debug(...args) {
    if (isDevelopment) {
      console.debug(...args);
    }
  }

  static info(...args) {
    if (isDevelopment) {
      console.info(...args);
    }
  }
  static sendToErrorTracking(error, context = {}) {
  }
}

export default Logger;