const path = require('path');
const os = require('os');

// Define project directories and file paths
const ProjectDir = path.resolve(os.homedir(), '.quick-cmd')  // Main project directory in user's home
const BinDir = path.resolve(ProjectDir, 'bin')               // Directory for executable command files
const DefaultCommandJsonPath = path.resolve(__dirname, './defaultCommands.json')  // Default commands file
const TemplatePath = path.resolve(__dirname, './templateCmd')  // Command template file
const CommandsJsonPath = path.resolve(ProjectDir, 'command.json')  // User's commands file

module.exports = {
    ProjectDir,
    BinDir,
    DefaultCommandJsonPath,
    TemplatePath,
    CommandsJsonPath,
}