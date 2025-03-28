// Configuration
const TOTAL_SURAHS = 114;
const API_BASE_URL = 'https://api.alquran.cloud/v1';
const MAX_RETRIES = 3;

// DOM Elements
const verseText = document.getElementById('verse-text');
const verseTranslation = document.getElementById('verse-translation');
const verseReference = document.getElementById('verse-reference');
const generateBtn = document.getElementById('generate-btn');
const loader = document.querySelector('.loader');

const verseElements = [verseText, verseTranslation, verseReference];

const fetchSurah = async surahNumber => {
    try {
        const response = await fetch(`${API_BASE_URL}/surah/${surahNumber}/ar.alafasy`);
        if (!response.ok) throw new Error('Surah fetch failed');
        return response.json();
    } catch (error) {
        console.error('Error fetching Surah:', error);
        throw error;
    }
};

const fetchTranslation = async surahNumber => {
    try {
        const response = await fetch(`${API_BASE_URL}/surah/${surahNumber}/en.sahih`);
        if (!response.ok) throw new Error('Translation fetch failed');
        return response.json();
    } catch (error) {
        console.error('Error fetching translation:', error);
        throw error;
    }
};

const toggleLoader = (show = true) => {
    loader.style.display = show ? 'block' : 'none';
    verseElements.forEach(el => el.style.opacity = show ? '0.3' : '1');
};

const animateVerseElements = () => {
    verseElements.forEach(el => {
        el.classList.remove('fade-in');
        void el.offsetWidth; 
        el.classList.add('fade-in');
    });
};

const getRandomAyah = async (retryCount = 0) => {
    try {
        toggleLoader(true);
        
        const surahNumber = Math.floor(Math.random() * TOTAL_SURAHS) + 1;
        const [surahData, translationData] = await Promise.all([
            fetchSurah(surahNumber),
            fetchTranslation(surahNumber)
        ]);

        const { numberOfAyahs } = surahData.data;
        const ayahIndex = Math.floor(Math.random() * numberOfAyahs);
        const arabicText = surahData.data.ayahs[ayahIndex].text;
        const englishText = translationData.data.ayahs[ayahIndex].text;

        verseText.textContent = arabicText;
        verseTranslation.textContent = englishText;
        verseReference.textContent = `${surahData.data.englishName} (${surahNumber}:${ayahIndex + 1})`;

        animateVerseElements();

    } catch (error) {
        console.error('Operation failed:', error);
        if (retryCount < MAX_RETRIES) return getRandomAyah(retryCount + 1);
        verseTranslation.textContent = "Error loading verse. Please try again.";
        verseReference.textContent = "";
    } finally {
        toggleLoader(false);
    }
};

const handleGenerateClick = () => {
    verseElements.forEach(el => el.style.opacity = '0');
    getRandomAyah();
};

document.fonts.ready.then(() => {
    document.body.classList.add('fonts-loaded');
});

generateBtn.addEventListener('click', handleGenerateClick);

getRandomAyah();
