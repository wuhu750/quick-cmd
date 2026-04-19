#!/usr/bin/env node

const path = require('path');
const { program } = require('commander');

const { version } = require('../package.json');
const AliasManager = require('../src/core/AliasManager');
const ShellCommand = require('../src/commands/ShellCommand');
const DoctorCommand = require('../src/commands/DoctorCommand');
const logger = require('../src/utils/logger');

program.version(version);

program
    .command('add')
    .description('add command alias')
    .argument('alias', 'command alias')
    .argument('command', 'command to add')
    .option('-f, --force', 'overwrite if exists')
    .option('-d, --description <desc>', 'description')
    .option('-c, --category <cat>', 'category')
    .action(async (alias, command, options) => {
        await AliasManager.add(alias, command, options);
    });

program
    .command('delete')
    .description('delete command alias')
    .argument('alias', 'command alias')
    .action(async (alias) => {
        if (!alias) {
            logger.error('Alias is required');
            return;
        }
        await AliasManager.delete(alias);
    });

program
    .command('list')
    .description('list all commands')
    .action(async () => {
        const aliases = await AliasManager.list();
        if (aliases.length === 0) {
            logger.info('No aliases installed');
            return;
        }
        for (const { alias, command, description } of aliases) {
            const desc = description ? ` - ${description}` : '';
            console.log(`${alias}: ${command}${desc}`);
        }
    });

program
    .command('preview')
    .description('preview command alias')
    .argument('alias', 'command alias')
    .option('-f, --full', 'show full script content')
    .action(async (alias, options) => {
        const result = await AliasManager.preview(alias, options);
        if (result) {
            if (options.full) {
                console.log('\n' + result.script + '\n');
            } else {
                console.log(`${alias}: ${result.command}`);
            }
        }
    });

program
    .command('export')
    .description('export commands to json file')
    .argument('[jsonPath]', 'export path')
    .action(async (jsonPath) => {
        if (!jsonPath) {
            logger.error('Export path is required');
            return;
        }
        const exportPath = path.resolve(process.cwd(), jsonPath);
        await AliasManager.export(exportPath);
    });

program
    .command('shell')
    .description('setup shell integration')
    .option('--setup', 'add PATH to shell config')
    .option('--check', 'check if PATH is configured')
    .option('--remove', 'remove PATH from shell config')
    .action(async (options) => {
        await ShellCommand.execute([], options);
    });

program
    .command('doctor')
    .description('diagnose issues')
    .action(async () => {
        await DoctorCommand.execute([], {});
    });

program
    .command('link')
    .description('link to a JSON file for sync')
    .argument('jsonPath', 'path to JSON file')
    .action(async (jsonPath) => {
        const linkPath = path.resolve(process.cwd(), jsonPath);
        await AliasManager.link(linkPath);
        console.log('\nRun: source ~/.zshrc to load new aliases');
    });

program
    .command('unlink')
    .description('unlink from JSON file')
    .action(async () => {
        await AliasManager.unlink();
        console.log('\nRun: source ~/.zshrc to apply changes');
    });

program
    .command('sync')
    .description('sync aliases from linked JSON file')
    .action(async () => {
        await AliasManager.sync();
        console.log('\nRun: source ~/.zshrc to load new aliases');
    });

program
    .command('source')
    .description('show linked JSON file info')
    .action(async () => {
        const info = await AliasManager.getSourceInfo();
        if (info.linked) {
            console.log(`Linked to: ${info.path}`);
        } else {
            console.log('Not linked to any JSON file');
        }
    });

program.parse();

if (!process.argv.slice(2).length) {
    program.outputHelp();
}
