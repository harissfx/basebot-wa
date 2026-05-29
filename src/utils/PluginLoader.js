const path     = require('path');
const fs       = require('fs');
const chokidar = require('chokidar');

/**
 * PluginLoader — support DUA format export:
 *
 * Format LAMA (object of functions):
 *   module.exports = { ping: async (ctx) => {...}, menu: async (ctx) => {...} }
 *
 * Format BARU (switch case):
 *   module.exports = async (ctx) => {
 *       switch (ctx.command.name) {
 *           case 'ping': ...; break;
 *           case 'menu': ...; break;
 *       }
 *   }
 *   module.exports.commands = ['ping', 'menu']  // daftar command yang di-handle
 */
class PluginLoader {
    constructor() {
        this.plugins = {};   // { 'nama-command': handlerFn }
        this.files   = {};   // { '/abs/path/file.js': ['cmd1', 'cmd2'] }
        this.folder  = path.join(__dirname, '..', 'commands');
    }

    _scanFiles() {
        return fs.readdirSync(this.folder)
            .filter(f => f.endsWith('.js'))
            .map(f => path.join(this.folder, f));
    }

    _loadFile(filePath) {
        if (require.cache[require.resolve(filePath)]) {
            delete require.cache[require.resolve(filePath)];
        }
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

                if (!autoCommands.includes(match[1])) {
                    autoCommands.push(match[1]);
                }
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
                console.warn(`⚠️  [PluginLoader] Format tidak dikenal: ${path.basename(filePath)}`);
                return;
            }

            this.files[filePath] = loaded;
            console.log(`✅ [Plugin] Loaded ${path.basename(filePath)} → [${loaded.length} Commands Otomatis]`);
        } catch (err) {
            console.error(`❌ [Plugin] Gagal load ${path.basename(filePath)}:`, err.message);
        }
    }

    _unloadFile(filePath) {
        if (this.files[filePath]) {
            const removed = this.files[filePath];
            removed.forEach(cmd => delete this.plugins[cmd]);
            delete this.files[filePath];
            console.log(`🗑️  [Plugin] Unloaded ${path.basename(filePath)} → [${removed.join(', ')}]`);
        }
    }

    init() {
        const files = this._scanFiles();
        for (const f of files) this._loadFile(f);

        console.log(`👀 [PluginLoader] Watching: ${this.folder}`);
        console.log(`📦 [PluginLoader] Total command aktif: ${Object.keys(this.plugins).length}`);

        const watcher = chokidar.watch(this.folder, {
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 }
        });

        watcher
            .on('change', (filePath) => {
                if (!filePath.endsWith('.js')) return;
                console.log(`\n🔄 [Plugin] File berubah: ${path.basename(filePath)}`);
                this._loadFile(filePath);
            })
            .on('add', (filePath) => {
                if (!filePath.endsWith('.js')) return;
                console.log(`\n➕ [Plugin] File baru: ${path.basename(filePath)}`);
                this._loadFile(filePath);
            })
            .on('unlink', (filePath) => {
                if (!filePath.endsWith('.js')) return;
                this._unloadFile(filePath);
            });

        return this;
    }

    get(commandName)  { return this.plugins[commandName] || null; }
    has(commandName)  { return commandName in this.plugins; }
    commandList()     { return Object.keys(this.plugins); }
}

module.exports = new PluginLoader();