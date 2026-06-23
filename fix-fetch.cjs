const fs = require('fs');
const path = require('path');

const filePaths = [
  'src/components/DashboardView.tsx',
  'src/components/ScheduleView.tsx',
  'src/components/HabitsView.tsx',
  'src/components/FocusView.tsx'
];

filePaths.forEach(relPath => {
  const filePath = path.join(__dirname, relPath);
  let content = fs.readFileSync(filePath, 'utf-8');
  if (content.includes('fetch(') && !content.includes('customFetch')) {
    content = 'import { customFetch } from "../lib/api";\n' + content;
    content = content.replace(/fetch\(/g, 'customFetch(');
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${relPath}`);
  }
});

const appPath = path.join(__dirname, 'src/App.tsx');
let appContent = fs.readFileSync(appPath, 'utf-8');
if (appContent.includes('fetch(') && !appContent.includes('customFetch')) {
  appContent = 'import { customFetch } from "./lib/api";\n' + appContent;
  appContent = appContent.replace(/fetch\(/g, 'customFetch(');
  fs.writeFileSync(appPath, appContent, 'utf-8');
  console.log('Updated src/App.tsx');
}
