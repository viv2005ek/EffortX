const fs = require('fs');
const path = require('path');
const componentsPath = path.join('Frontend', 'src', 'components');
['WalletButton.jsx', 'CreateProfileModal.jsx', 'LoadingState.jsx', 'ErrorCard.jsx'].forEach(file => {
  const filePath = path.join(componentsPath, file);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = content.match(/bg-gradient-[^\s"']+/g);
  if (matches) {
    console.log(file, matches);
  }
});
