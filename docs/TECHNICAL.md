# quick-command 技术文档

## 项目概述

**项目名称**: quick-command (qcmd)
**版本**: 1.0.4+
**功能**: 命令行别名管理工具，将长命令简化为短别名
**适用场景**: 开发日常命令（git、npm、cd 等）

## 核心概念

### 两种别名类型

| 类型 | 生成位置 | 执行方式 | 适用场景 |
|------|----------|----------|----------|
| Shell 脚本 | `~/.quick-cmd/bin/` | 子进程执行 | 普通命令（git status、npm run） |
| Shell 函数 | `~/.quick-cmd/functions/` | 当前 shell 执行 | cd、pushd、popd（目录切换） |

**为什么需要区分**：
- `cd` 命令需要在当前 shell 执行才能切换目录
- 子进程执行完毕后目录切换会丢失（子进程的环境变化不影响父进程）

### 自动类型检测

`AliasManager.isShellFunction()` 判断命令类型：

```javascript
const SHELL_FUNCTION_COMMANDS = ['cd', 'pushd', 'popd'];
// 以这些命令开头的 → Shell 函数
// 其他 → Shell 脚本
```

## 目录结构

```
~/.quick-cmd/                      # 项目根目录（用户主目录）
├── bin/                           # Shell 脚本目录
│   ├── gs                          # git status
│   ├── gc                          # git commit
│   └── ...
├── functions/                     # Shell 函数目录
│   ├── cdmine                      # cd ~/mine
│   └── ...
├── backups/                       # 备份目录
└── command.json                   # 本地配置文件（v2 schema）
```

### Shell 配置文件追加内容

```bash
# quick-cmd 配置（追加到 ~/.zshrc 或 ~/.bashrc）
for f in $HOME/.quick-cmd/functions/*; do source "$f" 2>/dev/null || true; done
export PATH="$HOME/.quick-cmd/bin:$PATH"
```

## 命令行接口

### bin/index.js (CLI 入口)

使用 `commander.js` 解析命令行参数。

**可用命令**：

| 命令 | 参数 | 说明 |
|------|------|------|
| add | `<alias> <command>` | 添加别名 |
| delete | `<alias>` | 删除别名 |
| list | - | 列出所有别名 |
| preview | `<alias>` [-f] | 预览别名 |
| export | `[jsonPath]` | 导出配置 |
| link | `<jsonPath>` | 链接 JSON 文件 |
| sync | - | 从 JSON 同步别名 |
| unlink | - | 取消链接 |
| source | - | 查看链接的 JSON |
| shell | [--setup\|--check\|--remove] | Shell 集成配置 |
| doctor | - | 诊断问题 |

## 核心模块

### 1. AliasManager (src/core/AliasManager.js)

核心别名管理，处理所有别名相关的业务逻辑。

**主要方法**：

#### add(alias, command, options)
- 验证别名名称（Validator）
- 验证命令安全性（Validator）
- 检测命令类型（Shell 函数 vs 脚本）
- 生成对应文件（Shell 脚本或函数）
- 保存到本地 command.json
- 同步到源 JSON 文件（如果已 link）

#### delete(alias)
- 删除 bin/ 或 functions/ 中的文件
- 从 command.json 移除别名
- 同步更新源 JSON

#### sync()
- 从 link 的源 JSON 读取别名定义
- 对比当前配置和源配置
- 增量添加新别名（source='linked'）
- 增量删除已移除的别名（source='linked'）
- 用户手动添加的别名（source='user'）不会被 sync 删除

#### link(sourcePath)
- 验证文件存在
- 保存源路径到 command.json 的 metadata.source
- 立即执行 sync()

#### generateScript / generateFunction
- 将 quick-cmd 占位符转换为 shell 等价物
- 生成对应的文件内容

### 2. ConfigManager (src/core/ConfigManager.js)

本地配置文件的读写管理。

**JSON 格式 (v2 schema)**:

```json
{
    "version": 2,
    "metadata": {
        "source": "/path/to/source.json",
        "updated": "2024-01-01T00:00:00.000Z"
    },
    "aliases": {
        "gs": {
            "command": "git status",
            "description": "",
            "category": "default",
            "tags": [],
            "enabled": true,
            "source": "user|linked",
            "type": "script|function"
        }
    }
}
```

**简单 JSON 格式（源文件格式）**：

```json
{
    "gs": "git status",
    "gc": "git commit -m '{{arg}}'"
}
```

**主要方法**：

- `load()` - 读取本地 command.json
- `save(config)` - 保存到本地 command.json
- `saveToSource(config)` - 保存到本地 + 同步源 JSON（简单格式）
- `exportTo(jsonPath)` - 导出为简单 JSON 格式
- `importFrom(jsonPath)` - 从 JSON 导入（自动 v1 迁移）
- `setSource() / getSource()` - 管理 link 的源路径
- `loadFromSource()` - 从源 JSON 加载

### 3. Validator (src/core/Validator.js)

别名和命令的校验。

**别名校验规则**：
- 长度 1-32 字符
- 必须以字母开头
- 只能包含字母、数字、下划线、连字符
- 不能是保留名称（qcmd、node、npm 等）
- 不能是 shell 内置命令（exit、cd、pwd 等）

**命令安全校验**：
- 检测危险模式：`rm -rf /`
- 检测可疑模式：`:(){`（bash 函数定义）
- 检测隐藏输出：`> /dev/null`
- 检测命令替换：`$(...)`、反引号

