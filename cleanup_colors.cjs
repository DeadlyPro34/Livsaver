const fs = require('fs');

function cleanupFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/rounded-\[14px\]-none/g, 'rounded-[14px]');
  content = content.replace(/rounded-\[14px\]-lg/g, 'rounded-[14px]');
  content = content.replace(/bg-\[#fff\] border border-\[var\(--color-brand-dark\)\].*?border-/g, 'bg-[#fff] border-');
  content = content.replace(/border border-\[var\(--color-brand-dark\)\].*?border border-/g, 'border border-');
  content = content.replace(/bg-\[#fff\] border border-\[#ede5d0\]\/50/g, 'bg-[#fff] border border-[#ede5d0]');
  content = content.replace(/hover:bg-\[#fff\] border border-\[#ede5d0\]/g, 'hover:bg-[#fff] hover:border-[#ede5d0]');
  content = content.replace(/bg-\[#fff\] border border-\[#ede5d0\] border-b border-\[#ede5d0\]/g, 'bg-[#fff] border border-[#ede5d0]');
  content = content.replace(/bg-\[#fff\] border border-\[#ede5d0\] border-t border-\[#ede5d0\]/g, 'bg-[#fff] border border-[#ede5d0]');
  
  fs.writeFileSync(filePath, content, 'utf8');
}

['src/components/DashboardView.tsx', 'src/components/FocusView.tsx', 'src/components/HabitsView.tsx', 'src/components/ScheduleView.tsx', 'src/components/SettingsView.tsx', 'src/components/VoiceAssistant.tsx'].forEach(cleanupFile);
console.log('Cleanup Done');
