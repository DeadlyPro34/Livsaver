const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/components');
const files = fs.readdirSync(dir);

for (const file of files) {
  if (file.endsWith('.tsx')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/bg-\[#faf6ef\]/g, 'bg-[var(--color-bg-base)]');
    fs.writeFileSync(filePath, content, 'utf8');
  }
}
console.log('Done!');
