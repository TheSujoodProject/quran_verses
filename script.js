class QuranApp {
    constructor() {
        this.history = JSON.parse(localStorage.getItem('verseHistory')) || [];
        this.dom = {
            verseText: document.getElementById('verse-text'),
            verseTranslation: document.getElementById('verse-translation'),
            verseReference: document.getElementById('verse-reference'),
            generateBtn: document.getElementById('generate-btn'),
            themeToggle: document.getElementById('theme-toggle'),
            loader: document.getElementById('loader'),
            historyList: document.getElementById('history-list'),
            historyToggle: document.getElementById('history-toggle'),
            historySection: document.getElementById('history-section')
        };
        
        this.init();
    }

    init() {
        this.loadTheme();
        this.initEventListeners();
        this.loadNewVerse();
        this.renderHistory();
    }

    initEventListeners() {
        this.dom.generateBtn.addEventListener('click', () => this.loadNewVerse());
        this.dom.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.dom.historyToggle.addEventListener('click', () => this.toggleHistory());
    }

    getMaxAyahs(surah) {
        const ayahCounts = [
            7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 
            123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 
            112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 
            34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 
            54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 
            60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 
            14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 
            28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 
            29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 
            15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 
            11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 
            5, 4, 5, 6
        ];
        return ayahCounts[surah - 1];
    }

    getRandomVerse() {
        const surah = Math.floor(Math.random() * 114) + 1;
        const maxAyah = this.getMaxAyahs(surah);
        const ayah = Math.floor(Math.random() * maxAyah) + 1;
        const verseKey = `${surah}-${ayah}`;
        
        return this.history.some(item => item.key === verseKey) 
            ? this.getRandomVerse()
            : [surah, ayah, verseKey];
    }

    async loadNewVerse() {
        try {
            this.toggleLoader(true);
            const [surah, ayah, verseKey] = this.getRandomVerse();
            
            // Cache-busted API requests
            const versePromise = fetch(
                `https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/ar.alafasy?cache=${Date.now()}`, 
                { cache: 'no-cache' }
            );
            
            const translationPromise = fetch(
                `https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/en.asad?cache=${Date.now()}`,
                { cache: 'no-cache' }
            );
    
            const surahPromise = fetch(
                `https://api.alquran.cloud/v1/surah/${surah}?cache=${Date.now()}`,
                { cache: 'no-cache' }
            );
    
            const [verseRes, translationRes, surahRes] = await Promise.all([
                versePromise,
                translationPromise,
                surahPromise
            ]);
    
            // Verify all responses
            if (!verseRes.ok) throw new Error(`Verse failed: ${verseRes.status}`);
            if (!translationRes.ok) throw new Error(`Translation failed: ${translationRes.status}`);
            if (!surahRes.ok) throw new Error(`Surah failed: ${surahRes.status}`);
    
            // Parse JSON in parallel
            const [verseData, translationData, surahData] = await Promise.all([
                verseRes.json(),
                translationRes.json(),
                surahRes.json()
            ]);
    
            this.updateUI(
                verseData.data.text,
                translationData.data.text,
                surahData.data.englishName,
                ayah
            );
            
            this.addToHistory(
                verseData.data.text,
                translationData.data.text,
                surahData.data.englishName,
                ayah,
                verseKey
            );
    
        } catch (error) {
            console.error('Loading Error:', error);
            this.showErrorNotification();
            setTimeout(() => this.loadNewVerse(), 2000);
        } finally {
            this.toggleLoader(false);
        }
    }
    
    showErrorNotification() {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-notification';
        errorEl.textContent = 'Connection issue - retrying...';
        document.body.appendChild(errorEl);
        
        setTimeout(() => errorEl.remove(), 3000);
    }

    updateUI(arabic, translation, surahName, ayah) {
        this.dom.verseText.textContent = arabic;
        this.dom.verseTranslation.textContent = translation;
        this.dom.verseReference.textContent = `${surahName} (${ayah})`;
    }

    addToHistory(arabic, translation, surahName, ayah, verseKey) {
        this.history.unshift({
            arabic,
            translation,
            reference: `${surahName} (${ayah})`,
            key: verseKey,
            timestamp: new Date().toISOString()
        });

        if (this.history.length > 4) this.history.pop();
        localStorage.setItem('verseHistory', JSON.stringify(this.history));
        this.renderHistory();
    }

    renderHistory() {
        const visibleHistory = this.history.slice(0, 4); 
        
        this.dom.historyList.innerHTML = visibleHistory
            .map((item, index) => `
                <div class="history-item">
                    <div class="history-header">
                        <span class="history-index">${index + 1}.</span>
                        <span class="history-reference">${item.reference}</span>
                    </div>
                    <div class="history-arabic">${item.arabic}</div>
                    <div class="history-translation">${item.translation}</div>
                </div>
            `).join('');
    }


    toggleHistory() {
        this.dom.historySection.classList.toggle('visible');
        this.dom.historyToggle.textContent = 
            this.dom.historySection.classList.contains('visible') 
            ? 'Hide History' 
            : 'Show History';
    }

    toggleLoader(show) {
        this.dom.loader.style.display = show ? 'flex' : 'none';
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    toggleTheme() {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' 
            ? 'light' 
            : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }

}

const checkMobileFont = () => {
    const testElement = document.createElement('span');
    testElement.style.fontFamily = 'Noto Naskh Arabic';
    testElement.style.position = 'absolute';
    testElement.style.visibility = 'hidden';
    testElement.innerHTML = '&#x0627;&#x0644;&#x0644;&#x0647;'; // "Allah" in Arabic
    document.body.appendChild(testElement);
    
    setTimeout(() => {
        if (testElement.offsetWidth < 50) { // Font not loaded properly
            document.documentElement.style.fontFamily = 'sans-serif';
            console.warn('Arabic font failed to load, using system fallback');
        }
        testElement.remove();
    }, 500);
};

window.addEventListener('load', checkMobileFont);

document.fonts.ready.then(() => new QuranApp());
