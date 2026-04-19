const logger = require('../utils/logger');

const SHELL_BUILTINS = [
    'exit', 'cd', 'pwd', 'echo', 'export', 'source', 'alias', 'unalias',
    'history', 'clear', 'logout', 'fg', 'bg', 'jobs', 'kill', 'return',
    'break', 'continue', 'eval', 'exec', 'shift', 'set', 'unset', 'test',
];

const RESERVED_NAMES = [
    'qcmd', 'quickcmd', 'node', 'npm', 'yarn', 'pnpm', 'python', 'python3',
    'ruby', 'perl', 'php', 'bash', 'zsh', 'fish', 'sh', 'dash',
];

const DANGEROUS_PATTERNS = [
    { pattern: /rm\s+-rf\s+\//, message: 'Dangerous: rm -rf /' },
    { pattern: /:\(\)\{/, message: 'Suspicious: bash function definition' },
    { pattern: />\s*\/dev\/null/, message: 'Output hidden with > /dev/null' },
    { pattern: /\$\(/, message: 'Command substitution may execute arbitrary code' },
    { pattern: /`/, message: 'Backticks may execute arbitrary code' },
];

class Validator {
    validateAliasName(alias) {
        const errors = [];

        if (!alias || alias.length < 1 || alias.length > 32) {
            errors.push(`Alias must be 1-32 characters, got ${alias.length}`);
        }

        if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(alias)) {
            errors.push('Alias must start with a letter, followed by letters, numbers, underscores, or hyphens');
        }

        if (RESERVED_NAMES.includes(alias.toLowerCase())) {
            errors.push(`Alias '${alias}' is a reserved name`);
        }

        if (SHELL_BUILTINS.includes(alias.toLowerCase())) {
            errors.push(`Alias '${alias}' conflicts with shell builtin`);
        }

        return { valid: errors.length === 0, errors };
    }

    validateCommand(command) {
        const warnings = [];

        for (const { pattern, message } of DANGEROUS_PATTERNS) {
            if (pattern.test(command)) {
                warnings.push(message);
            }
        }

        return { safe: warnings.length === 0, warnings };
    }

    checkConflict(alias) {
        return new Promise((resolve) => {
            const { execSync } = require('child_process');
            try {
                const result = execSync(`type ${alias} 2>/dev/null`, { encoding: 'utf-8' });
                resolve({ conflicts: true, message: result.trim() });
            } catch {
                resolve({ conflicts: false });
            }
        });
    }
}

module.exports = new Validator();