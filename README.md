# quick-command

[English Version](./README.en.md)

一个轻量级的命令行工具，用于创建快捷命令别名，提高开发效率。通过将常用的长命令简化为短别名，快速执行各种开发相关操作。 

## 项目介绍

quick-command 是一个命令行工具，允许用户为常用命令创建简短别名。它特别适用于需要频繁执行的复杂命令，如 Node.js、NPM、Git 等工具链中的命令。通过使用 quick-cmd，您可以将 `git commit -m "message"` 简化为 `gc "message"`，或将 `npm install -g @vue/cli` 简化为 `nig @vue/cli`。

该工具会在用户主目录下创建 `.quick-cmd` 目录来存储配置和命令别名，并支持导入/导出配置。

## 项目优势

1. **提高效率**：将常用的复杂命令简化为短别名，减少输入时间
2. **易于使用**：提供直观的命令行界面，简单易学
3. **灵活配置**：支持添加、删除、查看和管理命令别名
4. **持久化存储**：配置保存在用户主目录中，跨会话使用
5. **开箱即用**：内置常用的 Node.js、NPM、Git、Yarn 命令别名

## 安装

```bash
npm install -g quick-command
```

或者使用 yarn：

```bash
yarn global add quick-command
```

安装后可以使用 `qcmd` 命令。

## 命令说明

| 命令 | 别名 | 描述 |
|------|------|------|
| install | i | 从 JSON 文件安装命令 |
| add | a | 添加新命令 |
| delete | d | 删除命令 |
| list | l | 列出所有命令 |
| preview | p | 预览命令信息 |
| export | e | 导出命令到 JSON 文件 |

## 命令详解

### install (i) - 从 JSON 文件安装命令

参数：
- `[jsonPath]` - JSON 文件路径，默认使用内置配置

示例配置文件：
```json
{
    "gs": "git status",
    "gc": "git commit -m \"{{arg}}\"",
    "nv": "node -v"
}
```

使用示例：
```bash
qcmd install                 # 安装默认命令
qcmd i ./my-commands.json   # 从指定文件安装命令
```

默认命令 见：[默认命令](#默认命令)


### add (a) - 添加新命令到配置文件

参数：
- `alias` - 命令别名
- `command` - 实际要执行的命令

使用示例：
```bash
qcmd add gs "git status"                           # 添加简单命令别名
qcmd a gc "git commit -m \"{{arg}}\""             # 添加带参数的命令别名
qcmd a nr "npm run {{arg}}"                       # 添加带参数的npm命令别名
```

### delete (d) - 删除命令

参数：
- `[alias]` - 要删除的命令别名，如果不提供则删除所有命令

使用示例：
```bash
qcmd delete gs     # 删除 gs 命令
qcmd d gc          # 删除 gc 命令
qcmd d        # 删除所有命令
```

### list (l) - 列出所有已配置的命令

使用示例：
```bash
qcmd list
# or
qcmd l
```

### preview (p) - 预览命令信息

参数：
- `alias` - 要预览的命令别名
选项：
- `-f, --full` - 显示完整的命令内容

使用示例：
```bash
qcmd preview gc     # 查看 gc 命令
qcmd p gc -f        # 查看 gc 命令完整内容
qcmd p nr           # 查看 nr 命令
```

### export (e) - 导出命令到指定的 JSON 文件

参数：
- `[jsonPath]` - 导出的 JSON 文件路径

使用示例：
```bash
qcmd export ./my-commands.json    # 导出命令到指定文件
qcmd e ./backup.json             # 导出命令到备份文件
```

### 默认命令
如果安装默认命令，工具会创建以下命令：

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