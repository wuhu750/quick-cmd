# quick-command

[中文版本](./README.md)

A simple command-line tool that lets you use short aliases instead of long commands.

## Quick Start (5 minutes)

### 1. Install

```bash
npm install -g quick-command
```

### 2. Create your config file

```bash
cat > my-commands.json << 'EOF'
{
    "gs": "git status",
    "gc": "git commit -m '{{arg}}'",
    "ni": "npm i",
    "nr": "npm run {{arg}}",
    "cdproj": "cd ~/project"
}
EOF
```

### 3. Link to qcmd

```bash
qcmd link ./my-commands.json
```

Aliases added via `qcmd add` will auto-sync to this JSON file.

### 4. Configure Shell Integration

```bash
qcmd shell --setup
source ~/.zshrc
```

### 5. Try it out

```bash
gs              # equals git status
gc "hello"     # equals git commit -m 'hello'
cdproj         # equals cd ~/project (changes current directory!)
```

## Adding Aliases

### Simple Commands

```bash
qcmd add st "npm start"
qcmd add t "npm test"
```

### cd Commands (Directory Change)

```bash
qcmd add cdproj "cd ~/project"
cdproj         # directly switches to ~/project
```

### Commands with Arguments

```bash
qcmd add gc "git commit -m '{{arg}}'"
gc "fix bug"       # runs git commit -m 'fix bug'
```

### Multiple Arguments

```bash
qcmd add gpush "git push {{arg1}} {{arg2}}"
gpush main master   # runs git push main master
```

### Environment Variables

```bash
qcmd add eh "echo {{env:HOME}}"
eh                  # outputs /Users/yourname
```

## Two Types of Aliases

| Type | Description | Example |
|------|-------------|---------|
| Shell Script | Regular commands, run in subprocess | `gs`, `gc`, `ni` |
| Shell Function | cd-like commands, run in current shell | `cdproj`, `pushd` |

Automatic detection:
- Commands starting with `cd`, `pushd`, `popd` → Shell function
- Other commands → Shell script

## Command Reference

| Command | Description |
|---------|-------------|
| add | Add new alias (auto-syncs to JSON) |
| delete | Delete alias (auto-syncs to JSON) |
| list | List all aliases |
| preview | Preview alias details |
| export | Export config (simple JSON format) |
| link | Link JSON file |
| sync | Sync aliases |
| source | Show linked JSON info |
| unlink | Unlink |
| shell | Configure shell integration |
| doctor | Diagnose issues |

### link - Link JSON File

```bash
qcmd link ./my-commands.json    # Link JSON file
```

After linking:
- `qcmd add` syncs aliases to JSON automatically
- `qcmd sync` syncs from JSON to local

### add - Add Alias

```bash
qcmd add gs "git status"                          # Simple command
qcmd add gc "git commit -m '{{arg}}'"            # With argument
qcmd add cdproj "cd ~/project"                   # cd command
```

Options:
- `-f, --force` - Force overwrite existing alias

### sync - Sync Aliases

```bash
qcmd sync    # Sync from linked JSON file
```

**When to use sync**:
- Team member updated shared JSON
- You manually edited JSON

### delete - Delete Alias

```bash
qcmd delete gs    # Delete gs alias
```

### list - List Aliases

```bash
qcmd list
# Output:
# gs: git status (script)
# cdproj: cd ~/project (function)
```

### export - Export Config

```bash
qcmd export ./backup.json
```

Exports in simple JSON format (no metadata).

### shell - Configure Shell Integration

```bash
qcmd shell --setup    # Add configuration
qcmd shell --check   # Check configuration status
qcmd shell --remove  # Remove configuration
```

`--setup` modifies your shell config:
- Adds `bin/` to PATH (shell scripts)
- Adds function sourcing from `functions/` (shell functions)

After setup, run `source ~/.zshrc` to apply.

### doctor - Diagnose

```bash
qcmd doctor
```

Checks:
- bin and functions directories
- Shell integration configured
- Config file valid
- File permissions

## Placeholders

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{arg}}` | First argument | `git commit -m '{{arg}}'` |
| `{{arg1}}` `{{arg2}}` | 1st, 2nd argument | `git push {{arg1}} {{arg2}}` |
| `{{*args}}` | All remaining args | `git add {{*args}}` |
| `{{env:VAR}}` | Environment variable | `echo {{env:HOME}}` |
| `{{cwd}}` | Current directory | `cd {{cwd}}` |
| `{{date}}` | Current date | `mkdir proj-{{date}}` |
| `{{time}}` | Current time | `log-{{time}}.txt` |

## Files Created

```
~/.quick-cmd/
├── bin/           # Shell scripts
│   ├── gs
│   ├── gc
│   └── ...
├── functions/     # Shell functions (cd-like commands)
│   ├── cdproj
│   └── ...
└── command.json  # Local config
```

### Shell Config

Appends to `~/.zshrc`:

```bash
# quick-cmd
for f in $HOME/.quick-cmd/functions/*; do source "$f" 2>/dev/null || true; done
export PATH="$HOME/.quick-cmd/bin:$PATH"
```

## Common Issues

### qcmd says "unknown command"

`qcmd` subcommands are `add`, `delete`, `list` etc. Aliases like `gs`, `cdproj` are run directly in terminal.

### cdproj says "command not found"

Run `qcmd shell --setup` and `source ~/.zshrc`.

### Edited JSON but aliases didn't change

Run `qcmd sync`.

### doctor shows "NOT configured"

Run `qcmd shell --setup`.

## Examples

### Personal Use

```bash
# Create config
cat > my-commands.json << 'EOF'
{
    "gs": "git status",
    "gc": "git commit -m '{{arg}}'",
    "cdproj": "cd ~/project"
}
EOF

# Link and configure
qcmd link ./my-commands.json
qcmd shell --setup
source ~/.zshrc

# Add more aliases
qcmd add st "npm start"
qcmd add t "npm test"

# Use
gs
gc "hello"
cdproj
```

### Team Shared Config

```bash
# Clone team config
git clone https://github.com/team/qcmd-config.git
cd qcmd-config

# Link and use
qcmd link ./my-commands.json
qcmd shell --setup
source ~/.zshrc

# Sync updates
git pull
qcmd sync
```
