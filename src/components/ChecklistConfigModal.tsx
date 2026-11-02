import React, { useState } from 'react';
import { X, Save, Plus, Trash2, ListChecks, Edit2, Check } from 'lucide-react';

interface ChecklistConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: string[];
  onSave: (newConfig: string[]) => void;
}

export const ChecklistConfigModal: React.FC<ChecklistConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave
}) => {
  const [items, setItems] = useState<string[]>(config);
  const [newItem, setNewItem] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newItem.trim();
    if (trimmed && !items.includes(trimmed)) {
      setItems([...items, trimmed]);
      setNewItem('');
      setErrorMsg(null);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditingValue('');
    }
  };

  const handleStartEdit = (index: number, currentText: string) => {
    setEditingIndex(index);
    setEditingValue(currentText);
  };

  const handleSaveEdit = (index: number) => {
    const trimmed = editingValue.trim();
    if (trimmed) {
      const next = [...items];
      next[index] = trimmed;
      setItems(next);
    }
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleSave = () => {
    if (items.length === 0) {
      setErrorMsg("A lista não pode ficar vazia.");
      return;
    }
    onSave(items);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ListChecks className="w-4.5 h-4.5 text-emerald-400" />
            Configurar Checklist
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-xs text-gray-400">
            Adicione ou remova itens do checklist. Todos os itens exigirão uma foto do motorista ao realizar a vistoria digital.
          </p>

          <form onSubmit={handleAddItem} className="flex gap-2">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Novo item (ex: Pneu dianteiro)"
              className="flex-1 text-sm bg-black border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500/50"
            />
            <button
              type="submit"
              disabled={!newItem.trim()}
              className="px-4 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {errorMsg && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg">
              {errorMsg}
            </p>
          )}

          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {items.map((item, index) => (
              <div key={index} className="flex flex-col gap-2 p-3 bg-black/40 border border-white/5 rounded-xl group">
                {editingIndex === index ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(index);
                        if (e.key === 'Escape') setEditingIndex(null);
                      }}
                      autoFocus
                      className="flex-1 text-xs bg-black border border-emerald-500/50 rounded-lg px-2.5 py-1 text-white focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(index)}
                      className="p-1.5 bg-emerald-600/30 text-emerald-400 hover:bg-emerald-600/50 rounded-lg transition-colors cursor-pointer"
                      title="Salvar"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingIndex(null)}
                      className="p-1.5 bg-white/5 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="Cancelar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-200">{item}</span>
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(index, item)}
                        className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
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
                )}
              </div>
            ))}

            {items.length === 0 && (
              <div className="text-center py-4 border border-dashed border-white/10 rounded-xl">
                <span className="text-xs text-gray-500">Nenhum item na lista.</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-black/20">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" /> Salvar Configuração
          </button>
        </div>
      </div>
    </div>
  );
};
