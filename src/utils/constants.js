const path = require('path');
const os = require('os');

const ProjectDir = path.resolve(os.homedir(), '.quick-cmd');
const BinDir = path.resolve(ProjectDir, 'bin');
const FunctionsDir = path.resolve(ProjectDir, 'functions');
const BackupDir = path.resolve(ProjectDir, 'backups');
const DefaultCommandJsonPath = path.resolve(__dirname, '../defaultCommands.json');
const TemplatePath = path.resolve(__dirname, '../templateCmd');
const CommandsJsonPath = path.resolve(ProjectDir, 'command.json');

module.exports = {
    ProjectDir,
    BinDir,
    FunctionsDir,
    BackupDir,
    DefaultCommandJsonPath,
    TemplatePath,
    CommandsJsonPath,
};