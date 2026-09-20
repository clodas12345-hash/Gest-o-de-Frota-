import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Check, AlertCircle, Smartphone, ClipboardList, CheckSquare, Square, Trash2 } from 'lucide-react';
import { AgendaContact } from '../types';

export const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str
    .split(/\s+/)
    .map((word) => {
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

interface ImportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (contacts: AgendaContact[]) => void;
}

interface ParsedContactItem {
  id: string;
  name: string;
  phone: string;
  region: string;
  selected: boolean;
}

export const ImportContactsModal: React.FC<ImportContactsModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'text' | 'device'>('file');
  const [parsedContacts, setParsedContacts] = useState<ParsedContactItem[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Clean and format Brazilian / international phone numbers
  const sanitizePhone = (rawPhone: string): string => {
    let clean = rawPhone.replace(/\D/g, '');
    if (!clean) return '';
    // If it starts with 0 (e.g. 011999999999), strip the 0
    if (clean.startsWith('0') && clean.length >= 11) {
      clean = clean.substring(1);
    }
    // If it has 10 or 11 digits (DDD + phone), prepend 55 (Brazil)
    if ((clean.length === 10 || clean.length === 11) && !clean.startsWith('55')) {
      clean = '55' + clean;
    }
    return clean;
  };

  // vCard (.vcf) Parser
  const parseVCard = (content: string): ParsedContactItem[] => {
    const items: ParsedContactItem[] = [];
    const vcardBlocks = content.split(/BEGIN:VCARD/i);

    vcardBlocks.forEach((block) => {
      if (!block.trim()) return;

      let name = '';
      let phone = '';

      // Match FN (Full Name)
      const fnMatch = block.match(/FN(?:;[^:]*)?:(.*)/i);
      if (fnMatch && fnMatch[1]) {
        name = fnMatch[1].trim();
      } else {
        // Fallback to N
        const nMatch = block.match(/N(?:;[^:]*)?:(.*)/i);
        if (nMatch && nMatch[1]) {
          const parts = nMatch[1].split(';').filter(Boolean);
          name = parts.reverse().join(' ').trim();
        }
      }

      // Match TEL
      const telMatches = block.matchAll(/TEL(?:;[^:]*)?:(.*)/gi);
      for (const telMatch of telMatches) {
        if (telMatch && telMatch[1]) {
          const clean = sanitizePhone(telMatch[1]);
          if (clean && clean.length >= 10) {
            phone = clean;
            break;
          }
        }
      }

      if (name && phone) {
        items.push({
          id: `imp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          name: toTitleCase(name),
          phone,
          region: 'Importado',
          selected: true,
        });
      }
    });

    return items;
  };

  // CSV / Text Parser
  const parseCSVOrText = (content: string): ParsedContactItem[] => {
    const items: ParsedContactItem[] = [];
    const lines = content.split(/\r?\n/);

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.toLowerCase().startsWith('nome') || trimmed.toLowerCase().startsWith('name')) {
        return; // skip headers or empty lines
      }

      // 1. Try delimiter separation (comma, semicolon, tab, pipe)
      const delimiters = [',', ';', '\t', '|', '-'];
      let parts: string[] = [];
      for (const d of delimiters) {
        if (trimmed.includes(d)) {
          parts = trimmed.split(d).map((p) => p.trim());
          if (parts.length >= 2) break;
        }
      }

      if (parts.length >= 2) {
        let nameCandidate = '';
        let phoneCandidate = '';
        let regionCandidate = parts[2] || 'Importado';

        for (const p of parts) {
          const clean = sanitizePhone(p);
          if (clean.length >= 10 && !phoneCandidate) {
            phoneCandidate = clean;
          } else if (!nameCandidate && /[a-zA-ZÀ-ÿ]/.test(p)) {
            nameCandidate = p;
          }
        }

        if (nameCandidate && phoneCandidate) {
          items.push({
            id: `imp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            name: toTitleCase(nameCandidate),
            phone: phoneCandidate,
            region: toTitleCase(regionCandidate),
            selected: true,
          });
          return;
        }
      }

      // 2. Unstructured line parsing (e.g. "João da Silva (11) 98765-4321")
      // Extract phone sequence
      const phoneMatch = trimmed.match(/(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?(?:9?\d{4}[-\s]?\d{4}|\d{8,13})/);
      if (phoneMatch) {
        const rawPhone = phoneMatch[0];
        const clean = sanitizePhone(rawPhone);
        if (clean.length >= 10) {
          const namePart = trimmed.replace(rawPhone, '').replace(/[-–—,:|()]/g, ' ').trim();
          if (namePart.length >= 2) {
            items.push({
              id: `imp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              name: toTitleCase(namePart),
              phone: clean,
              region: 'Importado',
              selected: true,
            });
          }
        }
      }
    });

    return items;
  };

  // JSON Parser
  const parseJSON = (content: string): ParsedContactItem[] => {
    try {
      const data = JSON.parse(content);
      const list = Array.isArray(data) ? data : data.contacts || data.contatos || [];
      const items: ParsedContactItem[] = [];

      list.forEach((item: any) => {
        const name = item.name || item.nome || item.fullName || '';
        const rawPhone = item.phone || item.telefone || item.tel || item.celular || '';
        const region = item.region || item.regiao || item.cidade || 'Importado';

        const clean = sanitizePhone(String(rawPhone));
        if (name && clean.length >= 10) {
          items.push({
            id: `imp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            name: toTitleCase(name),
            phone: clean,
            region: toTitleCase(region),
            selected: true,
          });
        }
      });

      return items;
    } catch {
      return [];
    }
  };

  const processContent = (text: string, filename: string = '') => {
    setIsProcessing(true);
    setStatusMessage(null);
    let results: ParsedContactItem[] = [];

    const lowerName = filename.toLowerCase();
    if (lowerName.endsWith('.vcf') || text.includes('BEGIN:VCARD')) {
      results = parseVCard(text);
    } else if (lowerName.endsWith('.json') || (text.trim().startsWith('{') || text.trim().startsWith('['))) {
      results = parseJSON(text);
      if (results.length === 0) {
        results = parseCSVOrText(text);
      }
    } else {
      results = parseCSVOrText(text);
    }

    // Deduplicate by phone
    const seen = new Set<string>();
    const unique = results.filter((item) => {
      if (seen.has(item.phone)) return false;
      seen.add(item.phone);
      return true;
    });

    setParsedContacts(unique);
    setIsProcessing(false);

    if (unique.length > 0) {
      setStatusMessage({
        type: 'success',
        text: `Identificado(s) ${unique.length} contato(s) válido(s)! Revise abaixo e clique em Confirmar.`,
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: 'Nenhum contato com nome e telefone válidos foi encontrado no conteúdo fornecido.',
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processContent(content, file.name);
    };
    reader.onerror = () => {
      setStatusMessage({ type: 'error', text: 'Erro ao ler o arquivo selecionado.' });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processContent(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleProcessText = () => {
    if (!textInput.trim()) {
      setStatusMessage({ type: 'error', text: 'Por favor, cole ou digite uma lista de contatos.' });
      return;
    }
    processContent(textInput, 'paste.txt');
  };

  const handleDeviceContacts = async () => {
    setStatusMessage(null);
    if ('contacts' in navigator && 'select' in (navigator as any).contacts) {
      try {
        const props = ['name', 'tel'];
        const opts = { multiple: true };
        const selectedContacts = await (navigator as any).contacts.select(props, opts);

        if (selectedContacts && selectedContacts.length > 0) {
          const items: ParsedContactItem[] = [];
          selectedContacts.forEach((c: any) => {
            const name = c.name?.[0] || 'Contato';
            const phoneRaw = c.tel?.[0] || '';
            const clean = sanitizePhone(phoneRaw);
            if (clean && clean.length >= 10) {
              items.push({
                id: `imp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                name: toTitleCase(name),
                phone: clean,
                region: 'Agenda Celular',
                selected: true,
              });
            }
          });

          if (items.length > 0) {
            setParsedContacts(items);
            setStatusMessage({
              type: 'success',
              text: `${items.length} contato(s) carregados da agenda do aparelho! Revise abaixo e confirme a importação.`,
            });
            return;
          }
        }
      } catch (err) {
        console.warn('Contacts selection cancelled or failed:', err);
      }
    }

    setStatusMessage({
      type: 'info',
      text: 'O acesso direto à agenda não está disponível neste navegador/ambiente. Você pode exportar seus contatos em arquivo (.vcf / vCard) pelo seu app de contatos do celular e carregar na aba "Arquivo" acima, ou copiar e colar na aba "Colar Texto".',
    });
  };

  const toggleSelectAll = () => {
    const allSelected = parsedContacts.every((c) => c.selected);
    setParsedContacts(parsedContacts.map((c) => ({ ...c, selected: !allSelected })));
  };

  const toggleSelect = (id: string) => {
    setParsedContacts(
      parsedContacts.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  const handleRemoveParsed = (id: string) => {
    setParsedContacts(parsedContacts.filter((c) => c.id !== id));
  };

  const handleConfirmImport = () => {
    const selected = parsedContacts.filter((c) => c.selected);
    if (selected.length === 0) {
      setStatusMessage({ type: 'error', text: 'Selecione pelo menos 1 contato para importar.' });
      return;
    }

    const contactsToSave: AgendaContact[] = selected.map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      region: s.region || 'Importado',
    }));

    onImport(contactsToSave);
    onClose();
  };

  const selectedCount = parsedContacts.filter((c) => c.selected).length;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        id="import-contacts-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#161616]">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
              <Upload className="w-4 h-4" />
            </div>
            <span>Importar Contatos para a Agenda</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-[#141414] px-4 pt-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`pb-2.5 px-3 font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'file'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Arquivo (.vcf, .csv, .json)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`pb-2.5 px-3 font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'text'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Colar Lista</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('device')}
            className={`pb-2.5 px-3 font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'device'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Agenda Celular</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Tab 1: File Upload */}
          {activeTab === 'file' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".vcf,.vcard,.csv,.txt,.json"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-400 bg-blue-500/10'
                    : 'border-white/15 bg-white/[0.02] hover:bg-white/[0.04] hover:border-blue-500/40'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">Clique ou arraste o arquivo aqui</p>
                    <p className="text-gray-400 text-[11px] mt-0.5">
                      Suporta arquivos <strong>.vcf (vCard do WhatsApp/Android/iPhone)</strong>, <strong>.csv</strong>, <strong>.txt</strong> ou <strong>.json</strong>
                    </p>
                  </div>
                  <span className="mt-2 inline-flex items-center px-3 py-1 rounded-lg bg-blue-600 text-white font-bold text-[11px] shadow-sm">
                    Selecionar Arquivo
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Paste text */}
          {activeTab === 'text' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-gray-300 font-semibold flex items-center justify-between">
                  <span>Cole a lista de nomes e telefones:</span>
                  <span className="text-[10px] text-gray-500">1 contato por linha</span>
                </label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={`Exemplo:\nCarlos Eduardo 11987654321\nMarcos Vinicius, (11) 99876-1234, São Paulo\nFernanda Lima - 21988887777 - Rio de Janeiro`}
                  className="w-full bg-[#181818] border border-white/10 rounded-xl p-3 text-white font-mono text-xs focus:outline-hidden focus:border-blue-500/50 h-32 resize-none"
                />
              </div>
              <button
                type="button"
                onClick={handleProcessText}
                disabled={isProcessing || !textInput.trim()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Processar Lista de Contatos</span>
              </button>
            </div>
          )}

          {/* Tab 3: Device Native Contacts */}
          {activeTab === 'device' && (
            <div className="space-y-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm">Acessar Agenda do Aparelho</h4>
                <p className="text-gray-400 text-xs max-w-sm mx-auto">
                  Abre o seletor nativo de contatos do seu smartphone (Chrome Android ou app instalado).
                </p>
              </div>
              <button
                type="button"
                onClick={handleDeviceContacts}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl inline-flex items-center gap-2 transition-colors cursor-pointer shadow-md shadow-blue-500/20"
              >
                <Smartphone className="w-4 h-4" />
                <span>Abrir Seletor de Contatos</span>
              </button>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : statusMessage.type === 'error'
                  ? 'bg-red-500/10 border-red-500/20 text-red-300'
                  : 'bg-blue-500/10 border-blue-500/20 text-blue-300'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{statusMessage.text}</p>
            </div>
          )}

          {/* Parsed Contacts Preview Section */}
          {parsedContacts.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    {parsedContacts.every((c) => c.selected) ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    <span>
                      {parsedContacts.every((c) => c.selected) ? 'Desmarcar Todos' : 'Selecionar Todos'}
                    </span>
                  </button>
                  <span className="text-gray-400 text-[11px]">
                    ({selectedCount} de {parsedContacts.length} selecionados)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setParsedContacts([])}
                  className="text-red-400 hover:text-red-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Limpar Lista</span>
                </button>
              </div>

              <div className="max-h-52 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                {parsedContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => toggleSelect(contact.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      contact.selected
                        ? 'bg-blue-950/30 border-blue-500/30 text-white'
                        : 'bg-white/[0.02] border-white/5 text-gray-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {contact.selected ? (
                        <CheckSquare className="w-4 h-4 text-blue-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-500 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-xs truncate text-white">{contact.name}</p>
                        <p className="font-mono text-[10px] text-emerald-400">+{contact.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300">
                        {contact.region}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveParsed(contact.id);
                        }}
                        className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                        title="Remover este contato"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-[#161616] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={selectedCount === 0}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Confirmar e Importar ({selectedCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
