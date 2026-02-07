const fs = require('fs');

// Arrays for Randomization
const maleNames = ["Tn. A", "Tn. B", "Tn. C", "Tn. D", "Tn. E", "Tn. F", "Tn. G", "Tn. H", "Tn. I", "Tn. J", "Tn. K", "Tn. L", "Tn. M", "Tn. S", "Tn. T", "Tn. W", "Tn. Y", "Tn. Z"];
const femaleNames = ["Ny. A", "Ny. B", "Ny. C", "Ny. D", "Ny. E", "Ny. F", "Ny. G", "Ny. H", "Ny. I", "Ny. J", "Ny. K", "Ny. L", "Ny. M", "Ny. S", "Ny. T", "Ny. W", "Ny. Y", "Ny. Z"];

const settings = [
    "Panti Werdha",
    "Puskesmas Santun Lansia",
    "Posyandu Lansia",
    "Klinik Geriatri",
    "Ruang Rawat Inap Geriatri",
    "Kunjungan Rumah (Home Care)"
];

const generalConditions = [
    "tampak lemah",
    "tampak bugar namun mengeluh nyeri",
    "berjalan menggunakan tongkat",
    "duduk di kursi roda",
    "berbaring di tempat tidur",
    "tampak bingung",
    "tampak cemas",
    "kooperatif saat dikaji"
];

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem(array) {
    return array[getRandomInt(0, array.length - 1)];
}

function getVitals() {
    return {
        td: `${getRandomInt(110, 160)}/${getRandomInt(70, 95)} mmHg`,
        nadi: `${getRandomInt(60, 90)} x/menit`,
        rr: `${getRandomInt(16, 24)} x/menit`,
        suhu: `${getRandomInt(36, 37)}.5 C`
    };
}

function generateVignette(baseComplaint, gender = 'female') {
    const name = gender === 'male' ? getRandomItem(maleNames) : getRandomItem(femaleNames);
    const age = getRandomInt(60, 90);
    const place = getRandomItem(settings);
    const condition = getRandomItem(generalConditions);
    const vitals = getVitals();

    return {
        vignette: `Seorang lansia (${gender === 'male' ? 'Laki-laki' : 'Perempuan'}, ${age} tahun) dirawat di ${place} dengan keluhan ${baseComplaint}. Saat pengkajian, pasien ${condition}. Hasil pemeriksaan tanda vital: TD ${vitals.td}, Nadi ${vitals.nadi}, RR ${vitals.rr}, Suhu ${vitals.suhu}.`,
        name: name,
        age: age,
        place: place
    };
}

module.exports = {
    getRandomInt,
    getRandomItem,
    getVitals,
    generateVignette
};
