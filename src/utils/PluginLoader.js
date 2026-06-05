const path     = require('path');
const fs       = require('fs');
const chokidar = require('chokidar');
const chalk    = require('chalk'); 
const readline = require('readline');

/**
 * PluginLoader — support DUA format export:
 *
 * Format LAMA (object of functions):
 * module.exports = { ping: async (ctx) => {...}, menu: async (ctx) => {...} }
 *
 * Format BARU (switch case):
 * module.exports = async (ctx) => {
 *   switch (ctx.command.name) {
 *     case 'ping': ...; break;
 *     case 'menu': ...; break;
 *   }
 * }
 */

const SRC_ROOT  = path.join(__dirname, '..');
const PROJ_ROOT = path.join(__dirname, '..', '..');
const LIB_ROOT  = path.join(PROJ_ROOT, 'lib');

function purgeCache(filePath) {
    let resolved;
    try { resolved = require.resolve(filePath); } catch { return; }

    const mod = require.cache[resolved];
    if (!mod) return;

    delete require.cache[resolved];

    for (const child of mod.children || []) {
        if ((child.id.startsWith(SRC_ROOT) || child.id.startsWith(LIB_ROOT)) && require.cache[child.id]) {
            purgeCache(child.id);
        }
    }
}

class PluginLoader {
    constructor() {
        this.plugins = {};
        this.files   = {};
        this.folder  = path.join(SRC_ROOT, 'commands');
    }

    _scanFiles() {
        return fs.readdirSync(this.folder)
            .filter(f => f.endsWith('.js'))
            .map(f => path.join(this.folder, f));
    }

    _loadFile(filePath) {
        purgeCache(filePath);

        if (this.files[filePath]) {
            this.files[filePath].forEach(cmd => delete this.plugins[cmd]);
            delete this.files[filePath];
        }

        try {
            const mod = require(filePath);
            if (!mod) return;

            const fileContent = fs.readFileSync(filePath, 'utf8');
            const caseRegex = /case\s+['"]([^'"]+)['"]\s*:/g;
            const autoCommands = [];
            let match;

            while ((match = caseRegex.exec(fileContent)) !== null) {
                if (!autoCommands.includes(match[1])) autoCommands.push(match[1]);
            }

            const cmds = autoCommands.length > 0 ? autoCommands : (mod.commands || []);
            const loaded = [];

            if (typeof mod === 'function') {
                for (const name of cmds) {
                    this.plugins[name] = (ctx) => mod(ctx);
                    loaded.push(name);
                }
            } else if (typeof mod === 'object') {
                for (const [name, fn] of Object.entries(mod)) {
                    if (typeof fn === 'function') {
                        this.plugins[name] = fn;
                        loaded.push(name);
                    }
                }
            } else {
                console.warn(chalk.yellow(`[WARN] Format tidak dikenal: ${path.basename(filePath)}`));
                return;
            }

            this.files[filePath] = loaded;
            console.log(
                chalk.green(`[SUCCESS] Loaded `) +
                chalk.cyan(path.basename(filePath)) +
                chalk.green(` -> [${loaded.length} Commands Otomatis]`)
            );
        } catch (err) {
            console.error(
                chalk.red(`[ERROR] Gagal memuat `) +
                chalk.cyan(path.basename(filePath)) +
                chalk.red(`: ${err.message}`)
            );
        }
    }

    _unloadFile(filePath) {
        if (this.files[filePath]) {
            const removed = this.files[filePath];
            removed.forEach(cmd => delete this.plugins[cmd]);
            delete this.files[filePath];
            console.log(
                chalk.gray(`[-] Unloaded `) +
                chalk.cyan(path.basename(filePath)) +
                chalk.gray(` -> [${removed.join(', ')}]`)
            );
        }
    }

    _reloadAllCommands(changedFile) {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);

        const rel = path.relative(PROJ_ROOT, changedFile);
        console.log(
            chalk.red(`\n[UPDATE]`) +
            chalk.yellow(` Dependency berubah: `) +
            chalk.cyan(rel) +
            chalk.yellow(` → reload semua command...`)
        );

        for (const f of this._scanFiles()) this._loadFile(f);

        console.log(chalk.blue(`[LOADER] ${Object.keys(this.plugins).length} command aktif`));
    }

    init() {
        for (const f of this._scanFiles()) this._loadFile(f);
        const watchTarget = [SRC_ROOT, LIB_ROOT];

        console.log(chalk.blue(`[WATCHER] Monitoring src/ dan lib/ (kecuali node_modules & database)`));
        console.log(chalk.blue(`[LOADER] Total command aktif: ${Object.keys(this.plugins).length} fitur`));

        const watcher = chokidar.watch(watchTarget, {
            persistent: true,
            ignoreInitial: true,
            ignored: [
                /node_modules/,
                /src[\\/]database/, 
                /src[\\/]media/,
                /\.json$/,
            ],
            awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
        });

        watcher
            .on('change', (filePath) => {
                if (!filePath.endsWith('.js')) return;
                readline.clearLine(process.stdout, 0);
                readline.cursorTo(process.stdout, 0);
                const isCommand = filePath.startsWith(this.folder);
                if (isCommand) {
                    console.log(
                        chalk.red(`\n[UPDATE]`) +
                        chalk.yellow(` Command berubah: `) +
                        chalk.cyan(path.basename(filePath))
                    );
                    this._loadFile(filePath);
                } else {
                    this._reloadAllCommands(filePath);
                }
            })
            .on('add', (filePath) => {
                if (!filePath.endsWith('.js')) return;
                if (filePath.startsWith(this.folder)) {
                    console.log(chalk.green(`\n[+] Command baru: `) + chalk.cyan(path.basename(filePath)));
                    this._loadFile(filePath);
                } else {
                    this._reloadAllCommands(filePath);
                }
            })
            .on('unlink', (filePath) => {
                if (!filePath.endsWith('.js')) return;
                if (filePath.startsWith(this.folder)) {
                    this._unloadFile(filePath);
                } else {
                    this._reloadAllCommands(filePath);
                }
            });

        return this;
    }

    get(commandName)  { return this.plugins[commandName] || null; }
    has(commandName)  { return commandName in this.plugins; }
    commandList()     { return Object.keys(this.plugins); }
}

module.exports = new PluginLoader();