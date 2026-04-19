const path = require('path');
const { BinDir, FunctionsDir } = require('../utils/constants');
const FileSystem = require('../infrastructure/FileSystem');
const ConfigManager = require('./ConfigManager');
const Validator = require('./Validator');
const logger = require('../utils/logger');

// Commands that need to run in current shell context (for cd, pushd, popd to work)
const SHELL_FUNCTION_COMMANDS = ['cd', 'pushd', 'popd'];

class AliasManager {
    constructor() {
        this.configManager = ConfigManager;
        this.validator = Validator;
    }

    // Check if command should be a shell function (cd-like)
    isShellFunction(command) {
        const trimmed = command.trim();
        return SHELL_FUNCTION_COMMANDS.some(cmd => trimmed.startsWith(cmd + ' '));
    }

    // Convert quick-cmd placeholders to shell equivalents
    convertPlaceholders(command) {
        // {{arg}} → $1, {{arg1}} → $1, {{arg2}} → $2, etc.
        // {{*args}} → $@
        // {{env:VAR}} → ${VAR}
        // {{cwd}} → $(pwd)
        // {{date}} → $(date +%Y-%m-%d)
        // {{time}} → $(date +%H:%M:%S)

        let result = command;

        // Handle {{*args}}
        result = result.replace(/\{\{\*args\}\}/g, '$@');

        // Handle {{arg1}}, {{arg2}}, etc.
        result = result.replace(/\{\{arg(\d+)\}\}/g, (match, num) => `$${num}`);

        // Handle {{arg}} (first arg)
        result = result.replace(/\{\{arg\}\}/g, '$1');

        // Handle {{env:VAR}}
        result = result.replace(/\{\{env:(\w+)\}\}/g, '${$1}');

        // Handle {{cwd}}
        result = result.replace(/\{\{cwd\}\}/g, '$(pwd)');

        // Handle {{date}}
        result = result.replace(/\{\{date\}\}/g, '$(date +%Y-%m-%d)');

        // Handle {{time}}
        result = result.replace(/\{\{time\}\}/g, '$(date +%H:%M:%S)');

        return result;
    }

    // Generate a shell script
    generateScript(alias, command) {
        const shellCommand = this.convertPlaceholders(command);
        return `#!/bin/bash\n${shellCommand}\n`;
    }

    // Generate a shell function
    generateFunction(alias, command) {
        const shellCommand = this.convertPlaceholders(command);
        return `${alias}() {\n    ${shellCommand}\n}\n`;
    }

    // Determine target directory and type
    getTargetInfo(alias, command) {
        if (this.isShellFunction(command)) {
            return { type: 'function', dir: FunctionsDir };
        }
        return { type: 'script', dir: BinDir };
    }

    async writeAliasFile(alias, command) {
        const { type, dir } = this.getTargetInfo(alias, command);

        await FileSystem.ensureDir(dir);

        if (type === 'function') {
            const content = this.generateFunction(alias, command);
            const filePath = path.join(dir, alias);
            await FileSystem.writeFile(filePath, content);
            await FileSystem.chmod(filePath, '644');
        } else {
            const content = this.generateScript(alias, command);
            const filePath = path.join(dir, alias);
            await FileSystem.writeFile(filePath, content);
            await FileSystem.chmod(filePath, '755');
        }

        return type;
    }

    async removeAliasFile(alias) {
        // Try bin first, then functions
        const binPath = path.join(BinDir, alias);
        const funcPath = path.join(FunctionsDir, alias);

        const binExists = await FileSystem.exists(binPath);
        const funcExists = await FileSystem.exists(funcPath);

        if (binExists) await FileSystem.remove(binPath);
        if (funcExists) await FileSystem.remove(funcPath);

        return binExists || funcExists;
    }

    async add(alias, command, options = {}) {
        const nameValidation = this.validator.validateAliasName(alias);
        if (!nameValidation.valid) {
            nameValidation.errors.forEach(e => logger.warn(e));
            return false;
        }

        const safety = this.validator.validateCommand(command);
        if (!safety.safe && !options.force) {
            safety.warnings.forEach(w => logger.warn(w));
            return false;
        }

        const existingConfig = await this.configManager.load();
        if (existingConfig.aliases[alias] && !options.force) {
            logger.warn(`Alias '${alias}' already exists. Use --force to overwrite.`);
            return false;
        }

        const type = await this.writeAliasFile(alias, command);

        existingConfig.aliases[alias] = {
            command,
            description: options.description || '',
            category: options.category || 'default',
            tags: options.tags || [],
            enabled: true,
            source: 'user',
            type,
        };

        await this.configManager.saveToSource(existingConfig);
        logger.success(`Added alias: ${alias} (${type})`);
        return true;
    }

