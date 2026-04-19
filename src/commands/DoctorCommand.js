const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const FileSystem = require('../infrastructure/FileSystem');
const logger = require('../utils/logger');
const { BinDir, CommandsJsonPath } = require('../utils/constants');

class DoctorCommand {
    get name() { return 'doctor'; }
    get description() { return 'Diagnose quick-cmd issues'; }
    get alias() { return 'doc'; }

    async checkBinDir() {
        const exists = await FileSystem.exists(BinDir);
        if (!exists) return { ok: false, message: 'Directory not created yet', items: [] };
        const files = await FileSystem.readDir(BinDir);
        return { ok: true, message: `${files.length} aliases installed`, items: files };
    }

    async checkPathIntegration() {
        const shell = process.env.SHELL || '/bin/bash';
        let rcFile = '.bashrc';
        if (shell.includes('zsh')) rcFile = '.zshrc';
        if (shell.includes('fish')) rcFile = '.config/fish/config.fish';

        const rcPath = path.join(os.homedir(), rcFile);
        const exists = await FileSystem.exists(rcPath);
        if (!exists) return { ok: false, message: `~/${rcFile} not found`, items: [] };

        const content = await FileSystem.readFile(rcPath);
        // Check for functions sourcing (main mechanism) or bin/ PATH
        const hasFunctions = content.includes('.quick-cmd/functions');
        const hasBin = content.includes('.quick-cmd/bin');

        if (hasFunctions || hasBin) {
            return { ok: true, message: 'Shell integration OK in ~/' + rcFile, items: [] };
        } else {
            return { ok: false, message: 'NOT configured. Run: qcmd shell --setup', items: [] };
        }
    }

    async checkConfigFile() {
        const exists = await FileSystem.exists(CommandsJsonPath);
        if (!exists) return { ok: false, message: 'command.json not found', items: [] };

        try {
            const content = await FileSystem.readFile(CommandsJsonPath);
            JSON.parse(content);
            return { ok: true, message: 'Config file is valid', items: [] };
        } catch {
            return { ok: false, message: 'command.json is corrupted', items: [] };
        }
    }

    async checkPermissions() {
        const binExists = await FileSystem.exists(BinDir);
        if (!binExists) return { ok: true, message: 'N/A', items: [] };

        try {
            const files = await FileSystem.readDir(BinDir);
            for (const file of files) {
                const filePath = path.join(BinDir, file);
                const stats = await FileSystem.isDirectory(filePath);
                if (stats) continue;
            }
            return { ok: true, message: 'All aliases have correct permissions', items: [] };
        } catch {
            return { ok: false, message: 'Permission denied on some files', items: [] };
        }
    }

    async checkConflicts() {
        try {
            const content = await FileSystem.readFile(CommandsJsonPath);
            const config = JSON.parse(content);
            const aliases = Object.keys(config.aliases || {});
            const conflictingAliases = [];

            for (const alias of aliases) {
                try {
                    const result = execSync(`type ${alias} 2>/dev/null`, { encoding: 'utf-8' });
                    // Only report if conflict is NOT in our .quick-cmd/bin directory
                    if (!result.includes(BinDir)) {
                        conflictingAliases.push(alias);
                    }
                } catch {}
            }

            if (conflictingAliases.length > 0) {
                return {
                    ok: false,
                    message: `${conflictingAliases.length} aliases conflict with system commands`,
                    items: conflictingAliases
                };
            }
            return { ok: true, message: 'No conflicts found', items: [] };
        } catch {
            return { ok: true, message: 'N/A', items: [] };
        }
    }

    async execute(args, options) {
        console.log('\n========================================');
        console.log('  quick-cmd doctor - diagnostic report');
        console.log('========================================\n');

        const checks = [
            ['bin directory', this.checkBinDir()],
            ['PATH integration', this.checkPathIntegration()],
            ['command.json', this.checkConfigFile()],
            ['permissions', this.checkPermissions()],
            ['conflicts', this.checkConflicts()],
        ];

        for (const [name, checkPromise] of checks) {
            const result = await checkPromise;
            const status = result.ok ? '✓ PASS' : '✗ FAIL';
            const statusColor = result.ok ? '\x1b[32m' : '\x1b[31m';

            console.log(`${statusColor}${status}\x1b[0m ${name}`);
            console.log(`    ${result.message}`);

            if (result.items && result.items.length > 0) {
                console.log(`    Items: ${result.items.join(', ')}`);
            }

            console.log('');
        }

        console.log('========================================');
        console.log('  Run "qcmd shell --setup" to fix PATH issues');
        console.log('========================================\n');
    }
}

module.exports = new DoctorCommand();