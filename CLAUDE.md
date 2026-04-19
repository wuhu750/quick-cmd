# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**详细技术文档**: [docs/TECHNICAL.md](./docs/TECHNICAL.md) - 包含完整的架构、流程、模块说明。

## 项目概述

`quick-command` 是一个命令行别名管理工具，将长命令简化为短别名。核心特点是区分两种类型：
- **Shell 脚本**（bin/）：普通命令，在子进程执行
- **Shell 函数**（functions/）：cd 类命令，在当前 shell 执行

## 架构

- **入口**: `bin/index.js` — 使用 commander.js 解析 CLI
- **核心管理**: `src/core/AliasManager.js` — 别名 CRUD、自动类型检测、占位符转换
- **配置管理**: `src/core/ConfigManager.js` — v2 schema、本地配置、源 JSON 同步
- **校验**: `src/core/Validator.js` — 别名校验、命令安全检查
- **Shell 集成**: `src/commands/ShellCommand.js` — 自动配置 zsh/bash/fish
- **诊断**: `src/commands/DoctorCommand.js` — 检查配置问题

## 关键路径 (src/utils/constants.js)

```
~/.quick-cmd/
├── bin/              # Shell 脚本（普通命令）
├── functions/        # Shell 函数（cd 类命令）
├── command.json      # 本地配置（v2 schema）
```

## 两种别名类型

| 类型 | 生成位置 | 执行方式 | 检测方式 |
|------|----------|----------|----------|
| Shell 脚本 | bin/ | 子进程 | 其他命令 |
| Shell 函数 | functions/ | 当前 shell | 以 cd/pushd/popd 开头 |

## CLI 命令

```bash
qcmd add <alias> <command>      # 添加别名（自动同步到 JSON）
qcmd delete <alias>             # 删除别名
qcmd list                       # 列出所有别名
qcmd preview <alias>           # 预览别名
qcmd export [path]             # 导出配置（简单 JSON）
qcmd link <jsonPath>           # 链接 JSON 文件
qcmd sync                      # 从 JSON 同步别名
qcmd unlink                    # 取消链接
qcmd source                    # 查看链接的 JSON
qcmd shell --setup             # 配置 Shell 集成
qcmd shell --check             # 检查配置状态
qcmd shell --remove            # 移除配置
qcmd doctor                    # 诊断问题
```

## 占位符转换 (src/core/AliasManager.js)

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

## JSON 配置格式

**本地 command.json（v2 schema）**:
```json
{
    "version": 2,
    "metadata": { "source": "/path/to/json" },
    "aliases": {
        "gs": { "command": "git status", "type": "script" },
        "cdproj": { "command": "cd ~/project", "type": "function" }
    }
}
```

**源 JSON 文件（简单格式）**:
```json
{
    "gs": "git status",
    "cdproj": "cd ~/project"
}
```

## 重要行为

1. `qcmd add` 添加的别名会自动同步到 link 的源 JSON 文件
2. `qcmd sync` 从源 JSON 同步，增量添加/删除
3. `source='linked'` 的别名才会被 sync 删除
4. `source='user'` 的别名是用户手动添加的，不会被 sync 影响

## 开发测试

```bash
npm link                      # 本地链接
qcmd shell --setup            # 配置 Shell
qcmd link ./my-commands.json  # 链接测试 JSON
qcmd sync                     # 同步测试
qcmd doctor                   # 检查配置
```
