const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'AdminDashboard.jsx');

// Read file
let content = fs.readFileSync(filePath, 'utf8');

// Define replacements
const replacements = [
  ['ðŸ"�', '📍'],
  ['ðŸ'¤', '👤'],
  ['ðŸ"…', '📅'],
  ['ðŸ'¥', '👥'],
  ['ðŸ'°', '💰'],
  ['ðŸ'¼', '💼'],
  ['ðŸ—'ï¸', '🗑️'],
  ['‚±', '₱'],
  ['ðŸ"Š', '📊'],
  ['ðŸ"„', '📄'],
  ['ðŸ�¡', '🏠'],
  ['ðŸ"�', '🔍'],
];

// Apply replacements
let totalReplacements = 0;
replacements.forEach(([bad, good]) => {
  const regex = new RegExp(bad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const matches = content.match(regex);
  if (matches) {
    console.log(`Replacing ${matches.length} instances of corrupted ${good}`);
    totalReplacements += matches.length;
    content = content.replace(regex, good);
  }
});

// Write back
fs.writeFileSync(filePath, content, 'utf8');

console.log(`\n✅ Fixed ${totalReplacements} corrupted icons!`);
