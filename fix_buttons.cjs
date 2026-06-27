const fs = require('fs');

function fixButtons(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Primary CTA buttons (bg-brand-dark text-white rounded-full)
  content = content.replace(/bg-\[var\(--color-brand-dark\)\] hover:bg-\[var\(--color-brand-dark\)\]\/90 text-\[#fff\] rounded-\[14px\]/g, 'bg-[var(--color-brand-dark)] hover:bg-[var(--color-brand-dark)]/90 text-[#fff] rounded-full');
  
  // Secondary button (cancel)
  content = content.replace(/hover:bg-\[var\(--color-brand-dark\)\]\/5 text-\[var\(--color-brand-dark\)\] rounded-\[14px\]/g, 'bg-[var(--color-brand-accent)] hover:brightness-95 text-[var(--color-brand-dark)] rounded-[8px]');
  
  // Page background: remove #fff and use var(--color-brand-white) if needed, but #fff is fine.
  
  fs.writeFileSync(filePath, content, 'utf8');
}

['src/components/DashboardView.tsx', 'src/components/FocusView.tsx', 'src/components/HabitsView.tsx', 'src/components/ScheduleView.tsx', 'src/components/SettingsView.tsx'].forEach(fixButtons);
console.log('Fixed Buttons');
