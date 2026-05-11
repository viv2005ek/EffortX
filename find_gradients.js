const fs = require('fs');
const content = fs.readFileSync('Frontend/src/components/Dashboard.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('bg-gradient')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
