const path = require('path');
const fs   = require('fs');
const chokidar = require('chokidar');

/**
 * PluginLoader
 * - Saat startup: scan & load semua file .js di folder commands/
 * - Saat file DIUBAH: reload hanya file itu tanpa restart bot
 * - Saat file DITAMBAH: auto-load langsung, command langsung aktif
 * - Saat file DIHAPUS: auto-unload, command langsung nonaktif
 */
class PluginLoader {
    constructor() {
        this.plugins = {};   // { 'nama-command': handlerFn }
        this.files   = {};   // { '/abs/path/file.js': ['cmd1', 'cmd2'] }
        this.folder  = path.join(__dirname, '..', 'commands');
    }

    // Baca semua .js di folder commands (non-recursive, satu level)
    _scanFiles() {
        return fs.readdirSync(this.folder)
            .filter(f => f.endsWith('.js'))
            .map(f => path.join(this.folder, f));
    }

    // Load / reload satu file
    _loadFile(filePath) {
        // Hapus cache CommonJS supaya require selalu fresh
        if (require.cache[require.resolve(filePath)]) {
            delete require.cache[require.resolve(filePath)];
        }

        // Hapus command lama dari file ini (kalau reload)
        if (this.files[filePath]) {
            this.files[filePath].forEach(cmd => delete this.plugins[cmd]);
            delete this.files[filePath];
        }

        try {
            const mod = require(filePath);
            // mod harus berupa object { commandName: handlerFn, ... }
            if (!mod || typeof mod !== 'object') {
                console.warn(`⚠️  [PluginLoader] Tidak ada export valid di: ${path.basename(filePath)}`);
                return;
            }

            const loaded = [];
            for (const [name, fn] of Object.entries(mod)) {
                if (typeof fn === 'function') {
                    this.plugins[name] = fn;
                    loaded.push(name);
                }
            }

            this.files[filePath] = loaded;
            console.log(`✅ [Plugin] Loaded ${path.basename(filePath)} → [${loaded.join(', ')}]`);
        } catch (err) {
            console.error(`❌ [Plugin] Gagal load ${path.basename(filePath)}:`, err.message);
        }
    }

    // Unload file (kalau dihapus)
    _unloadFile(filePath) {
        if (this.files[filePath]) {
            const removed = this.files[filePath];
            removed.forEach(cmd => delete this.plugins[cmd]);
            delete this.files[filePath];
            console.log(`🗑️  [Plugin] Unloaded ${path.basename(filePath)} → [${removed.join(', ')}]`);
        }
    }

    // Init: load semua + mulai watch
    init() {
        // Load semua file existing
        const files = this._scanFiles();
        for (const f of files) this._loadFile(f);

        console.log(`👀 [PluginLoader] Watching: ${this.folder}`);
        console.log(`📦 [PluginLoader] Total command aktif: ${Object.keys(this.plugins).length}`);

        // Watch perubahan file (tanpa restart bot!)
        const watcher = chokidar.watch(this.folder, {
            persistent:    true,
            ignoreInitial: true,   // jangan re-trigger file yang sudah diload
            awaitWriteFinish: {    // tunggu file selesai ditulis sebelum reload
                stabilityThreshold: 300,
                pollInterval: 100
            }
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

    // Ambil handler untuk command tertentu
    get(commandName) {
        return this.plugins[commandName] || null;
    }

    // Cek apakah command ada
    has(commandName) {
        return commandName in this.plugins;
    }

    // Ambil semua nama command yang aktif
    commandList() {
        return Object.keys(this.plugins);
    }
}

// Export singleton
module.exports = new PluginLoader();
