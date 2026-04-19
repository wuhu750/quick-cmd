const os = require('os');
const { spawn } = require('child_process');

class TemplateEngine {
    constructor() {
        this.patterns = [
            { regex: /\{\{arg(\d+)\}\}/g, handler: this.handleNamedArg.bind(this) },
            { regex: /\{\{arg\}\}/g, handler: this.handleFirstArg.bind(this) },
            { regex: /\{\{\*args\}\}/g, handler: this.handleRestArgs.bind(this) },
            { regex: /\{\{env:(\w+)\}\}/g, handler: this.handleEnv.bind(this) },
            { regex: /\{\{cwd\}\}/g, handler: this.handleCwd.bind(this) },
            { regex: /\{\{date\}\}/g, handler: this.handleDate.bind(this) },
            { regex: /\{\{time\}\}/g, handler: this.handleTime.bind(this) },
            { regex: /\{\{alias\}\}/g, handler: this.handleAlias.bind(this) },
        ];
    }

    process(template, context) {
        let result = template;
        const usedPlaceholders = [];
        const args = context.args || [];

        for (const pattern of this.patterns) {
            result = result.replace(pattern.regex, (match, ...groups) => {
                usedPlaceholders.push(match);
                return pattern.handler(groups, context);
            });
        }

        const remainingArgs = args.filter(arg => !usedPlaces(arg, usedPlaceholders));
        const remainingStr = remainingArgs
            .map(arg => this.quoteArg(arg))
            .join(' ');

        return {
            command: result + (remainingStr ? ' ' + remainingStr : ''),
            usedPlaceholders,
        };
    }

    usedPlaces(arg, used) {
        return used.some(u => u.includes(arg));
    }

    handleNamedArg(groups) {
        const index = parseInt(groups[0], 10) - 1;
        return groups[index] || `{{arg${groups[0]}}}`;
    }

    handleFirstArg(groups, context) {
        const args = context.args || [];
        const arg = args[0] || '{{arg}}';
        return this.quoteArg(arg);
    }

    handleRestArgs(groups, context) {
        const args = context.args || [];
        return args.map(arg => this.quoteArg(arg)).join(' ');
    }

    handleEnv(groups) {
        const varName = groups[0];
        return process.env[varName] || `{{env:${varName}}}`;
    }

    handleCwd() {
        return process.cwd();
    }

    handleDate() {
        return new Date().toISOString().split('T')[0];
    }

    handleTime() {
        return new Date().toISOString().split('T')[1].replace('Z', '');
    }

    handleAlias(groups, context) {
        return context.alias || '{{alias}}';
    }

    quoteArg(arg) {
        if (arg.includes(' ') || arg.includes('"') || arg.includes("'")) {
            return `"${arg.replace(/"/g, '\\"')}"`;
        }
        return arg;
    }
}

module.exports = new TemplateEngine();