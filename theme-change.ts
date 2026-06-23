import fs from 'fs';
import path from 'path';

function walkDir(dir: string, callback: (filepath: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir('./src', (filepath) => {
  if (filepath.endsWith('.tsx') || filepath.endsWith('.ts') || filepath.endsWith('.css')) {
    let content = fs.readFileSync(filepath, 'utf8');
    let changed = false;
    
    if (content.includes('#0F172A')) {
      content = content.replace(/#0F172A/g, '#4C1D95'); // Purple 900
      changed = true;
    }
    if (content.includes('#F8FAFC')) {
      content = content.replace(/#F8FAFC/g, '#FAF5FF'); // Purple 50
      changed = true;
    }
    if (content.includes('#333')) {
      content = content.replace(/#333/g, '#9333EA'); // Purple 600
      changed = true;
    }
    
    if (changed) {
      fs.writeFileSync(filepath, content, 'utf8');
      console.log('Updated ' + filepath);
    }
  }
});
