import React, { useState, useEffect } from 'react';
import {
  X,
  FileSignature,
  RotateCcw,
  Plus,
  Save,
  Search,
  Check,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Trash2,
  Sparkles
} from 'lucide-react';
import {
  ContractClause,
  getSavedContractClauses,
  saveContractClauses,
  resetContractClausesToDefault
} from '../utils/contractClauses';

interface ContractClausesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClausesSaved?: () => void;
}

const AVAILABLE_VARIABLES = [
  { key: 'MARCA_MODELO', desc: 'Marca e modelo do carro (ex: Chevrolet Onix Plus)' },
  { key: 'ANO_MODELO', desc: 'Ano de fabricação/modelo (ex: 2024/2025)' },
  { key: 'PLACA', desc: 'Placa do veículo (ex: TDD-5I76)' },
  { key: 'COR', desc: 'Cor do veículo (ex: Branco)' },
  { key: 'KM_INICIAL', desc: 'Quilometragem inicial do contrato (ex: 55.922)' },
  { key: 'DATA_INICIO', desc: 'Data de início da locação (ex: 24/07/2026)' },
  { key: 'VALOR_SEMANAL', desc: 'Valor numérico do aluguel semanal (ex: 960,00)' },
  { key: 'VALOR_SEMANAL_EXTENSO', desc: 'Valor por extenso (ex: novecentos e sessenta reais)' },
  { key: 'DIA_VENCIMENTO', desc: 'Dia e hora de vencimento semanal (ex: toda segunda-feira, até 23h59)' },
  { key: 'CHAVE_PIX', desc: 'Chave PIX do locador para pagamentos (ex: 11953292570)' },
  { key: 'VALOR_CAUCAO', desc: 'Valor numérico da caução (ex: 1.920,00)' },
  { key: 'VALOR_CAUCAO_EXTENSO', desc: 'Valor da caução por extenso (ex: mil novecentos e vinte reais)' },
  { key: 'TAXA_MULTA', desc: 'Percentual da multa por atraso (ex: 10)' },
  { key: 'TAXA_MULTA_EXTENSO', desc: 'Multa por extenso (ex: dez por cento)' },
  { key: 'TAXA_JUROS', desc: 'Percentual mensal de juros de mora (ex: 1)' },
  { key: 'LIMITE_KM', desc: 'Limite mensal de quilometragem (ex: 5.000 km por mês)' },
  { key: 'OFICINA_NOME', desc: 'Nome e local da oficina de manutenção preventiva' },
  { key: 'SEGURADORA_NOME', desc: 'Nome da companhia de seguro (ex: LOOVI SEGUROS)' },
  { key: 'SEGURADORA_FONES', desc: 'Telefones de emergência da seguradora' }
];

const SECTIONS_FILTER = [
  'Todas',
  '2. DO OBJETO',
  '3. DA FINALIDADE EXCLUSIVA',
  '4. DO PRAZO E RENOVAÇÃO',
  '5. DOS VALORES, PAGAMENTO E CAUÇÃO',
  '6. DAS MULTAS DE TRÂNSITO',
  '7. DA MANUTENÇÃO, USO E SEGURANÇA',
  '8. DA DEVOLUÇÃO E AVARIAS',
  '9. DA VISTORIA E MONITORAMENTO (LGPD)',
  '10. DOS SINISTROS E TRATATIVAS COM TERCEIROS',
  '11. DO SEGURO (LOOVI SEGUROS)',
  '12. DO FORO E DISPOSIÇÕES FINAIS',
  'Personalizadas'
];

