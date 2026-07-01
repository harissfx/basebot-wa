'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile, execSync } = require('child_process');

let cachedYtDlpPath = null;

function getYtDlpPath() {
    if (cachedYtDlpPath) return cachedYtDlpPath;

    try {
        cachedYtDlpPath = execSync('which yt-dlp').toString().trim();
        return cachedYtDlpPath;
    } catch (e) {
        throw new Error('yt-dlp tidak ditemukan di system PATH. Pastikan sudah terinstall (misal: pip install yt-dlp)');
    }
}

const MAX_SIZE_MB = 100;

function runYtDlp(args) {
    return new Promise((resolve, reject) => {
        execFile(getYtDlpPath(), args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
            if (err) return reject(new Error(stderr || err.message));
            resolve(stdout.trim());
        });
    });
}

async function getInfo(url) {
    const raw = await runYtDlp([
        '--dump-json', '--no-playlist',
        '--no-warnings', url,
    ]);
    return JSON.parse(raw);
}

function download(url, extraArgs, ext) {
    return new Promise((resolve, reject) => {
        const outPath = path.join(os.tmpdir(), `wbot_dl_${Date.now()}.${ext}`);
        const args = [
            '--no-playlist',
            '--no-warnings',
            '-o', outPath,
            ...extraArgs,
            url,
        ];
        
        execFile(getYtDlpPath(), args, { maxBuffer: 10 * 1024 * 1024, timeout: 3 * 60 * 1000 }, (err, stdout, stderr) => {
            if (err) return reject(new Error(stderr || err.message));
            if (fs.existsSync(outPath)) return resolve(outPath);
            
            const tmpFiles = fs.readdirSync(os.tmpdir())
                .filter(f => f.startsWith(`wbot_dl_`) && f.endsWith(`.${ext}`))
                .map(f => ({ f, t: fs.statSync(path.join(os.tmpdir(), f)).mtimeMs }))
                .sort((a, b) => b.t - a.t);
            if (tmpFiles.length) return resolve(path.join(os.tmpdir(), tmpFiles[0].f));
            reject(new Error('File hasil download tidak ditemukan'));
        });
    });
}

function cleanTmp(...paths) {
    for (const p of paths) {
        try { if (p && fs.existsSync(p)) fs.unlinkSync(p); } catch { }
    }
}

function formatDuration(sec) {
    if (!sec) return '-';
    const m = Math.floor(sec / 60), s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function fileSizeMB(filePath) {
    try { return fs.statSync(filePath).size / (1024 * 1024); } catch { return 0; }
}

module.exports = {
    MAX_SIZE_MB,
    runYtDlp,
    getInfo,
    download,
    cleanTmp,
    formatDuration,
    fileSizeMB,
};