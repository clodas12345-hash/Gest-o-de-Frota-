const fs = require('fs');

const content = fs.readFileSync('src/components/VehicleCard.tsx', 'utf8');
const lines = content.split('\n');

let divs = [];
for (let i = 2975; i < 3426; i++) {
  const line = lines[i];
  let pos = 0;
  while (true) {
    const divOpenIdx = line.indexOf('<div', pos);
    const divCloseIdx = line.indexOf('</div', pos);
    
    if (divOpenIdx === -1 && divCloseIdx === -1) {
      break;
    }
    
    if (divOpenIdx !== -1 && (divCloseIdx === -1 || divOpenIdx < divCloseIdx)) {
      divs.push({ line: i + 1, type: 'open', text: line.trim() });
      pos = divOpenIdx + 4;
    } else {
      divs.push({ line: i + 1, type: 'close' });
      pos = divCloseIdx + 5;
    }
  }
}

console.log("Nesting trace in Pagamentos tab:");
let indent = 0;
for (const ev of divs) {
  if (ev.type === 'open') {
    console.log(`${' '.repeat(indent)}Open: line ${ev.line} -> ${ev.text}`);
    indent += 2;
  } else {
    indent = Math.max(0, indent - 2);
    console.log(`${' '.repeat(indent)}Close: line ${ev.line}`);
  }
}