export const ContractClausesModal: React.FC<ContractClausesModalProps> = ({
  isOpen,
  onClose,
  onClausesSaved
}) => {
  const [clauses, setClauses] = useState<ContractClause[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('Todas');
  const [showVariablesHelp, setShowVariablesHelp] = useState(false);
  const [isSavedNotification, setIsSavedNotification] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // New custom clause form
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [newClauseLabel, setNewClauseLabel] = useState('');
  const [newClauseTitle, setNewClauseTitle] = useState('');
  const [newClauseText, setNewClauseText] = useState('');
  const [newClauseSection, setNewClauseSection] = useState('12. DO FORO E DISPOSIÇÕES FINAIS');

  useEffect(() => {
    if (isOpen) {
      setClauses(getSavedContractClauses());
      setIsSavedNotification(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClauseTextChange = (id: string, newText: string) => {
    setClauses(prev =>
      prev.map(c => (c.id === id ? { ...c, text: newText } : c))
    );
  };

  const handleClauseLabelChange = (id: string, newLabel: string) => {
    setClauses(prev =>
      prev.map(c => (c.id === id ? { ...c, clauseLabel: newLabel } : c))
    );
  };

  const handleResetSingleClause = (id: string) => {
    setClauses(prev =>
      prev.map(c => (c.id === id ? { ...c, text: c.defaultText } : c))
    );
  };

  const handleDeleteCustomClause = (id: string) => {
    if (window.confirm('Deseja excluir esta cláusula personalizada?')) {
      setClauses(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleResetAllToDefault = () => {
    const defaults = resetContractClausesToDefault();
    setClauses(defaults);
    setIsResetConfirmOpen(false);
    setIsSavedNotification(true);
    setTimeout(() => setIsSavedNotification(false), 3000);
    if (onClausesSaved) onClausesSaved();
  };

  const handleSaveAll = () => {
    saveContractClauses(clauses);
    setIsSavedNotification(true);
    setTimeout(() => {
      setIsSavedNotification(false);
      if (onClausesSaved) onClausesSaved();
      onClose();
    }, 1200);
  };

  const handleCreateCustomClause = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClauseLabel.trim() || !newClauseText.trim()) {
      alert('Por favor, informe a numeração/título e o texto da cláusula.');
      return;
    }

    const newClause: ContractClause = {
      id: `custom_clause_${Date.now()}`,
      sectionNumber: 99,
      sectionTitle: newClauseSection,
      clauseLabel: newClauseLabel.trim(),
      title: newClauseTitle.trim() || newClauseLabel.trim(),
      text: newClauseText.trim(),
      defaultText: newClauseText.trim(),
      isCustom: true
    };

    setClauses(prev => [...prev, newClause]);
    setNewClauseLabel('');
    setNewClauseTitle('');
    setNewClauseText('');
    setShowAddCustomModal(false);
  };

  const modifiedCount = clauses.filter(c => c.text !== c.defaultText).length;

  const filteredClauses = clauses.filter(c => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      c.clauseLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.sectionTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSection =
      selectedSection === 'Todas' ||
      (selectedSection === 'Personalizadas' && c.isCustom) ||
      c.sectionTitle === selectedSection;

    return matchesSearch && matchesSection;
  });

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm touch-none overscroll-contain">
      <div className="bg-[#121212] border border-white/15 rounded-2xl w-full max-w-4xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#181818]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Editor de Cláusulas do Contrato
                </h2>
                {modifiedCount > 0 && (
                  <span className="text-xs text-amber-400 font-medium">
                    · {modifiedCount} modificada{modifiedCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Personalize o texto oficial de cada cláusula que será impresso nos contratos em PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              title="Restaurar todas as cláusulas originais"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Restaurar Padrão</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              title="Fechar editor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search, Section Filter & Helper */}
        <div className="p-3 sm:p-4 bg-[#161616] border-b border-white/10 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar cláusula por texto, número ou tema (ex: multa, caução, seguro)..."
                className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-hidden focus:border-amber-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowVariablesHelp(!showVariablesHelp)}
                className={`px-3 py-2 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  showVariablesHelp
                    ? 'bg-blue-600/20 text-blue-300 border-blue-500/30'
                    : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                }`}
                title="Ver lista de variáveis dinâmicas disponíveis"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Variáveis Dinâmicas</span>
                {showVariablesHelp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              <button
                type="button"
                onClick={() => setShowAddCustomModal(true)}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Cláusula</span>
              </button>
            </div>
          </div>

          {/* Section Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
            {SECTIONS_FILTER.map(sec => (
              <button
                key={sec}
                type="button"
                onClick={() => setSelectedSection(sec)}
                className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-colors cursor-pointer border ${
                  selectedSection === sec
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold'
                    : 'bg-white/[0.03] text-gray-400 border-white/5 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>

          {/* Variables Reference Panel */}
          {showVariablesHelp && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Variáveis Dinâmicas para Inserir no Texto</span>
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                Você pode utilizar qualquer código entre chaves abaixo no texto da cláusula. Ao gerar o PDF, o sistema substitui automaticamente pelo dado correspondente do veículo e do locatário:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 pt-1 text-[10px] max-h-40 overflow-y-auto pr-1">
                {AVAILABLE_VARIABLES.map(v => (
                  <div
                    key={v.key}
                    onClick={() => {
                      navigator.clipboard.writeText(`{${v.key}}`);
                      alert(`Copiado para a área de transferência: {${v.key}}`);
                    }}
                    className="p-1.5 bg-black/40 border border-white/5 rounded-lg hover:border-blue-400/40 cursor-pointer flex flex-col justify-between group"
                    title="Clique para copiar"
                  >
                    <span className="font-mono font-bold text-blue-400 group-hover:underline">{`{${v.key}}`}</span>
                    <span className="text-gray-400 text-[9px] leading-tight mt-0.5">{v.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Clauses List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 touch-pan-y overscroll-contain">
          {filteredClauses.length === 0 ? (
            <div className="text-center py-12 text-gray-400 space-y-2">
              <FileSignature className="w-10 h-10 mx-auto text-gray-600" />
              <p className="text-sm font-semibold text-gray-300">Nenhuma cláusula encontrada.</p>
              <p className="text-xs text-gray-500">Tente ajustar os termos de pesquisa ou o filtro de seção.</p>
            </div>
          ) : (
            filteredClauses.map((clause) => {
              const isModified = clause.text !== clause.defaultText;
              return (
                <div
                  key={clause.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isModified
                      ? 'bg-amber-500/[0.04] border-amber-500/30'
                      : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Clause Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-white/5">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          {clause.sectionTitle}
                        </span>
                        {clause.isCustom && (
                          <span className="text-[10px] font-semibold text-purple-400">
                            · Personalizada
                          </span>
                        )}
                        {isModified && (
                          <span className="text-[10px] font-semibold text-amber-400">
                            · Editada
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                        <input
                          type="text"
                          value={clause.clauseLabel}
                          onChange={(e) => handleClauseLabelChange(clause.id, e.target.value)}
                          className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-amber-400 focus:outline-hidden font-bold text-white text-xs sm:text-sm px-1 py-0.5 rounded"
                        />
                        <span className="text-gray-400 font-normal text-xs">— {clause.title}</span>
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isModified && (
                        <button
                          type="button"
                          onClick={() => handleResetSingleClause(clause.id)}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 text-amber-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-white/5"
                          title="Voltar ao texto original desta cláusula"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restaurar Original</span>
                        </button>
                      )}

                      {clause.isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomClause(clause.id)}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Excluir cláusula personalizada"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Clause Textarea */}
                  <div className="space-y-1">
                    <textarea
                      rows={Math.max(3, Math.min(8, Math.ceil(clause.text.length / 90)))}
                      value={clause.text}
                      onChange={(e) => handleClauseTextChange(clause.id, e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white leading-relaxed font-sans placeholder-gray-600 focus:outline-hidden focus:border-amber-400 resize-y"
                    />
                    <div className="flex items-center justify-between text-[10px] text-gray-500 px-1">
                      <span>{clause.text.length} caracteres</span>
                      {isModified && (
                        <span className="text-amber-400 font-medium">
                          Modificado em relação ao padrão
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Notification Toast */}
        {isSavedNotification && (
          <div className="p-3 bg-emerald-500/15 border-t border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in duration-200">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Cláusulas do contrato salvas com sucesso no sistema!</span>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-[#161616] border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Info className="w-4 h-4 text-gray-500 shrink-0" />
            <span>As cláusulas salvas são aplicadas automaticamente em todos os contratos gerados e minutas em branco.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>

      </div>

      {/* Confirmation Modal to Reset All Clauses */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#181818] border border-amber-500/30 rounded-2xl p-5 max-w-sm w-full space-y-4 text-left shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Restaurar Cláusulas Originais?</h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Todas as 21 cláusulas voltarão aos textos originais da minuta padrão. Cláusulas personalizadas adicionais não salvas serão removidas.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3 py-1.5 text-xs text-gray-300 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetAllToDefault}
                className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg cursor-pointer"
              >
                Sim, Restaurar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal to Add New Custom Clause */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <form
            onSubmit={handleCreateCustomClause}
            className="bg-[#181818] border border-white/20 rounded-2xl p-5 max-w-md w-full space-y-4 text-left shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Nova Cláusula Personalizada</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">
                  Seção do Contrato
                </label>
                <select
                  value={newClauseSection}
                  onChange={(e) => setNewClauseSection(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-hidden focus:border-emerald-500"
                >
                  {SECTIONS_FILTER.filter(s => s !== 'Todas' && s !== 'Personalizadas').map(sec => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">
                  Identificador / Número da Cláusula *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Cláusula 22ª ou • Parágrafo Quarto"
                  value={newClauseLabel}
                  onChange={(e) => setNewClauseLabel(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">
                  Título Resumido (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Do Uso em Viagens Interestaduais"
                  value={newClauseTitle}
                  onChange={(e) => setNewClauseTitle(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">
                  Texto da Cláusula *
                </label>
                <textarea
                  rows={4}
                  placeholder="Digite os termos e condições desta cláusula..."
                  value={newClauseText}
                  onChange={(e) => setNewClauseText(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-xl p-3 text-white text-xs leading-relaxed focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="px-3 py-1.5 text-xs text-gray-300 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Cláusula</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
