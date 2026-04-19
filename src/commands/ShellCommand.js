const path = require('path');
const os = require('os');
const FileSystem = require('../infrastructure/FileSystem');
const logger = require('../utils/logger');
const { FunctionsDir } = require('../utils/constants');

const SHELL_CONFIG = {
    zsh: {
        rcFile: '.zshrc',
        line: 'for f in $HOME/.quick-cmd/functions/*; do source "$f" 2>/dev/null || true; done',
    },
    bash: {
        rcFile: '.bashrc',
        line: 'for f in $HOME/.quick-cmd/functions/*; do source "$f" 2>/dev/null || true; done',
    },
    fish: {
        rcFile: '.config/fish/config.fish',
        line: 'for f in $HOME/.quick-cmd/functions/*; eval (cat "$f" | sed \'s/^/function /; s/{$/end/; s/}/end/\'); end',
    },
};

class ShellCommand {
    get name() { return 'shell'; }
    get description() { return 'Setup shell integration'; }
    get alias() { return 'sh'; }

    detectShell() {
        const shellPath = process.env.SHELL || '/bin/bash';
        for (const [name, cfg] of Object.entries(SHELL_CONFIG)) {
            if (shellPath.includes(name)) return { name, ...cfg };
        }
        return { name: 'bash', ...SHELL_CONFIG.bash };
    }

    async getRcContent(rcPath) {
        const exists = await FileSystem.exists(rcPath);
        if (!exists) return '';
        return await FileSystem.readFile(rcPath);
    }

    async writeRc(rcPath, content) {
        await FileSystem.ensureDir(path.dirname(rcPath));
        await FileSystem.writeFile(rcPath, content);
    }

    async check() {
        const shell = this.detectShell();
        const rcPath = path.join(os.homedir(), shell.rcFile);
        const content = await this.getRcContent(rcPath);
        return content.includes('.quick-cmd/functions');
    }

    async setup() {
        const shell = this.detectShell();
        const rcPath = path.join(os.homedir(), shell.rcFile);
        const content = await this.getRcContent(rcPath);

        if (content.includes('.quick-cmd/functions')) {
            logger.info('Functions already configured in', shell.rcFile);
            return;
        }

        const newContent = content + '\n# quick-cmd\n' + shell.line + '\n';
        await this.writeRc(rcPath, newContent);
        logger.success(`Added function sourcing to ${shell.rcFile}`);
        logger.info(`Run: source ${shell.rcFile}`);
    }

    async remove() {
        const shell = this.detectShell();
        const rcPath = path.join(os.homedir(), shell.rcFile);
        const content = await this.getRcContent(rcPath);

        const filtered = content
            .split('\n')
            .filter(line => !line.includes('.quick-cmd/functions'))
            .filter(line => !line.includes('.quick-cmd/bin'))
            .filter(line => !line.includes('# quick-cmd'))
            .join('\n');

        await this.writeRc(rcPath, filtered);
        logger.success(`Removed quick-cmd config from ${shell.rcFile}`);
    }

    async status() {
        const shell = this.detectShell();
        const rcPath = path.join(os.homedir(), shell.rcFile);
        const configured = await this.check();

        logger.info(`Shell: ${shell.name}`);
        logger.info(`Config: ~/${shell.rcFile}`);
        logger.info(`Functions configured: ${configured ? 'Yes' : 'No'}`);
        return { shell: shell.name, configured };
    }

    async execute(args, options) {
        if (options.check) {
            const configured = await this.check();
            console.log(configured ? 'Functions are configured' : 'Functions NOT configured (run: qcmd shell --setup)');
            return;
        }
        if (options.setup) return this.setup();
        if (options.remove) return this.remove();
        return this.status();
    }
}

module.exports = new ShellCommand();
