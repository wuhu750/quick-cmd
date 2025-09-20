#!/usr/bin/env node

const path = require('path');
const { program } = require('commander')

const { version } = require('../package.json');
const { install, unInstall, listCommands, previewCommand, addCommand, exportCommands } = require('../src/cmdManager');
const { DefaultCommandJsonPath } = require('../src/constants');

program.version(version);

program
    .command('install')
    .description('install commands from json file')
    .alias('i')
    .argument('[jsonPath]', 'commands json path')
    .action((jsonPath) => {
        if (!jsonPath) {
            console.log("no json path specified, use default path")
            jsonPath = DefaultCommandJsonPath;
        }

        jsonPath = path.resolve(process.cwd(), jsonPath);
        install(jsonPath);
    })

program
    .command('add')
    .description('add command to json file')
    .alias('a')
    .argument('alias', 'command alias')
    .argument('command', 'command to add')
    .action((alias, command) => {
        addCommand(alias, command);
    })

program
    .command('delete')
    .description('delete command or commands')
    .alias('d')
    .argument('[alias]', 'command alias')
    .action((alias) => {
        unInstall(alias);
    })

program
    .command('list')
    .description('list all commands')
    .alias('l')
    .action(() => {
        listCommands();
    })

program
    .command('preview')
    .alias('p')
    .description('get command info')
    .argument('alias', 'command alias')
    .option('-f, --full', 'get all info')
    .action((alias, options) => {
        const isFull = options.full;
        previewCommand(alias, isFull);
    })

program
    .command('export')
    .description('export commands to json file')
    .alias('e')
    .argument('[jsonPath]', 'commands json path')
    .action((jsonPath) => {
        exportCommands(jsonPath);
    })

program.parse()

if(!process.argv.slice(2).length) {
    program.outputHelp();
}