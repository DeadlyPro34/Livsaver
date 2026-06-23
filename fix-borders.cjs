const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'src', 'components');

fs.readdirSync(DIR).forEach(file => {
  if (file.endsWith('.tsx')) {
    const filePath = path.join(DIR, file);
    let original = fs.readFileSync(filePath, 'utf-8');
    let updated = original.replace(/border border-\[\#1A1A1A\]\/10 border border-\[\#1A1A1A\]\/20/g, 'border border-[#1A1A1A]/20');
    updated = updated.replace(/border border-\[\#1A1A1A\]\/10 border border-\[\#1A1A1A\]\/15/g, 'border border-[#1A1A1A]/15');
    updated = updated.replace(/border border-\[\#1A1A1A\]\/10 border border-\[\#1A1A1A\]\/10/g, 'border border-[#1A1A1A]/10');
    if (original !== updated) {
      fs.writeFileSync(filePath, updated, 'utf-8');
      console.log(`Fixed borders in ${file}`);
    }
  }
});
