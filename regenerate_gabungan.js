const fs = require('fs');

const categories = [
    'jiwa.json',
    'anak.json',
    'keluarga.json',
    'komunitas.json',
    'bedah.json',
    'gadar.json',
    'manajemen.json',
    'maternitas.json',
    'gerontik.json'
];

let allQuestions = [];

categories.forEach(file => {
    if (fs.existsSync(file)) {
        try {
            const data = JSON.parse(fs.readFileSync(file, 'utf8'));
            // Add category tag if missing, though script.js handles it during runtime for Try Out.
            // For static gabungan.json, it's good to have it.
            // But script.js relies on "fileName" to set category usually.
            // Determine category name from filename
            const categoryName = file.replace('.json', '');
            
            const labeledData = data.map(q => ({
                ...q,
                category: categoryName // Ensure category is tagged
            }));

            allQuestions = allQuestions.concat(labeledData);
            console.log(`Loaded ${file}: ${data.length} questions`);
        } catch (e) {
            console.error(`Error reading ${file}:`, e.message);
        }
    } else {
        console.warn(`Warning: ${file} not found.`);
    }
});

// Shuffle
for (let i = allQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
}

console.log(`Total Gabungan Questions: ${allQuestions.length}`);
fs.writeFileSync('gabungan.json', JSON.stringify(allQuestions, null, 4));
console.log('Successfully updated gabungan.json');
