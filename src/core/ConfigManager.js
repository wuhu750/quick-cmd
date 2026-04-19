const fs = require('fs');
const path = require('path');
const { CommandsJsonPath } = require('../utils/constants');
const FileSystem = require('../infrastructure/FileSystem');
const logger = require('../utils/logger');

class ConfigManager {
    constructor() {
        this.configPath = CommandsJsonPath;
    }

    async load() {
        const exists = await FileSystem.exists(this.configPath);
        if (!exists) {
            return { version: 2, metadata: {}, aliases: {} };
        }

        try {
            const content = await FileSystem.readFile(this.configPath);
            const config = JSON.parse(content);

            if (!config.version) {
                logger.warn('Detected v1 config format, migrating to v2...');
                return this.migrateV1toV2(config);
            }

            return config;
        } catch (error) {
            logger.error('Failed to load config:', error.message);
            return { version: 2, metadata: {}, aliases: {} };
        }
    }

    async save(config) {
        config.metadata = config.metadata || {};
        config.metadata.updated = new Date().toISOString();

        const content = JSON.stringify(config, null, 4);
        await FileSystem.writeFile(this.configPath, content);
    }

    async saveToSource(config) {
        // Save to local command.json
        await this.save(config);
        // Also sync to source JSON file (simple format)
        const sourcePath = config.metadata?.source;
        if (sourcePath) {
            const simpleFormat = {};
            for (const [alias, def] of Object.entries(config.aliases)) {
                simpleFormat[alias] = def.command;
            }
            const content = JSON.stringify(simpleFormat, null, 4);
            await FileSystem.writeFile(sourcePath, content);
        }
    }

    migrateV1toV2(v1Config) {
        const now = new Date().toISOString();
        return {
            version: 2,
            metadata: {
                created: now,
                updated: now,
                source: null,
            },
            aliases: Object.entries(v1Config).reduce((acc, [alias, command]) => {
                acc[alias] = {
                    command,
                    description: '',
                    category: 'default',
                    tags: [],
                    enabled: true,
                };
                return acc;
            }, {}),
        };
    }

    async exportTo(jsonPath) {
        // Export in simple format (alias → command), not v2 schema
        const config = await this.load();
        const simpleFormat = {};
        for (const [alias, def] of Object.entries(config.aliases)) {
            simpleFormat[alias] = def.command;
        }
        const content = JSON.stringify(simpleFormat, null, 4);
        await FileSystem.writeFile(jsonPath, content);
    }

    async importFrom(jsonPath) {
        const content = await FileSystem.readFile(jsonPath);
        const imported = JSON.parse(content);

        if (!imported.version) {
            return this.migrateV1toV2(imported);
        }

        return imported;
    }

    async setSource(sourcePath) {
        const config = await this.load();
        config.metadata = config.metadata || {};
        config.metadata.source = sourcePath;
        await this.save(config);
        return sourcePath;
    }

    async getSource() {
        const config = await this.load();
        return config.metadata?.source || null;
    }

    async loadFromSource() {
        const sourcePath = await this.getSource();
        if (!sourcePath) return null;

        const exists = await FileSystem.exists(sourcePath);
        if (!exists) {
            logger.warn(`Source file not found: ${sourcePath}`);
            return null;
        }

        try {
            const content = await FileSystem.readFile(sourcePath);
            const config = JSON.parse(content);
            return config;
        } catch (error) {
            logger.error(`Failed to load source: ${error.message}`);
            return null;
        }
    }
}

module.exports = new ConfigManager();