// 主JavaScript文件 - 实现音频播放和页面功能

class AudioPlayer {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadManifestAndRender();
    }

    // Set up event listeners
    setupEventListeners() {
        // Set up audio mutual exclusion
        this.setupAudioMutualExclusion();
        
        // Stop audio on page unload
        window.addEventListener('beforeunload', () => {
            this.stopCurrentAudio();
        });
    }

    // Audio mutual exclusion behavior (like MusicGen)
    setupAudioMutualExclusion() {
        // Wait for DOM to be ready
        setTimeout(() => {
            const audioElements = document.querySelectorAll('audio');
            audioElements.forEach(audio => {
                audio.addEventListener('play', () => {
                    // Pause other audios
                    audioElements.forEach(otherAudio => {
                        if (otherAudio !== audio && !otherAudio.paused) {
                            otherAudio.pause();
                        }
                    });
                });
            });
        }, 100);
    }

    // Stop current playing audio
    stopCurrentAudio() {
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach(audio => {
            if (!audio.paused) {
                audio.pause();
            }
        });
    }

    // Fetch demos.json and render both tables
    async loadManifestAndRender() {
        try {
            const res = await fetch('demos.json', { cache: 'no-cache' });
            if (!res.ok) return;
            const manifest = await res.json();
            await this.renderTables(manifest);
            // 渲染后重置音频互斥
            // Rebind mutual exclusion after rendering
            this.setupAudioMutualExclusion();
        } catch (e) {
            console.warn('demos.json not found or failed to parse, skip dynamic rendering.');
        }
    }

    // Fetch text helper: returns trimmed text or null
    async fetchTextOrNull(url) {
        try {
            const res = await fetch(url, { cache: 'no-cache' });
            if (!res.ok) return null;
            const text = await res.text();
            const trimmed = (text || '').trim();
            return trimmed || null;
        } catch (_) {
            return null;
        }
    }

    // Check if a resource exists (prefer HEAD, fallback to GET)
    async resourceExists(url) {
        if (!url) return false;
        try {
            const head = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
            if (head.ok) return true;
        } catch (_) {
            // ignore
        }
        try {
            const getRes = await fetch(url, { cache: 'no-cache' });
            return getRes.ok;
        } catch (_) {
            return false;
        }
    }

    // Render tbody contents for both tables based on manifest
    async renderTables(manifest) {
        const rightTableBody = document.getElementById('rightTableBody');
        const leftTableBody = document.getElementById('leftTableBody');

        if (!rightTableBody || !leftTableBody) return;

        // 清空现有内容
        rightTableBody.innerHTML = '';
        leftTableBody.innerHTML = '';

        // Keep natural order of keys
        const demoNames = Object.keys(manifest);

        for (let index = 0; index < demoNames.length; index++) {
            const demoName = demoNames[index];
            const rec = manifest[demoName] || {};
            // Derive lyrics path from demo key
            const lyricsPath = `audio/${demoName}/lyrics`;
            const lyricsText = await this.fetchTextOrNull(lyricsPath);

            // Right table row: Source, Target Timbre, Samoye, SVC Finetune
            // Show row only if source exists and is accessible
            const sourceOk = await this.resourceExists(rec.source);
            if (sourceOk) {
                const rightTr = document.createElement('tr');
                rightTr.setAttribute('data-row', String(index));
                const rightCols = [
                    rec.source,
                    rec.target_timbre,
                    rec.samoye,
                    rec.svc_finetune,
                ];
                rightCols.forEach((src) => {
                    const td = document.createElement('td');
                    td.className = 'text-center';
                    if (src) {
                        const audio = document.createElement('audio');
                        audio.setAttribute('preload', 'metadata');
                        audio.setAttribute('controls', '');
                        audio.className = 'sample_audio';
                        audio.src = src;
                        td.appendChild(audio);
                    }
                    rightTr.appendChild(td);
                });
                rightTableBody.appendChild(rightTr);
            }

            // Left table row: Lyrics, Target Timbre, Baseline, SVS Finetune
            // Show row only if baseline exists and is accessible
            const baselineOk = await this.resourceExists(rec.baseline);
            if (baselineOk) {
                const leftTr = document.createElement('tr');
                leftTr.setAttribute('data-row', String(index));

                // Lyrics column
                const lyricTd = document.createElement('td');
                lyricTd.className = 'desc';
                lyricTd.textContent = lyricsText || 'Enter lyrics here';
                leftTr.appendChild(lyricTd);

                const leftCols = [
                    rec.target_timbre,
                    rec.baseline,
                    rec.svs_finetune,
                ];
                leftCols.forEach((src) => {
                    const td = document.createElement('td');
                    td.className = 'text-center';
                    if (src) {
                        const audio = document.createElement('audio');
                        audio.setAttribute('preload', 'metadata');
                        audio.setAttribute('controls', '');
                        audio.className = 'sample_audio';
                        audio.src = src;
                        td.appendChild(audio);
                    }
                    leftTr.appendChild(td);
                });
                leftTableBody.appendChild(leftTr);
            }
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化音频播放器
    window.audioPlayer = new AudioPlayer();
    
    console.log('Cartoon Sing demo site loaded');
});

// 导出给全局使用
window.AudioPlayer = AudioPlayer;
