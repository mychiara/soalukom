
const NAMES = ["Ny. A", "Ny. B", "Ny. C", "Ny. D", "Ny. E", "Ny. F", "Ny. G", "Ny. H", "Ny. I", "Ny. J", "Ny. K", "Ny. L", "Ny. M", "Ny. N", "Ny. O", "Ny. P", "Ny. Q", "Ny. R", "Ny. S", "Ny. T"];
const LOCATIONS = ["Puskesmas", "Poli Kandungan RS", "Klinik Bidan", "Praktek Mandiri Bidan", "Ruang VK", "UGD Kebidanan", "Polindes", "Pustu"];
const COMPLAINTS_PHRASES = ["mengeluh", "datang dengan keluhan", "mengatakan", "merasa", "melaporkan", "datang ingin memeriksakan"];

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getVitals() {
    return {
        td_sys: getRandomInt(100, 135),
        td_dia: getRandomInt(60, 85),
        hr: getRandomInt(75, 95),
        rr: getRandomInt(18, 22),
        temp: (36 + Math.random()).toFixed(1)
    };
}

function generateVignette(base, age, gp, uk, complaint) {
    const name = getRandomItem(NAMES);
    const loc = getRandomItem(LOCATIONS);
    const compPhrase = getRandomItem(COMPLAINTS_PHRASES);
    const v = getVitals();
    
    const templates = [
        `Seorang perempuan usia ${age} tahun, ${gp}, hamil ${uk} minggu, datang ke ${loc}. Ibu ${compPhrase} ${complaint}.`,
        `Di ${loc}, seorang ibu hamil ${gp} (${age} tahun) dengan usia kehamilan ${uk} minggu ${compPhrase} ${complaint}.`,
        `Ny. ${name} (${age} th, ${gp}) datang ke ${loc} karena ${complaint}. Usia kehamilan saat ini ${uk} minggu.`,
        `Seorang ibu (${age} tahun, ${gp}) datang ke ${loc} untuk periksa. Ibu ${compPhrase} ${complaint} pada usia kehamilan ${uk} minggu.`
    ];
    
    // Add vitals randomly to some templates or return them separately
    // For simplicity, we just return the scenario text. 
    // The specific logic in batches might add physical exam findings.
    
    return getRandomItem(templates);
}

module.exports = {
    getRandomInt,
    getRandomItem,
    getVitals,
    generateVignette
};
