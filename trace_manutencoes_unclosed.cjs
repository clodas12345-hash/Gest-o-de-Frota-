const fs = require('fs');

const content = fs.readFileSync('src/components/VehicleCard.tsx', 'utf8');
const lines = content.split('\n');

let openDivs = [];
for (let i = 3428; i < 3816; i++) {
  const line = lines[i];
  let pos = 0;
  while (true) {
    const divOpenIdx = line.indexOf('<div', pos);
    const divCloseIdx = line.indexOf('</div', pos);
    
    if (divOpenIdx === -1 && divCloseIdx === -1) {
      break;
    }
    
    if (divOpenIdx !== -1 && (divCloseIdx === -1 || divOpenIdx < divCloseIdx)) {
      openDivs.push({ line: i + 1, text: line.trim() });
      pos = divOpenIdx + 4;
    } else {
      openDivs.pop();
      pos = divCloseIdx + 5;
    }
  }
}

console.log("Unclosed divs at the end of Manutenções tab (line 3816):");
console.log(openDivs);
