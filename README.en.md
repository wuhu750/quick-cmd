# quick-cmd (qcmd)

[中文版本](./README.md)

A lightweight command-line tool for creating shortcut command aliases to improve development efficiency. By simplifying commonly used long commands into short aliases, it enables quick execution of various development-related operations.

## Project Introduction

quick-cmd is a command-line tool that allows users to create short aliases for frequently used commands. It is particularly suitable for complex commands that need to be executed frequently, such as those in Node.js, NPM, Git and other toolchains. With quick-cmd, you can simplify `git commit -m "message"` to `gc "message"`, or `npm install -g @vue/cli` to `nig @vue/cli`.

The tool creates a `.quick-cmd` directory in the user's home directory to store configurations and command aliases, and supports importing/exporting configurations.

## Project Advantages

1. **Improved Efficiency**: Simplify commonly used complex commands into short aliases, reducing typing time
2. **Easy to Use**: Provides an intuitive command-line interface that is simple to learn
3. **Flexible Configuration**: Supports adding, deleting, viewing and managing command aliases
4. **Persistent Storage**: Configurations are saved in the user's home directory for cross-session use
5. **Out of the Box**: Built-in common Node.js, NPM, Git, Yarn command aliases

## Installation

```bash
npm install -g quick-command
```

Or using yarn:

```bash
yarn global add quick-command
```

After installation, you can use the `qcmd` commands.

## Command Description

| Command | Alias | Description |
|---------|-------|-------------|
| install | i | Install commands from JSON file |
| add | a | Add new command |
| delete | d | Delete command |
| list | l | List all commands |
| preview | p | Preview command information |
| export | e | Export commands to JSON file |

## Command Details

### install (i) - Install commands from JSON file

Parameters:
- `[jsonPath]` - JSON file path, uses built-in configuration by default

Example configuration file:
```json
{
    "gs": "git status",
    "gc": "git commit -m \"{{arg}}\"",
    "nv": "node -v"
}
```

Usage examples:
```bash
qcmd install                 # Install default commands
qcmd i ./my-commands.json   # Install commands from specified file
```

Default commands see: [Default Commands](#default-commands)

### add (a) - Add new command to configuration file

Parameters:
- `alias` - Command alias
- `command` - Actual command to execute

Usage examples:
```bash
qcmd add gs "git status"                           # Add simple command alias
qcmd a gc "git commit -m \"{{arg}}\""             # Add parameterized command alias
qcmd a nr "npm run {{arg}}"                       # Add parameterized npm command alias
```

### delete (d) - Delete command

Parameters:
- `[alias]` - Command alias to delete, if not provided, delete all commands

Usage examples:
```bash
qcmd delete gs     # Delete gs command
qcmd d gc          # Delete gc command
qcmd d             # Delete all commands
```

### list (l) - List all configured commands

Usage examples:
```bash
qcmd list
# or
qcmd l
```

### preview (p) - Preview command information

Parameters:
- `alias` - Command alias to preview
Options:
- `-f, --full` - Show full command content

Usage examples:
```bash
qcmd preview gc     # View gc command
qcmd p gc -f        # View full gc command content
qcmd p nr           # View nr command
```

### export (e) - Export commands to specified JSON file

Parameters:
- `[jsonPath]` - Export JSON file path

Usage examples:
```bash
qcmd export ./my-commands.json    # Export commands to specified file
qcmd e ./backup.json              # Export commands to backup file
```

### Default Commands

If default commands are installed, the tool will create the following commands:

```json
{
    "nv": "node -v",
    "n": "node",
    "ni": "npm i",
    "nr": "npm run {{arg}}",
    "nls": "npm ls",
    "nun": "npm uninstall {{arg}}",
    "ns": "npm start",
    "nt": "npm test",

    "gs": "git status",
    "ga": "git add {{arg}}",
    "gaa": "git add .",
    "gc": "git commit -m \"{{arg}}\"",
    "gca": "git commit --amend",
    "gp": "git push",
    "gpf": "git push --force",
    "gpu": "git push -u origin {{arg}}",
    "gl": "git pull",
    "gco": "git checkout {{arg}}",
    "gcob": "git checkout -b {{arg}}",
    "gb": "git branch",
    "gba": "git branch -a",
    "gbd": "git branch -d {{arg}}",
    "gm": "git merge {{arg}}",
    "gd": "git diff",
    "gds": "git diff --staged",
    "grs": "git reset",
    "grh": "git reset --hard",
    "gcl": "git clone {{arg}}",
    "glog": "git log --oneline",
    "gsh": "git show",

    "yi": "yarn install",
    "ya": "yarn add {{arg}}",
    "yad": "yarn add -D {{arg}}",
    "yag": "yarn global add {{arg}}",
    "yr": "yarn run {{arg}}",
    "yt": "yarn test",
    "yrm": "yarn remove {{arg}}",
    "yup": "yarn upgrade {{arg}}",
    "yls": "yarn list --depth=0"
}
```