# quick-command

[English Version](./README.en.md)

一个简单易用的命令行工具，让你可以用短别名代替长命令。

## 快速开始（5 分钟上手）

### 1. 安装

```bash
npm install -g quick-command
```

### 2. 创建你自己的配置文件

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

### 3. 链接到 qcmd

```bash
qcmd link ./my-commands.json
```

之后 `qcmd add` 添加的别名会自动同步到这个 JSON 文件。

### 4. 配置 Shell 集成

```bash
qcmd shell --setup
source ~/.zshrc
```

### 5. 试试看

```bash
gs              # 等于 git status
gc "hello"     # 等于 git commit -m 'hello'
cdproj         # 等于 cd ~/project（当前目录切换！）
```

## 添加别名

### 简单命令

```bash
qcmd add st "npm start"
qcmd add t "npm test"
```

### cd 类命令（当前目录切换）

```bash
qcmd add cdproj "cd ~/project"
cdproj         # 直接切换到 ~/project
```

### 带参数的命令

```bash
qcmd add gc "git commit -m '{{arg}}'"
gc "修复bug"       # 执行 git commit -m '修复bug'
```

### 多参数命令

```bash
qcmd add gpush "git push {{arg1}} {{arg2}}"
gpush main master   # 执行 git push main master
```

### 环境变量

```bash
qcmd add gh "echo {{env:HOME}}"
gh                  # 输出 /Users/你的用户名
```

## 两种别名类型

| 类型 | 说明 | 示例命令 |
|------|------|----------|
| Shell 脚本 | 普通命令，在子进程执行 | `gs`, `gc`, `ni` |
| Shell 函数 | cd 类命令，在当前 shell 执行 | `cdproj`, `pushd` |

`qcmd` 会自动判断：
- 以 `cd`、`pushd`、`popd` 开头的命令 → 生成 Shell 函数
- 其他命令 → 生成 Shell 脚本

## 命令列表

| 命令 | 描述 |
|------|------|
| add | 添加新别名（自动同步到 JSON） |
| delete | 删除别名（自动同步到 JSON） |
| list | 列出所有别名 |
| preview | 预览别名详情 |
| export | 导出配置（简单 JSON 格式） |
| link | 链接 JSON 文件 |
| sync | 同步别名 |
| source | 查看链接的 JSON |
| unlink | 取消链接 |
| shell | 配置 Shell 集成 |
| doctor | 诊断问题 |

### link - 链接 JSON 文件

```bash
qcmd link ./my-commands.json    # 链接 JSON 文件
```

链接后：
- `qcmd add` 添加的别名会自动同步到 JSON 文件
- `qcmd sync` 从 JSON 文件同步别名到本地

### add - 添加别名

```bash
qcmd add gs "git status"                          # 简单命令
qcmd add gc "git commit -m '{{arg}}'"            # 带参数
qcmd add cdproj "cd ~/project"                    # cd 类命令
```

选项：
- `-f, --force` - 强制覆盖已存在的别名

### sync - 同步别名

```bash
qcmd sync    # 从链接的 JSON 文件同步别名
```

**什么时候需要 sync**：
- 团队成员更新了共享的 JSON 文件
- 你手动编辑了 JSON 文件

### delete - 删除别名

```bash
qcmd delete gs    # 删除 gs 别名
```

### list - 列出别名

```bash
qcmd list
# 输出：
# gs: git status (script)
# cdproj: cd ~/project (function)
```

### export - 导出配置

```bash
qcmd export ./backup.json
```

导出的格式是简单 JSON（不含 metadata）。

### shell - 配置 Shell 集成

```bash
qcmd shell --setup    # 添加配置
qcmd shell --check   # 检查配置状态
qcmd shell --remove  # 移除配置
```

`--setup` 会修改你的 shell 配置文件：
- `bin/` 目录加入 PATH（普通脚本）
- `functions/` 目录 sourcing（Shell 函数）

配置后需要 `source ~/.zshrc` 生效。

### doctor - 诊断问题

```bash
qcmd doctor
```

会检查：
- bin 和 functions 目录是否存在
- Shell 集成是否已配置
- 配置文件是否正常
- 文件权限是否正确

## 占位符

| 占位符 | 说明 | 示例 |
|--------|------|------|
| `{{arg}}` | 第一个参数 | `git commit -m '{{arg}}'` |
| `{{arg1}}` `{{arg2}}` | 第1、2个参数 | `git push {{arg1}} {{arg2}}` |
| `{{*args}}` | 所有剩余参数 | `git add {{*args}}` |
| `{{env:VAR}}` | 环境变量 | `echo {{env:HOME}}` |
| `{{cwd}}` | 当前目录 | `cd {{cwd}}` |
| `{{date}}` | 当前日期 | `mkdir proj-{{date}}` |
| `{{time}}` | 当前时间 | `log-{{time}}.txt` |

## 文件说明

### 创建的文件

```
~/.quick-cmd/
├── bin/           # Shell 脚本
│   ├── gs
│   ├── gc
│   └── ...
├── functions/     # Shell 函数（cd 类命令）
│   ├── cdproj
│   └── ...
└── command.json  # 本地配置
```

### Shell 配置文件

会在 `~/.zshrc` 追加：

```bash
# quick-cmd
for f in $HOME/.quick-cmd/functions/*; do source "$f" 2>/dev/null || true; done
export PATH="$HOME/.quick-cmd/bin:$PATH"
```

## 常见问题

### qcmd 命令报错：unknown command

`qcmd` 的子命令是 `add`、`delete`、`list` 等，别名（如 `gs`、`cdproj`）是直接在终端运行的。

### cdproj 报错：command not found

运行 `qcmd shell --setup` 并 `source ~/.zshrc`。

### 改了 JSON 文件，别名没变

运行 `qcmd sync` 同步。

### doctor 显示 "NOT configured"

运行 `qcmd shell --setup`。

## 使用示例

### 个人使用

```bash
# 创建配置
cat > my-commands.json << 'EOF'
{
    "gs": "git status",
    "gc": "git commit -m '{{arg}}'",
    "cdproj": "cd ~/project"
}
EOF

# 链接并配置
qcmd link ./my-commands.json
qcmd shell --setup
source ~/.zshrc

# 添加更多别名
qcmd add st "npm start"
qcmd add t "npm test"

# 使用
gs
gc "hello"
cdproj
```

### 团队共享配置

```bash
# 克隆团队配置
git clone https://github.com/team/qcmd-config.git
cd qcmd-config

# 链接使用
qcmd link ./my-commands.json
qcmd shell --setup
source ~/.zshrc

# 同步更新
git pull
qcmd sync
```
