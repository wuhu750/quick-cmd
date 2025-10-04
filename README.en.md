# quick-command

[中文版本](./README.md)

A lightweight command-line tool for creating shortcut command aliases to improve development efficiency. By simplifying commonly used long commands into short aliases, it enables quick execution of various development-related operations.

## Project Introduction

quick-command is a command-line tool that allows users to create short aliases for frequently used commands. It is particularly suitable for complex commands that need to be executed frequently, such as those in Node.js, NPM, Git and other toolchains. With quick-cmd, you can simplify `git commit -m "message"` to `gc "message"`, or `npm install -g @vue/cli` to `nig @vue/cli`.

The tool creates a `.quick-cmd` directory in the user's home directory to store configurations and command aliases, and supports importing/exporting configurations.

## Project Advantages

1. **Improved Efficiency**: Simplify commonly used complex commands into short aliases, reducing typing time
2. **Easy to Use**: Provides an intuitive command-line interface that is simple to learn
3. **Flexible Configuration**: Supports adding, deleting, viewing and managing command aliases
4. **Persistent Storage**: Configurations are saved in the user's home directory for cross-session use

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
| delete | `d` or `r` or `remove` | Delete command |
| list | `l` or `list` | List all commands |
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

## Adding to PATH (Important)

After installing commands with `qcmd i`, you need to add the command directory to your system's PATH environment variable to use the shortcuts directly from the terminal.

### For macOS and Linux users:

Add the following line to your shell configuration file (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
export PATH="$HOME/.quick-cmd/bin:$PATH"
```

Then reload your shell configuration:
```bash
source ~/.bashrc   # or source ~/.zshrc
```

### Default Commands

If default commands are installed, the tool will create the following commands:

```json
{
    "nv": "node -v",

    "c": "clear",

    "ni": "npm i",
    "nr": "npm run {{arg}}",

    "ggs": "git status",
    "gadd": "git add {{arg}}",
    "gpush": "git push origin HEAD",
    "ggl": "git pull",
    "ggi": "git init",
    "ggc": "git commit -m '{{arg}}'",
    
    "yi": "yarn install",
    "ya": "yarn add {{arg}}",
    "y": "yarn",
    "yr": "yarn {{arg}}"
}
```