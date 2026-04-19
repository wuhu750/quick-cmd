const fs = require('fs').promises;
const path = require('path');

class FileSystem {
    async readFile(filePath, encoding = 'utf-8') {
        return fs.readFile(filePath, encoding);
    }

    async writeFile(filePath, content, encoding = 'utf-8') {
        const dir = path.dirname(filePath);
        await this.ensureDir(dir);
        return fs.writeFile(filePath, content, encoding);
    }

    async appendFile(filePath, content, encoding = 'utf-8') {
        return fs.appendFile(filePath, content, encoding);
    }

    async copyFile(src, dest) {
        await this.ensureDir(path.dirname(dest));
        return fs.copyFile(src, dest);
    }

    async exists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    async remove(filePath) {
        try {
            await fs.unlink(filePath);
            return true;
        } catch {
            return false;
        }
    }

    async chmod(filePath, mode) {
        return fs.chmod(filePath, mode);
    }

    async readDir(dirPath) {
        return fs.readdir(dirPath);
    }

    async ensureDir(dirPath) {
        await fs.mkdir(dirPath, { recursive: true });
    }

    async isDirectory(filePath) {
        try {
            const stat = await fs.stat(filePath);
            return stat.isDirectory();
        } catch {
            return false;
        }
    }
}

module.exports = new FileSystem();