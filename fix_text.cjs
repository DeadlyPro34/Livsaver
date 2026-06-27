const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/components');
const files = fs.readdirSync(dir);

for (const file of files) {
  if (file.endsWith('.tsx')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/text-\[#fff\]/g, 'text-[var(--color-text-on-dark)]');
    content = content.replace(/hover:text-\[#fff\]/g, 'hover:text-[var(--color-text-on-dark)]');
    fs.writeFileSync(filePath, content, 'utf8');
  }
}
console.log('Done!');