    async delete(alias) {
        await this.removeAliasFile(alias);

        const config = await this.configManager.load();
        if (config.aliases[alias]) {
            delete config.aliases[alias];
            await this.configManager.saveToSource(config);
        }

        logger.success(`Deleted alias: ${alias}`);
        return true;
    }

    async sync() {
        const sourcePath = await this.configManager.getSource();
        if (!sourcePath) {
            logger.warn('No source file linked. Use: qcmd link <jsonPath>');
            return false;
        }

        const sourceConfig = await this.configManager.loadFromSource();
        if (!sourceConfig) {
            logger.error('Failed to load source file');
            return false;
        }

        const currentConfig = await this.configManager.load();
        const sourceAliases = sourceConfig.aliases || sourceConfig;
        const currentAliases = currentConfig.aliases || {};

        const toAdd = [];
        const toRemove = [];

        // Find aliases to add
        for (const [alias, def] of Object.entries(sourceAliases)) {
            if (!currentAliases[alias]) {
                toAdd.push([alias, def]);
            }
        }

        // Find aliases to remove (only linked, not user-created)
        for (const [alias, def] of Object.entries(currentAliases)) {
            if (def.source === 'linked' && !sourceAliases[alias]) {
                toRemove.push(alias);
            }
        }

        // Remove stale aliases
        for (const alias of toRemove) {
            await this.removeAliasFile(alias);
            delete currentConfig.aliases[alias];
        }

        // Add new aliases
        for (const [alias, def] of toAdd) {
            const command = typeof def === 'string' ? def : def.command;
            const type = await this.writeAliasFile(alias, command);

            currentConfig.aliases[alias] = {
                command,
                description: typeof def === 'string' ? '' : (def.description || ''),
                category: typeof def === 'string' ? 'default' : (def.category || 'default'),
                tags: typeof def === 'string' ? [] : (def.tags || []),
                enabled: true,
                source: 'linked',
                type,
            };
        }

        await this.configManager.save(currentConfig);
        await this.configManager.saveToSource(currentConfig);

        if (toAdd.length > 0) {
            logger.success(`Added ${toAdd.length} aliases: ${toAdd.map(a => a[0]).join(', ')}`);
        }
        if (toRemove.length > 0) {
            logger.success(`Removed ${toRemove.length} aliases: ${toRemove.join(', ')}`);
        }
        if (toAdd.length === 0 && toRemove.length === 0) {
            logger.info('No changes detected');
        }

        return true;
    }

    async link(sourcePath) {
        const absolutePath = path.resolve(sourcePath);
        const exists = await FileSystem.exists(absolutePath);
        if (!exists) {
            logger.error(`File not found: ${absolutePath}`);
            return false;
        }

        await this.configManager.setSource(absolutePath);
        logger.success(`Linked to: ${absolutePath}`);
        await this.sync();
        return true;
    }

    async unlink() {
        const sourcePath = await this.configManager.getSource();
        if (!sourcePath) {
            logger.warn('No source file linked');
            return false;
        }

        await this.configManager.setSource(null);
        logger.success('Unlinked source file');
        return true;
    }

    async getSourceInfo() {
        const sourcePath = await this.configManager.getSource();
        if (!sourcePath) {
            return { linked: false };
        }
        return { linked: true, path: sourcePath };
    }

    async list() {
        const config = await this.configManager.load();
        return Object.entries(config.aliases).map(([alias, def]) => ({
            alias,
            command: def.command,
            description: def.description,
            category: def.category,
            enabled: def.enabled,
            type: def.type || 'script',
        }));
    }

    async preview(alias, options = {}) {
        const config = await this.configManager.load();
        const def = config.aliases[alias];
        if (!def) {
            logger.error(`Alias '${alias}' not found`);
            return null;
        }

        if (options.full) {
            // Try both bin and functions
            const binPath = path.join(BinDir, alias);
            const funcPath = path.join(FunctionsDir, alias);

            let content = null;
            if (await FileSystem.exists(binPath)) {
                content = await FileSystem.readFile(binPath);
            } else if (await FileSystem.exists(funcPath)) {
                content = await FileSystem.readFile(funcPath);
            }

            return { alias, ...def, script: content };
        }

        return { alias, ...def };
    }

    async export(jsonPath) {
        await this.configManager.exportTo(jsonPath);
        logger.success(`Exported to: ${jsonPath}`);
        return true;
    }
}

module.exports = new AliasManager();