### 4. ShellCommand (src/commands/ShellCommand.js)

Shell 集成配置管理。

**支持的 Shell**：

| Shell | 配置文件 | 配置内容 |
|-------|----------|----------|
| zsh | ~/.zshrc | for 循环 source functions/ |
| bash | ~/.bashrc | 同上 |
| fish | ~/.config/fish/config.fish | eval 转换函数定义 |

**主要方法**：

- `detectShell()` - 检测当前使用的 shell
- `setup()` - 添加配置到 shell 配置文件
- `remove()` - 移除配置（包括 # quick-cmd 注释）
- `check()` - 检查是否已配置
- `status()` - 显示配置状态

### 5. DoctorCommand (src/commands/DoctorCommand.js)

诊断工具，检查以下项目：

- bin 目录状态
- Shell 集成状态（functions/ 或 bin/ 配置）
- command.json 是否正常
- 文件权限
- 命令冲突检测（与系统命令冲突）

### 6. FileSystem (src/infrastructure/FileSystem.js)

异步文件操作封装，使用 `fs.promises`。

**方法**：readFile, writeFile, appendFile, copyFile, exists, remove, chmod, readDir, ensureDir, isDirectory

### 7. logger (src/utils/logger.js)

带颜色的日志输出，使用 `chalk` 库。

**方法**：info, warn, error, success

**输出格式**：`[HH:mm:ss] prefix message`

## 占位符系统

### 占位符 → Shell 等价转换

| 占位符 | Shell 等价 | 说明 |
|--------|------------|------|
| `{{arg}}` | `$1` | 第一个参数 |
| `{{arg1}}` | `$1` | 第一个参数 |
| `{{arg2}}` | `$2` | 第二个参数 |
| `{{*args}}` | `$@` | 所有剩余参数 |
| `{{env:VAR}}` | `${VAR}` | 环境变量 |
| `{{cwd}}` | `$(pwd)` | 当前目录 |
| `{{date}}` | `$(date +%Y-%m-%d)` | 当前日期 |
| `{{time}}` | `$(date +%H:%M:%S)` | 当前时间 |

### 转换示例

**输入命令**：`git commit -m '{{arg}}'`

**生成 Shell 脚本**：
```bash
#!/bin/bash
git commit -m "$1"
```

**输入命令**：`mkdir proj-{{date}}`

**生成 Shell 脚本**：
```bash
#!/bin/bash
mkdir proj-$(date +%Y-%m-%d)
```

## 生成的文件示例

### Shell 脚本（bin/）

```bash
#!/bin/bash
git status
```

权限：755

### Shell 函数（functions/）

```bash
cdmine() {
    cd ~/mine
}
```

权限：644

## 配置文件流程

### link 流程

```
1. qcmd link ./my-commands.json
2. ConfigManager.setSource() 保存源路径
3. AliasManager.sync() 被调用
4. 读取源 JSON 内容
5. 对比当前配置和源配置
6. 生成缺失的别名文件
7. 更新本地 command.json
```

### add 流程

```
1. qcmd add gs "git status"
2. Validator.validateAliasName() 校验名称
3. Validator.validateCommand() 校验命令
4. AliasManager.isShellFunction() 判断类型
5. AliasManager.writeAliasFile() 生成文件
6. ConfigManager.saveToSource() 保存到本地 + 同步源 JSON
```

### sync 流程

```
1. qcmd sync
2. ConfigManager.getSource() 获取源路径
3. ConfigManager.loadFromSource() 读取源 JSON
4. 对比 sourceAliases 和 currentAliases
5. 新增的别名 → 生成文件 + 添加到 config
6. 删除的别名（source='linked'）→ 删除文件 + 从 config 移除
7. ConfigManager.saveToSource() 同步更新源 JSON
```

## 迁移说明

### v1 → v2 自动迁移

当检测到 JSON 没有 `version` 字段时，自动迁移：

```javascript
// v1 格式
{ "gs": "git status" }

// v2 格式
{
    "version": 2,
    "metadata": { ... },
    "aliases": {
        "gs": { command: "git status", ... }
    }
}
```

## Shell 兼容性

### zsh / bash

配置行：
```bash
for f in $HOME/.quick-cmd/functions/*; do source "$f" 2>/dev/null || true; done
export PATH="$HOME/.quick-cmd/bin:$PATH"
```

### fish

配置行：
```bash
for f in $HOME/.quick-cmd/functions/*
    eval (cat "$f" | sed 's/^/function /; s/{$/end/; s/}/end/')
end
```

## 依赖

- `chalk` 4.1.2 - 彩色日志输出
- `commander` 8.3.0 - CLI 参数解析

## 关键文件路径常量 (src/utils/constants.js)

```javascript
ProjectDir       = ~/.quick-cmd/
BinDir          = ~/.quick-cmd/bin/
FunctionsDir    = ~/.quick-cmd/functions/
BackupDir       = ~/.quick-cmd/backups/
CommandsJsonPath = ~/.quick-cmd/command.json
```

## 注意事项

1. **Shell 函数限制**：Shell 函数文件权限 644，被 source 后才生效
2. **子进程限制**：普通 Shell 脚本在子进程执行，无法改变当前 shell 的工作目录
3. **源文件保护**：只有通过 link 的源 JSON 会被自动同步，手动编辑的 JSON 不会
4. **冲突检测**：使用 `type` 命令检测，会排除 .quick-cmd/bin/ 内的别名
