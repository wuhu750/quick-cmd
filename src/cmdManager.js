const path = require('path');
const { readFileSync, existsSync, mkdirSync, writeFileSync, chmodSync, readdirSync, rmSync, unlink, copyFileSync } = require('fs');
const chalk = require('chalk');
const { BinDir, TemplatePath, CommandsJsonPath } = require('./constants');

/**
 * Check if directory exists, create it if not
 * @param {string} dir - Directory path to check
 */
function checkDirExist(dir) {
    if (!existsSync(dir)) {
        mkdirSync(dir, {
            recursive: true
        })
    }
}

/**
 * Check if file exists
 * @param {string} filePath - File path to check
 * @returns {boolean} - True if file exists, false otherwise
 */
function checkFileExist(filePath) {
    if (!existsSync(filePath)) {
        return false;
    }
    return true;
}

/**
 * Read and parse JSON file with commands
 * @param {string} jsonPath - Path to the JSON file
 * @returns {object} - Parsed JSON object
 */
function getCommandJson(jsonPath) {
    try {
        const commandStr = readFileSync(jsonPath, 'utf-8');
        const commandJson = JSON.parse(commandStr);

        return commandJson;
    } catch (error) {
        console.log(chalk.red("get command json error:", error.message))
        process.exit(1);
    }
}

/**
 * Get command template content
 * @returns {string} - Template content
 */
function getCmdTemplate() {
    try {
        const template = readFileSync(TemplatePath, 'utf-8');
        return template;
    } catch (error) {
        console.log(chalk.red("get command template error:", error.message))
        process.exit(1);
    }
}

/**
 * Write command to JSON file
 * @param {string} alias - Command alias
 * @param {string} command - Actual command
 */
function writeCommandToJson(alias, command) {
    if (!existsSync(CommandsJsonPath)) {
        writeFileSync(CommandsJsonPath, '{}', 'utf-8');
    }

    const commandJson = getCommandJson(CommandsJsonPath);
    commandJson[alias] = command;
    writeFileSync(CommandsJsonPath, JSON.stringify(commandJson, null, 4), 'utf-8');
}

/**
 * Add a new command
 * @param {string} alias - Command alias
 * @param {string} command - Actual command
 * @returns {boolean} - True if successful, false otherwise
 */
function addCommand(alias, command) {
    try {
        const commandBinPath = path.resolve(BinDir, alias);
        const template = getCmdTemplate();
        const commandBinStr = template.replace('{{command}}', command);

        writeFileSync(commandBinPath, commandBinStr, 'utf-8');
        chmodSync(commandBinPath, '755');
        writeCommandToJson(alias, command);
        console.log(chalk.green("add command success:", alias));
        return true;
    } catch (error) {
        console.log(chalk.red("write command bin error:", error.message));
        return false;
    }
}

/**
 * Write command executable files
 * @param {object} commandJson - Object containing commands
 */
function writeCommandExecuteBin(commandJson) {
    checkDirExist(BinDir);
    Object.keys(commandJson).forEach((alias) => {
        const command = commandJson[alias];
        addCommand(alias, command)
    });
}

/**
 * Install commands from JSON file
 * @param {string} jsonPath - Path to the JSON file with commands
 */
function install(jsonPath) {
    try {
        const commandJson = getCommandJson(jsonPath);

        writeCommandExecuteBin(commandJson);
    } catch (error) {
        console.log(chalk.red("install command error:", error.message));
        process.exit(1);
    }
}

/**
 * Delete command from JSON file
 * @param {string} alias - Command alias to delete
 */
function deleteCommandFromJson(alias) {
    const commandJson = getCommandJson(CommandsJsonPath);
    delete commandJson[alias];
    writeFileSync(CommandsJsonPath, JSON.stringify(commandJson, null, 4), 'utf-8');
}

/**
 * Delete command executable file
 * @param {string} alias - Command alias to delete
 * @returns {boolean} - True if successful, false otherwise
 */
function deleteCommand(alias) {
    try {
        const commandBinPath = path.resolve(BinDir, alias);
        if (existsSync(commandBinPath)) {
            rmSync(commandBinPath);
            deleteCommandFromJson(alias);
        }
        return true;
    } catch (error) {
        console.log(chalk.red("delete command error:", error.message));
        return false;
    }
}

/**
 * Uninstall command(s)
 * @param {string} alias - Command alias to uninstall, if not provided uninstall all
 */
function unInstall(alias) {
    if (alias) {
        deleteCommand(alias);
    } else {
        if (!existsSync(BinDir)) {
            console.log("no command installed")
            return;
        }
        const aliasList = readdirSync(BinDir);
        const deletedAliasList = [];
        aliasList.forEach((alias) => {
            if (deleteCommand(alias)) {
                deletedAliasList.push(alias);
            }
        });
        console.log(chalk.green("uninstall command success:", deletedAliasList))
    }
}

/**
 * List all installed commands
 */
function listCommands() {
    try {
        const commandJson = getCommandJson(CommandsJsonPath);
        Object.keys(commandJson).forEach((alias) => {
            console.log(chalk.green(alias, ":", commandJson[alias]))
        });
    } catch (error) {
        console.log(chalk.red("list command error:", error.message));
        process.exit(1);
    }
}

/**
 * Preview command information
 * @param {string} alias - Command alias to preview
 * @param {boolean} isFull - Whether to show full command content
 */
function previewCommand(alias, isFull) {
    try {
        const commandJson = getCommandJson(CommandsJsonPath);

        if (isFull) {
            const commandBinPath = path.resolve(BinDir, alias);
            const fileContent = readFileSync(commandBinPath, 'utf-8');
            console.log(chalk.green(alias, " content is:"));
            console.log(fileContent);
        } else {
            console.log(chalk.green(alias, ":", commandJson[alias]))
        }
    } catch (error) {
        console.log(chalk.red("get command error:", error.message));
        process.exit(1);
    }
}

/**
 * Export commands to a JSON file
 * @param {string} exportPath - Path to export commands to
 */
function exportCommands(exportPath) {
    try {
        // 复制 CommandsJsonPath 的文件到 exportPath
        if(checkFileExist(exportPath)) {
            console.log(chalk.red("export path already exists:", exportPath));
            return;
        }

        copyFileSync(CommandsJsonPath, exportPath);
    } catch (error) {
        console.log(chalk.red("get command error:", error.message));
        process.exit(1);
    }
}

module.exports = {
    install,
    unInstall,
    listCommands,
    previewCommand,
    addCommand,
    exportCommands,
}