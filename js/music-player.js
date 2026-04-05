class MusicPlayer {
    constructor() {
        this.audio = new Audio();
        this.isPlaying = false;
        this.currentTrack = null;
        this.playlist = [];
        this.trackIndex = 0;
        this.isLoading = false;
        this.volume = 0.3;
        this.isExpanded = false;
        this.isHovering = false;
        this.userInteracted = false;
        
        this.ambientCollections = [
            'ambient-collection-2001-2020',
            'ChillPills',
            's27-043WeAreOne-Section27Netlabel',
            'DWK114',
            'antony_raijekov-journey',
            'expanse-mix',
            'Alternarama-The-Kyoto-Connection',
            'cafe-del-mar-o-discography',
            'mdb-beautiful-voices-discography',
            '45rpm0332010VariousArtists-45RpmCafechilloutCompilation',
            'cafe-del-mar-the-best-of-cafe-del-mar',
            'MaldivesLuxuryBeachSparelaxingChillLoungeMusic'
        ];
        
        this.widget = null;
        this.init();
    }
    
    async init() {
        await this.loadSettings();
        this.createWidget();
        this.bindEvents();
        this.setupUserInteractionListener();
        await this.loadPlaylist();
    }
    
    setupUserInteractionListener() {
        const startOnInteraction = () => {
            if (!this.userInteracted && this.playlist.length > 0) {
                this.userInteracted = true;
                this.play();
                document.removeEventListener('click', startOnInteraction);
                document.removeEventListener('keydown', startOnInteraction);
                document.removeEventListener('touchstart', startOnInteraction);
            }
        };
        
        document.addEventListener('click', startOnInteraction);
        document.addEventListener('keydown', startOnInteraction);
        document.addEventListener('touchstart', startOnInteraction);
    }
    
    async loadSettings() {
        try {
            const saved = localStorage.getItem('musicPlayerVolume');
            if (saved !== null) {
                this.volume = parseFloat(saved);
            }
        } catch (e) {
            console.log('Music player: Could not load settings');
        }
    }
    
    saveSettings() {
        try {
            localStorage.setItem('musicPlayerVolume', this.volume.toString());
        } catch (e) {
            console.log('Music player: Could not save settings');
        }
    }
    
    createWidget() {
        this.widget = document.createElement('div');
        this.widget.id = 'music-player';
        this.widget.className = 'collapsed';
        this.widget.innerHTML = `
            <div class="music-player-header">
                <button class="music-toggle-btn" id="music-toggle">
                    <span class="music-icon">🎵</span>
                    <span class="music-status">♪</span>
                </button>
                <div class="music-info">
                    <div class="music-track-name">Loading...</div>
                    <div class="music-artist-name"></div>
                </div>
                <button class="music-skip-btn" id="music-skip" title="Next track">⏭</button>
            </div>
            <div class="music-player-body">
                <div class="music-progress-container">
                    <div class="music-progress-bar">
                        <div class="music-progress-fill"></div>
                        <div class="music-progress-handle"></div>
                    </div>
                    <div class="music-time-display">
                        <span class="music-current-time">0:00</span>
                        <span class="music-duration">0:00</span>
                    </div>
                </div>
                <div class="music-controls">
                    <button class="music-volume-btn" id="music-volume" title="Volume">
                        <span class="volume-icon">🔊</span>
                    </button>
                    <input type="range" class="music-volume-slider" id="music-volume-slider" 
                           min="0" max="100" value="${this.volume * 100}">
                </div>
                <div class="music-status-text">Finding chill vibes...</div>
            </div>
        `;
        document.body.appendChild(this.widget);
        
        this.toast = document.createElement('div');
        this.toast.id = 'music-toast';
        this.toast.innerHTML = `
            <div class="music-toast-content">
                <span class="music-toast-icon">🎵</span>
                <div>
                    <div class="music-toast-text">Loading...</div>
                    <div class="music-toast-playing">Playing</div>
                </div>
            </div>
        `;
        document.body.appendChild(this.toast);
        
        this.audio.volume = this.volume;
    }
    
    isMobile() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    
    showToast(text, duration = 4000) {
        if (!this.isMobile()) return;
        
        const toastText = this.toast.querySelector('.music-toast-text');
        if (toastText) toastText.textContent = text;
        
        this.toast.classList.add('visible');
        
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }
        
        this.toastTimeout = setTimeout(() => {
            this.toast.classList.remove('visible');
        }, duration + 1000);
    }
    
    hideToast() {
        if (this.toast) {
            this.toast.classList.remove('visible');
        }
    }
    
    bindEvents() {
        const toggleBtn = document.getElementById('music-toggle');
        const skipBtn = document.getElementById('music-skip');
        const volumeBtn = document.getElementById('music-volume');
        const volumeSlider = document.getElementById('music-volume-slider');
        const progressBar = this.widget.querySelector('.music-progress-bar');
        
        toggleBtn.addEventListener('click', () => this.toggle());
        skipBtn.addEventListener('click', () => this.skipTrack());
        volumeBtn.addEventListener('click', () => this.toggleMute());
        
        volumeSlider.addEventListener('input', (e) => {
            this.volume = e.target.value / 100;
            this.audio.volume = this.volume;
            this.saveSettings();
            this.updateVolumeIcon();
        });
        
        progressBar.addEventListener('click', (e) => {
            if (this.audio.duration) {
                const rect = progressBar.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                this.audio.currentTime = percent * this.audio.duration;
            }
        });
        
        this.widget.addEventListener('mouseenter', () => {
            this.isHovering = true;
            if (!this.isExpanded && this.playlist.length > 0) {
                this.isExpanded = true;
                this.widget.classList.add('expanded');
                this.widget.classList.add('showing-track');
            }
        });
        
        this.widget.addEventListener('mouseleave', () => {
            this.isHovering = false;
            if (this.isExpanded) {
                this.isExpanded = false;
                this.widget.classList.remove('expanded');
                this.widget.classList.remove('showing-track');
            }
        });
        
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.playNext());
        this.audio.addEventListener('error', (e) => {
            console.log('Audio error:', e);
            console.log('Audio error code:', this.audio.error?.code);
            console.log('Audio src:', this.audio.src);
            this.setStatus('Skipping...');
            this.playNext();
        });
        this.audio.addEventListener('playing', () => {
            this.isPlaying = true;
            this.widget.classList.add('playing');
            this.updateUI();
        });
        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.widget.classList.remove('playing');
            this.updateUI();
        });
    }
    
    async loadPlaylist() {
        if (this.isLoading) return;
        this.isLoading = true;
        
        this.setStatus('Loading playlist...');
        
        try {
            const allTracks = [];
            
            for (const collection of this.ambientCollections) {
                try {
                    const tracks = await this.fetchCollectionTracks(collection);
                    console.log(`Music player: Found ${tracks.length} tracks in ${collection}`);
                    allTracks.push(...tracks);
                    if (allTracks.length >= 50) break;
                } catch (e) {
                    console.log(`Failed to load ${collection}:`, e.message);
                }
            }
            
            if (allTracks.length === 0) {
                console.log('Music player: No tracks found in any collection');
                this.setStatus('No music found');
                this.isLoading = false;
                return;
            }
            
            this.playlist = this.shuffleArray(allTracks);
            this.trackIndex = 0;
            console.log('Music player: Loaded', allTracks.length, 'tracks');
            console.log('First track:', this.playlist[0]);
            this.setStatus(`${this.playlist.length} tracks ready`);
            
            if (!this.isMobile()) {
                this.isExpanded = true;
                this.widget.classList.add('expanded');
            }
            
            await this.play();
        } catch (e) {
            console.error('Failed to load playlist:', e);
            this.setStatus('Error loading music');
        }
        
        this.isLoading = false;
    }
    
    async fetchCollectionTracks(identifier) {
        const response = await fetch(`https://archive.org/metadata/${identifier}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        const tracks = [];
        
        for (const file of data.files) {
            if (file.format === 'VBR MP3' && file.name.endsWith('.mp3')) {
                const streamUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(file.name)}`;
                
                tracks.push({
                    identifier: identifier,
                    name: file.name,
                    streamUrl: streamUrl,
                    title: file.title || this.extractTitle(file.name),
                    artist: file.creator || file.artist || this.extractArtist(file.name),
                    album: file.album || '',
                    duration: parseFloat(file.length) || 0
                });
            }
        }
        
        return tracks;
    }
    
    extractTitle(filename) {
        let title = filename.replace(/\.mp3$/i, '');
        title = title.replace(/^\d+[\s_-]+/, '');
        title = title.replace(/^[A-Za-z0-9_-]+[\s_-]+/, '');
        return title.replace(/[_-]/g, ' ').trim();
    }
    
    extractArtist(filename) {
        return 'Archive.org';
    }
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    play() {
        if (this.playlist.length === 0) {
            console.log('Music player: No playlist, loading...');
            this.loadPlaylist();
            return Promise.resolve();
        }
        
        if (this.trackIndex >= this.playlist.length) {
            this.trackIndex = 0;
        }
        
        const track = this.playlist[this.trackIndex];
        this.currentTrack = track;
        
        console.log('Music player: Playing', track.title);
        console.log('Music player: URL', track.streamUrl);
        
        this.audio.src = track.streamUrl;
        this.audio.load();
        
        this.setTrackName(track.title);
        this.setArtistName(track.artist);
        this.setStatus('Starting...');
        
        if (!this.isMobile()) {
            this.isExpanded = true;
            this.widget.classList.add('expanded');
            this.widget.classList.add('showing-track');
        }
        
        return this.audio.play()
            .then(() => {
                console.log('Music player: Play started successfully');
                this.setStatus('Now playing');
                
                if (this.isMobile()) {
                    this.showToast(track.title);
                }
                
                if (!this.isMobile()) {
                    setTimeout(() => {
                        if (this.isPlaying && this.isExpanded && !this.isHovering) {
                            this.isExpanded = false;
                            this.widget.classList.remove('expanded');
                            this.widget.classList.remove('showing-track');
                        }
                    }, 4000);
                }
            })
            .catch(e => {
                console.log('Music player: Play failed:', e.message);
                if (!this.userInteracted) {
                    this.setStatus('Click anywhere to start music');
                } else {
                    this.setStatus('Click button to play');
                }
                return Promise.resolve();
            });
    }
    
    playNext() {
        this.trackIndex++;
        if (this.trackIndex >= this.playlist.length) {
            this.trackIndex = 0;
            this.playlist = this.shuffleArray(this.playlist);
        }
        
        if (!this.isMobile()) {
            this.isExpanded = true;
            this.widget.classList.add('expanded');
            this.widget.classList.add('showing-track');
        }
        
        this.play();
    }
    
    skipTrack() {
        this.playNext();
    }
    
    toggle() {
        if (this.isMobile()) {
            if (this.isPlaying) {
                this.audio.pause();
            } else if (this.playlist.length > 0) {
                this.play();
            }
            return;
        }
        
        if (this.isExpanded) {
            if (this.isPlaying) {
                this.audio.pause();
            } else if (this.playlist.length > 0) {
                this.play();
            }
        } else {
            this.isExpanded = true;
            this.widget.classList.add('expanded');
            this.widget.classList.add('showing-track');
            
            if (this.playlist.length === 0) {
                this.loadPlaylist();
            } else if (!this.isPlaying) {
                this.play();
            }
        }
    }
    
    toggleMute() {
        if (this.audio.volume > 0) {
            this.previousVolume = this.audio.volume;
            this.audio.volume = 0;
            this.widget.querySelector('#music-volume-slider').value = 0;
        } else {
            this.audio.volume = this.previousVolume || this.volume;
            this.widget.querySelector('#music-volume-slider').value = this.audio.volume * 100;
        }
        this.updateVolumeIcon();
    }
    
    updateVolumeIcon() {
        const icon = this.widget.querySelector('.volume-icon');
        if (!icon) return;
        
        const vol = this.audio.volume;
        if (vol === 0) {
            icon.textContent = '🔇';
        } else if (vol < 0.3) {
            icon.textContent = '🔈';
        } else if (vol < 0.7) {
            icon.textContent = '🔉';
        } else {
            icon.textContent = '🔊';
        }
    }
    
    updateProgress() {
        if (!this.audio.duration) return;
        
        const percent = (this.audio.currentTime / this.audio.duration) * 100;
        const fill = this.widget.querySelector('.music-progress-fill');
        const handle = this.widget.querySelector('.music-progress-handle');
        const currentTime = this.widget.querySelector('.music-current-time');
        
        if (fill) fill.style.width = `${percent}%`;
        if (handle) handle.style.left = `${percent}%`;
        if (currentTime) currentTime.textContent = this.formatTime(this.audio.currentTime);
    }
    
    updateDuration() {
        const duration = this.widget.querySelector('.music-duration');
        if (duration) {
            duration.textContent = this.formatTime(this.audio.duration);
        }
    }
    
    updateUI() {
        const status = this.widget.querySelector('.music-status');
        const statusText = this.widget.querySelector('.music-status-text');
        const icon = this.widget.querySelector('.music-icon');
        
        if (this.isPlaying) {
            if (status) status.textContent = '▶';
            if (statusText) statusText.textContent = 'Now playing';
            if (icon) icon.textContent = '🎵';
            this.widget.classList.add('playing');
        } else {
            if (status) status.textContent = '⏸';
            if (icon) icon.textContent = '🎵';
            this.widget.classList.remove('playing');
        }
    }
    
    setTrackName(name) {
        const el = this.widget.querySelector('.music-track-name');
        if (el) el.textContent = name || 'Unknown Track';
    }
    
    setArtistName(name) {
        const el = this.widget.querySelector('.music-artist-name');
        if (el) el.textContent = name || '';
    }
    
    setStatus(text) {
        const el = this.widget.querySelector('.music-status-text');
        if (el) el.textContent = text;
        
        const icon = this.widget.querySelector('.music-icon');
        if (icon && (text.includes('Error') || text.includes('Could not') || text.includes('No music'))) {
            icon.textContent = '⚠️';
        }
    }
    
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.musicPlayer = new MusicPlayer();
});
