const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/components');
const files = fs.readdirSync(dir);

for (const file of files) {
  if (file.endsWith('.tsx')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/bg-\[#fff\]/g, 'bg-[var(--color-brand-white)]');
    content = content.replace(/border-\[#ede5d0\]/g, 'border-[var(--color-brand-dark)]/20');
    content = content.replace(/hover:bg-\[#fff\]/g, 'hover:bg-[var(--color-brand-white)]');
    fs.writeFileSync(filePath, content, 'utf8');
  }
}
console.log('Done!');
