const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'src', 'components');

function replaceClasses(content) {
  content = content.replace(/bg-\[\#1A1A1A\] text-\[\#1A1A1A\]/g, 'bg-[#1A1A1A] text-[#FDFCF8]');
  content = content.replace(/bg-\[\#1A1A1A\] hover:bg-\[\#1A1A1A\]/g, 'bg-[#1A1A1A] hover:bg-[#1A1A1A]/90');
  content = content.replace(/text-\[\#1A1A1A\] bg-\[\#1A1A1A\]/g, 'text-[#FDFCF8] bg-[#1A1A1A]');
  content = content.replace(/bg-\[\#1A1A1A\] text-slate-300/g, 'bg-[#1A1A1A] text-[#FDFCF8]');
  return content;
}

fs.readdirSync(DIR).forEach(file => {
  if (file.endsWith('.tsx')) {
    const filePath = path.join(DIR, file);
    const original = fs.readFileSync(filePath, 'utf-8');
    const updated = replaceClasses(original);
    if (original !== updated) {
      fs.writeFileSync(filePath, updated, 'utf-8');
      console.log(`Updated ${file}`);
    }
  }
});
