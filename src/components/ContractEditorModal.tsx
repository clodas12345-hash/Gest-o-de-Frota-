import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  FileText, 
  Edit3, 
  Save, 
  RotateCcw, 
  Search, 
  Plus, 
  Trash2, 
  Check, 
  Info, 
  Copy, 
  Eye, 
  Sparkles,
  FileCode,
  Layers,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { 
  ContractClause, 
  DEFAULT_CONTRACT_CLAUSES, 
  CONTRACT_VARIABLES,
  getSavedContractClauses, 
  saveContractClauses, 
  resetContractClauses,
  getFullContractTextTemplate,
  saveFullContractTextTemplate,
  resetFullContractTextTemplate,
  buildDefaultFullContractText,
  replaceClauseVariables
} from '../utils/contractClauses';
import { Vehicle } from '../types';

interface ContractEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles?: Vehicle[];
  onContractUpdated?: () => void;
}

export const ContractEditorModal: React.FC<ContractEditorModalProps> = ({
  isOpen,
  onClose,
  vehicles = [],
  onContractUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'clauses' | 'fullText' | 'preview'>('clauses');
  
  // Clauses mode state
  const [clauses, setClauses] = useState<ContractClause[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [editingClauseId, setEditingClauseId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [editingTitle, setEditingTitle] = useState('');
  const [editingText, setEditingText] = useState('');
  const [editingSection, setEditingSection] = useState('');

  // Add new clause state
  const [isAddingNewClause, setIsAddingNewClause] = useState(false);
  const [newSection, setNewSection] = useState('OUTRAS CONDIÇÕES');
  const [newLabel, setNewLabel] = useState('Cláusula Adicional');
  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');

  // Full Text mode state
  const [fullText, setFullText] = useState('');
  const [isFullTextCustom, setIsFullTextCustom] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Preview state
  const [previewVehicleId, setPreviewVehicleId] = useState<string>(vehicles[0]?.id || '');
  
  // Notification toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warn' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (isOpen) {
      const savedClauses = getSavedContractClauses();
      setClauses(savedClauses);

      const customFull = getFullContractTextTemplate();
      if (customFull && customFull.trim().length > 0) {
        setFullText(customFull);
        setIsFullTextCustom(true);
      } else {
        setFullText(buildDefaultFullContractText(savedClauses));
        setIsFullTextCustom(false);
      }

      setEditingClauseId(null);
      setIsAddingNewClause(false);
      if (vehicles.length > 0 && !previewVehicleId) {
        setPreviewVehicleId(vehicles[0].id);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Sections list for filtering
  const sections = Array.from(new Set(clauses.map(c => c.section || 'GERAL')));

  const filteredClauses = clauses.filter(c => {
    const matchesSection = selectedSection === 'ALL' || c.section === selectedSection;
    const term = searchTerm.toLowerCase();
    const matchesTerm = !term || 
      c.clauseLabel.toLowerCase().includes(term) ||
      c.title.toLowerCase().includes(term) ||
      c.text.toLowerCase().includes(term) ||
      (c.section && c.section.toLowerCase().includes(term));
    return matchesSection && matchesTerm;
  });

  const handleStartEditClause = (c: ContractClause) => {
    setEditingClauseId(c.id);
    setEditingLabel(c.clauseLabel);
    setEditingTitle(c.title);
    setEditingText(c.text);
    setEditingSection(c.section);
    setIsAddingNewClause(false);
  };

  const handleCancelEditClause = () => {
    setEditingClauseId(null);
    setEditingLabel('');
    setEditingTitle('');
    setEditingText('');
  };

  const handleSaveSingleClause = () => {
    if (!editingClauseId) return;
    if (!editingText.trim()) {
      alert('O texto da cláusula não pode ficar em branco.');
      return;
    }

    const updated = clauses.map(c => {
      if (c.id === editingClauseId) {
        return {
          ...c,
          clauseLabel: editingLabel.trim() || c.clauseLabel,
          title: editingTitle.trim() || c.title,
          text: editingText.trim(),
          section: editingSection.trim() || c.section
        };
      }
      return c;
    });

    setClauses(updated);
    saveContractClauses(updated);
    
    // Also regenerate full text default representation
    setFullText(buildDefaultFullContractText(updated));

    setEditingClauseId(null);
    showToast(`✅ Cláusula "${editingLabel || 'selecionada'}" atualizada com sucesso!`);
    if (onContractUpdated) onContractUpdated();
  };

  const handleCreateNewClause = () => {
    if (!newText.trim() || !newLabel.trim()) {
      alert('Preencha a identificação da cláusula e o respectivo texto.');
      return;
    }

    const newClause: ContractClause = {
      id: `custom_clause_${Date.now()}`,
      section: newSection.trim() || 'CLÁUSULAS ADICIONAIS',
      clauseLabel: newLabel.trim(),
      title: newTitle.trim() || 'Condição Adicional',
      text: newText.trim(),
      isCustom: true
    };

    const updated = [...clauses, newClause];
    setClauses(updated);
    saveContractClauses(updated);
    setFullText(buildDefaultFullContractText(updated));

    setIsAddingNewClause(false);
    setNewLabel('Cláusula Adicional');
    setNewTitle('');
    setNewText('');
    showToast('✅ Nova cláusula adicionada com sucesso!');
    if (onContractUpdated) onContractUpdated();
  };

  const handleDeleteClause = (id: string, label: string) => {
    if (window.confirm(`Deseja realmente remover a cláusula "${label}"?`)) {
      const updated = clauses.filter(c => c.id !== id);
      setClauses(updated);
      saveContractClauses(updated);
      setFullText(buildDefaultFullContractText(updated));
      showToast(`🗑️ Cláusula "${label}" removida.`);
      if (onContractUpdated) onContractUpdated();
    }
  };

  const handleResetAllClauses = () => {
    if (window.confirm('Atenção: Deseja restaurar todas as cláusulas individuais para a redação padrão original do sistema? Suas edições por cláusula serão redefinidas.')) {
      const defaults = resetContractClauses();
      setClauses(defaults);
      setFullText(buildDefaultFullContractText(defaults));
      showToast('🔄 Cláusulas restauradas para o padrão de fábrica.', 'info');
      if (onContractUpdated) onContractUpdated();
    }
  };

  const handleSaveFullText = () => {
    if (!fullText.trim()) {
      alert('O texto do contrato não pode ficar vazio.');
      return;
    }

    saveFullContractTextTemplate(fullText);
    setIsFullTextCustom(true);
    showToast('✅ Todo o contrato personalizado foi salvo com sucesso! O novo modelo será utilizado na geração de novos PDFs.');
    if (onContractUpdated) onContractUpdated();
  };

  const handleResetFullText = () => {
    if (window.confirm('Deseja descartar o texto livre e voltar a usar a montagem automática pelas cláusulas individuais?')) {
      resetFullContractTextTemplate();
      setIsFullTextCustom(false);
      setFullText(buildDefaultFullContractText(clauses));
      showToast('🔄 Texto completo redefinido para usar as cláusulas estruturadas.', 'info');
      if (onContractUpdated) onContractUpdated();
    }
  };

  const insertVariableIntoFullText = (variableKey: string) => {
    const token = `{${variableKey}}`;
    if (!textareaRef.current) {
      setFullText(prev => prev + ' ' + token);
      showToast(`Inserido: ${token}`, 'info');
      return;
    }

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;

    const updated = current.substring(0, start) + token + current.substring(end);
    setFullText(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    }, 50);

    showToast(`Inserido: ${token}`, 'info');
  };

  // Build sample preview variables
  const selectedVeh = vehicles.find(v => v.id === previewVehicleId) || vehicles[0];
  const sampleVariables: Record<string, string> = {
    LOCADOR_NOME: 'Guilherme K. Dias',
    LOCADOR_CPF: '065.426.576-30',
    LOCADOR_RG: '39.508.321-7',
    LOCADOR_ENDERECO: 'Rua Manuel Leiroz, 230, apto 1306 - Cangaíba, São Paulo/SP, CEP 03735-180',
    LOCATARIO_NOME: selectedVeh?.driver || 'Carlos Eduardo da Silva',
    LOCATARIO_CPF: selectedVeh?.tenantCpfCnpj || '341.892.108-44',
    LOCATARIO_RG: selectedVeh?.tenantRg || '44.892.108-9',
    LOCATARIO_CNH: selectedVeh?.tenantCnh || '08912347101',
    LOCATARIO_ENDERECO: selectedVeh?.tenantAddress || 'Av. Celso Garcia, 1200 - São Paulo/SP',
    LOCATARIO_FONE: selectedVeh?.driverPhone || '(11) 98765-4321',
    MARCA_MODELO: selectedVeh ? `${selectedVeh.brand} ${selectedVeh.model}` : 'Chevrolet Onix Plus',
    ANO_MODELO: selectedVeh ? `${selectedVeh.yearFab || selectedVeh.year}/${selectedVeh.yearModel || selectedVeh.year}` : '2023/2024',
    PLACA: selectedVeh?.plate || 'TDD-5I76',
    COR: selectedVeh?.color || 'Branco',
    KM_INICIAL: selectedVeh ? (selectedVeh.initialKm || selectedVeh.currentKm || 0).toLocaleString('pt-BR') : '18.601',
    VALOR_SEMANAL: selectedVeh?.valorSemanal ? selectedVeh.valorSemanal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '650,00',
    VALOR_SEMANAL_EXTENSO: 'seiscentos e cinquenta reais',
    VALOR_CAUCAO: selectedVeh?.caucaoValor ? selectedVeh.caucaoValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '1.200,00',
    VALOR_CAUCAO_EXTENSO: 'mil e duzentos reais',
    DATA_INICIO: selectedVeh?.startDate ? new Date(selectedVeh.startDate + 'T12:00:00').toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
    DIA_VENCIMENTO: 'toda segunda-feira até às 23h59',
    CHAVE_PIX: '11953292570',
    TAXA_MULTA: '10',
    TAXA_MULTA_EXTENSO: 'dez por cento',
    TAXA_JUROS: '1',
    LIMITE_KM: '5.000 km por mês',
    OFICINA_NOME: '',
    SEGURADORA_NOME: 'Loovi Seguros',
    SEGURADORA_FONES: 'Assistência 24h: 0800 948 4888 | Furto/Roubo: 0800 607 2007',
    DATA_ATUAL: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  };

  const renderedPreviewText = replaceClauseVariables(
    isFullTextCustom ? fullText : buildDefaultFullContractText(clauses),
    sampleVariables
  );

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[900px] bg-[#121212] border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#161616] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Editor do Contrato de Locação
                </h2>
                {isFullTextCustom && (
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Texto Completo Personalizado
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Altere cláusula por cláusula ou edite o contrato inteiro de uma só vez
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            title="Fechar editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#141414] px-4 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-2 py-2">
            <button
              type="button"
              onClick={() => setActiveTab('clauses')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'clauses'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Editar 1 Cláusula ({clauses.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('fullText')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'fullText'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Editar Todo o Contrato (Texto Completo)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Visualizar Modelo Gerado</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'clauses' && (
              <button
                type="button"
                onClick={handleResetAllClauses}
                className="text-[11px] font-semibold text-gray-400 hover:text-amber-300 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-amber-500/10 border border-white/5 transition-all cursor-pointer"
                title="Restaurar redação padrão de todas as cláusulas"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Restaurar Cláusulas Padrão</span>
              </button>
            )}
            {activeTab === 'fullText' && (
              <button
                type="button"
                onClick={handleResetFullText}
                className="text-[11px] font-semibold text-gray-400 hover:text-amber-300 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-amber-500/10 border border-white/5 transition-all cursor-pointer"
                title="Descartar texto livre e voltar às cláusulas individuais"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Resetar para Cláusulas</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: EDITAR CLÁUSULA POR CLÁUSULA */}
        {activeTab === 'clauses' && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#0d0d0d]">
            {/* Filter / Search header */}
            <div className="p-3 sm:p-4 border-b border-white/10 bg-[#141414] flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between shrink-0">
              <div className="flex flex-1 items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filtrar cláusula por palavra (ex: multa, caução, seguro)..."
                    className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-hidden focus:border-blue-500"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-blue-500 max-w-[180px] sm:max-w-[240px] truncate"
                >
                  <option value="ALL">Todas as Seções ({clauses.length})</option>
                  {sections.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsAddingNewClause(prev => !prev);
                  setEditingClauseId(null);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Cláusula</span>
              </button>
            </div>

            {/* Scrollable Clauses List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3.5">
              
              {/* Form to add a new clause */}
              {isAddingNewClause && (
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/40 rounded-2xl space-y-3 animate-in zoom-in-95">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Plus className="w-4 h-4" />
                      <span>Cadastrar Nova Cláusula no Contrato</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewClause(false)}
                      className="text-gray-400 hover:text-white text-xs"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1 font-semibold">Seção / Capítulo</label>
                      <input
                        type="text"
                        value={newSection}
                        onChange={(e) => setNewSection(e.target.value)}
                        placeholder="Ex: 8. DAS RESPONSABILIDADES"
                        className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1 font-semibold">Identificação da Cláusula</label>
                      <input
                        type="text"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        placeholder="Ex: Cláusula 22ª ou • Parágrafo Único"
                        className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1 font-semibold">Título Curto</label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Ex: Regras de Abastecimento"
                        className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1 font-semibold">Texto da Cláusula</label>
                    <textarea
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      rows={3}
                      placeholder="Escreva os termos jurídicos da nova cláusula..."
                      className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-xs text-white focus:border-emerald-500 leading-relaxed font-sans resize-y"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingNewClause(false)}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateNewClause}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Salvar Nova Cláusula</span>
                    </button>
                  </div>
                </div>
              )}

              {filteredClauses.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-xs">
                  Nenhuma cláusula encontrada para "{searchTerm}".
                </div>
              ) : (
                filteredClauses.map((clause) => {
                  const isEditingThis = editingClauseId === clause.id;

                  return (
                    <div
                      key={clause.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isEditingThis
                          ? 'bg-blue-950/20 border-blue-500/50 shadow-xl ring-1 ring-blue-500/30'
                          : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* Clause Title & Actions Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-white/5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono font-bold bg-blue-600/20 text-blue-300 border border-blue-500/30 px-2.5 py-0.5 rounded-lg">
                            {clause.clauseLabel}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {clause.section}
                          </span>
                          <h4 className="text-xs font-bold text-white uppercase tracking-tight">
                            {clause.title}
                          </h4>
                          {clause.isCustom && (
                            <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
                              Personalizada
                            </span>
                          )}
                        </div>

                        {!isEditingThis ? (
                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleStartEditClause(clause)}
                              className="px-3 py-1 bg-blue-600/15 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                              title="Editar o texto desta cláusula"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>
                            {clause.isCustom && (
                              <button
                                type="button"
                                onClick={() => handleDeleteClause(clause.id, clause.clauseLabel)}
                                className="p-1 text-gray-500 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 rounded-lg transition-all"
                                title="Excluir cláusula personalizada"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={handleCancelEditClause}
                              className="px-3 py-1 text-xs font-semibold text-gray-400 hover:text-white"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveSingleClause}
                              className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Salvar Cláusula</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Clause Content Area */}
                      <div className="pt-3">
                        {isEditingThis ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-gray-400 block mb-0.5">Identificação</label>
                                <input
                                  type="text"
                                  value={editingLabel}
                                  onChange={(e) => setEditingLabel(e.target.value)}
                                  className="w-full bg-black/60 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-400 block mb-0.5">Título Curto</label>
                                <input
                                  type="text"
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  className="w-full bg-black/60 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] text-gray-400 block mb-0.5">Texto Jurídico da Cláusula</label>
                              <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                rows={4}
                                className="w-full bg-black/60 border border-white/20 rounded-xl p-3 text-xs text-white focus:outline-hidden focus:border-blue-500 leading-relaxed font-sans resize-y"
                                placeholder="Digite o texto da cláusula..."
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-300 leading-relaxed font-normal select-text">
                            {clause.text}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: EDITAR TODO O CONTRATO (TEXTO COMPLETO) */}
        {activeTab === 'fullText' && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#0d0d0d]">
            {/* Toolbar */}
            <div className="p-3 sm:p-4 border-b border-white/10 bg-[#141414] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-blue-400" />
                  <span>Editor Livre do Documento Completo</span>
                </span>
                <span className="text-[11px] text-gray-400 hidden sm:inline">
                  (Permite redigir ou colar um contrato inteiramente novo)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const generated = buildDefaultFullContractText(clauses);
                    setFullText(generated);
                    showToast('Texto recarregado a partir das cláusulas individuais!', 'info');
                  }}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Atualizar texto completo usando as cláusulas configuradas na aba ao lado"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Sincronizar com Cláusulas</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveFullText}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Todo o Contrato</span>
                </button>
              </div>
            </div>

            {/* Variable Insertion Pills */}
            <div className="p-3 bg-[#111] border-b border-white/5 shrink-0 overflow-x-auto">
              <div className="flex items-center gap-1.5 mb-1.5 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Clique para inserir variável automática no texto:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 max-h-20 overflow-y-auto">
                {CONTRACT_VARIABLES.map(v => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertVariableIntoFullText(v.key)}
                    className="text-[10px] font-mono font-medium bg-white/5 hover:bg-blue-600/30 hover:border-blue-500/40 text-gray-300 hover:text-white border border-white/10 px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1"
                    title={`Inserir: {${v.key}} - ${v.label} (ex: ${v.example})`}
                  >
                    <span>{`{${v.key}}`}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Full text area */}
            <div className="flex-1 p-3 sm:p-5 flex flex-col min-h-0">
              <textarea
                ref={textareaRef}
                value={fullText}
                onChange={(e) => setFullText(e.target.value)}
                className="w-full flex-1 bg-black/70 border border-white/15 rounded-2xl p-4 sm:p-6 text-xs sm:text-sm text-gray-200 leading-relaxed font-mono focus:outline-hidden focus:border-blue-500 resize-none shadow-inner"
                placeholder="Cole ou digite o texto completo do contrato..."
                spellCheck={false}
              />
            </div>
          </div>
        )}

        {/* Tab 3: PRÉ-VISUALIZAÇÃO COM DADOS REAIS */}
        {activeTab === 'preview' && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#0d0d0d]">
            {/* Vehicle selector for preview */}
            <div className="p-3 sm:p-4 border-b border-white/10 bg-[#141414] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Simular com dados do veículo:</span>
                <select
                  value={previewVehicleId}
                  onChange={(e) => setPreviewVehicleId(e.target.value)}
                  className="bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-blue-500 font-semibold cursor-pointer"
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      🚗 {v.brand} {v.model} ({v.plate}) - {v.driver || 'Sem motorista'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(renderedPreviewText);
                    showToast('Texto do contrato copiado para a área de transferência!');
                  }}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Texto</span>
                </button>
              </div>
            </div>

            {/* Document preview container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center">
              <div className="w-full max-w-3xl bg-white text-gray-900 rounded-xl p-6 sm:p-10 shadow-2xl font-serif text-xs leading-relaxed space-y-4 select-text">
                <div className="text-center border-b pb-4 space-y-1">
                  <h1 className="text-sm sm:text-base font-bold uppercase tracking-wider text-gray-950 font-sans">
                    CONTRATO DE LOCAÇÃO DE VEÍCULO AUTOMOTOR
                  </h1>
                  <p className="text-[11px] text-gray-500 italic font-sans">
                    Documento gerado com base no modelo salvo
                  </p>
                </div>

                <div className="whitespace-pre-wrap font-sans text-xs sm:text-[13px] leading-relaxed text-gray-800">
                  {renderedPreviewText}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-[#141414] flex items-center justify-between shrink-0">
          <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>As modificações salvas são aplicadas automaticamente nos novos contratos gerados em PDF.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
          >
            Concluir e Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
