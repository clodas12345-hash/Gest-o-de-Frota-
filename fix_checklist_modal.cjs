const fs = require('fs');
let content = fs.readFileSync('src/components/ChecklistConfigModal.tsx', 'utf8');

const regex = /\{items\.map\(\(item, index\) => \([\s\S]*?<\/[a-zA-Z]+>\s*\)\)\}/;

const newRender = `
            {items.map((item, index) => (
              <div key={index} className="flex flex-col gap-2 p-3 bg-black/40 border border-white/5 rounded-xl group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-200">{item}</span>
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => {
                        const newName = prompt('Editar item do checklist:', item);
                        if (newName && newName.trim() && newName.trim() !== item) {
                          const newItems = [...items];
                          newItems[index] = newName.trim();
                          setItems(newItems);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
`;
content = content.replace(regex, newRender);

fs.writeFileSync('src/components/ChecklistConfigModal.tsx', content);
