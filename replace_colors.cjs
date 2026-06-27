const fs = require('fs');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/#4C1D95/g, 'var(--color-brand-dark)');
  content = content.replace(/#FAF5FF/g, '#fff');
  // Re-adjust some borders from dark to the cream border
  content = content.replace(/border-\[var\(--color-brand-dark\)\/20\]/g, 'border-[#ede5d0]');
  content = content.replace(/border-\[var\(--color-brand-dark\)\/15\]/g, 'border-[#ede5d0]');
  content = content.replace(/border-\[var\(--color-brand-dark\)\/10\]/g, 'border-[#ede5d0]');
  content = content.replace(/border-\[var\(--color-brand-dark\)\/30\]/g, 'border-[#ede5d0]');
  content = content.replace(/border-\[var\(--color-brand-dark\)\/50\]/g, 'border-[#ede5d0]');
  content = content.replace(/border-var\(--color-brand-dark\)/g, 'border-[#ede5d0]');
  content = content.replace(/text-\[var\(--color-brand-dark\)\/60\]/g, 'text-gray-500');
  content = content.replace(/text-\[var\(--color-brand-dark\)\/40\]/g, 'text-gray-400');
  content = content.replace(/bg-\[var\(--color-brand-dark\)\/10\]/g, 'bg-[var(--color-brand-cream)]');
  content = content.replace(/bg-\[var\(--color-brand-dark\)\/5\]/g, 'bg-[#faf6ef]');
  // Fix rounded-none -> rounded-[14px] for panels/cards
  content = content.replace(/rounded-none/g, 'rounded-[14px]');
  fs.writeFileSync(filePath, content, 'utf8');
}

['src/components/DashboardView.tsx', 'src/components/FocusView.tsx', 'src/components/HabitsView.tsx', 'src/components/ScheduleView.tsx', 'src/components/SettingsView.tsx', 'src/components/VoiceAssistant.tsx', 'src/App.tsx'].forEach(replaceInFile);
console.log('Done');
