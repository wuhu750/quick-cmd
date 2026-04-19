const chalk = require('chalk');

const LogLevel = {
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    SUCCESS: 'success',
};

function formatTimestamp() {
    return new Date().toISOString().split('T')[1].replace('Z', '');
}

function log(level, message, ...args) {
    const timestamp = chalk.gray(`[${formatTimestamp()}]`);
    const prefix = {
        [LogLevel.INFO]: chalk.blue('ℹ'),
        [LogLevel.WARN]: chalk.yellow('⚠'),
        [LogLevel.ERROR]: chalk.red('✗'),
        [LogLevel.SUCCESS]: chalk.green('✓'),
    }[level];

    console.log(`${timestamp} ${prefix} ${message}`, ...args);
}

module.exports = {
    info: (msg, ...args) => log(LogLevel.INFO, msg, ...args),
    warn: (msg, ...args) => log(LogLevel.WARN, msg, ...args),
    error: (msg, ...args) => log(LogLevel.ERROR, msg, ...args),
    success: (msg, ...args) => log(LogLevel.SUCCESS, msg, ...args),
    LogLevel,
};