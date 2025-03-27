const verseText = document.getElementById('verse-text');
const verseTranslation = document.getElementById('verse-translation');
const verseReference = document.getElementById('verse-reference');
const generateBtn = document.getElementById('generate-btn');
const loader = document.querySelector('.loader');

const TOTAL_SURAHS = 114;
const API_BASE = 'https://api.alquran.cloud/v1';

async function fetchSurah(surahNumber) {
    const response = await fetch(`${API_BASE}/surah/${surahNumber}/ar.alafasy`);
    if (!response.ok) throw new Error('Failed to fetch surah');
    return response.json();
}

async function fetchTranslation(surahNumber) {
    const response = await fetch(`${API_BASE}/surah/${surahNumber}/en.sahih`);
    if (!response.ok) throw new Error('Failed to fetch translation');
    return response.json();
}

async function getRandomAyah(retryCount = 0) {
    try {
        showLoader();
        const surahNumber = Math.floor(Math.random() * TOTAL_SURAHS) + 1;
        const [surahData, translationData] = await Promise.all([
            fetchSurah(surahNumber),
            fetchTranslation(surahNumber)
        ]);
        
        const totalAyahs = surahData.data.numberOfAyahs;
        const ayahIndex = Math.floor(Math.random() * totalAyahs);
        
        updateUI(
            surahData.data.ayahs[ayahIndex].text,
            translationData.data.ayahs[ayahIndex].text,
            surahData.data.englishName,
            surahNumber,
            ayahIndex
        );
    } catch (error) {
        if (retryCount < 3) return getRandomAyah(retryCount + 1);
        handleError(error);
    } finally {
        hideLoader();
    }
}

function updateUI(arabic, english, surahName, surahNum, ayahIndex) {
    verseText.textContent = arabic;
    verseTranslation.textContent = english;
    verseReference.textContent = `${surahName} (${surahNum}:${ayahIndex + 1})`;
    
    [verseText, verseTranslation, verseReference].forEach(el => {
        el.classList.remove('fade-in');
        void el.offsetWidth;
        el.classList.add('fade-in');
        el.style.opacity = 1;
    });
}

function showLoader() {
    loader.style.display = 'block';
    [verseText, verseTranslation, verseReference].forEach(el => el.style.opacity = '0.3');
}

function hideLoader() {
    loader.style.display = 'none';
    [verseText, verseTranslation, verseReference].forEach(el => el.style.opacity = '1');
}

function handleError() {
    verseTranslation.textContent = "Error loading verse. Please try again.";
    verseReference.textContent = "";
}

document.fonts.ready.then(() => document.body.classList.add('fonts-loaded'));

getRandomAyah();
generateBtn.addEventListener('click', () => {
    [verseText, verseTranslation, verseReference].forEach(el => el.style.opacity = '0');
    getRandomAyah();
});