import React, { useState, useRef, useEffect } from 'react';
import { 
  HelpCircle, 
  X, 
  ClipboardCheck, 
  Calendar, 
  MessageSquare, 
  DollarSign, 
  BookOpen, 
  AlertTriangle, 
  FileText, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  Smartphone,
  RefreshCw,
  Bot,
  Send,
  Sparkles,
  Trash2,
  CheckCircle2,
  Download,
  Upload
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportBackup?: () => void;
  onImportBackup?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onResetSelectedData?: (options: {
    veiculos?: boolean;
    vistorias?: boolean;
    manutencoes?: boolean;
    abastecimentos?: boolean;
    contratosFinalizados?: boolean;
    agenda?: boolean;
    configuracoes?: boolean;
  }) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const HelpModal: React.FC<HelpModalProps> = ({ 
  isOpen, 
  onClose, 
  onExportBackup, 
  onImportBackup, 
  onResetSelectedData 
}) => {
  const [activeTab, setActiveTab] = useState<'vistorias' | 'financeiro' | 'frota' | 'faq' | 'ia' | 'reset'>('vistorias');
  
  // Selective Reset State
  const [resetCategories, setResetCategories] = useState({
    veiculos: true,
    vistorias: true,
    manutencoes: true,
    abastecimentos: true,
    contratosFinalizados: true,
    agenda: true,
    configuracoes: true
  });
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  const [isResetAllMode, setIsResetAllMode] = useState(false);
  
  // AI Assistant Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: 'Olá! Sou o Assistente Virtual do Gestor de Frota 🚗🤖. Como posso ajudar você hoje?\n\nVocê pode me perguntar sobre vistorias, recebimentos semanais, prazos de revisão, envio de documentos pelo WhatsApp ou relatórios financeiro!',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'ia') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  if (!isOpen) return null;

  // Local knowledge-base fallback answer generator
  const getSmartLocalAnswer = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes('contrato finalizado') || q.includes('excluir carro') || q.includes('excluir veiculo') || q.includes('pasta') || q.includes('pdf')) {
      return `📄 *Pasta Contratos Finalizados e Relatórios em PDF:*\n\n1. Ao excluir qualquer veículo da frota, o sistema gera automaticamente um **Relatório Oficial em PDF** com o histórico completo (dados do veículo, motorista, pagamentos, vistorias e documentos).\n2. O PDF é baixado para seu dispositivo e uma cópia fica armazenada na pasta **Contratos Finalizados** (botão na barra superior).\n3. Na pasta, você pode pesquisar, visualizar em tela cheia e baixar o relatório em PDF quando quiser!`;
    }

    if (q.includes('histórico') || q.includes('historico') || q.includes('retraído') || q.includes('retraido') || q.includes('expandir') || q.includes('sumiu')) {
      return `📜 *Histórico Geral de Lançamentos Retraído:*\n\n• O Histórico Geral agora inicia **recolhido/retraído** para deixar a tela principal mais limpa e organizada.\n• Para ver todos os lançamentos, filtros e busca, basta clicar no botão **"Expandir"** no cabeçalho da seção de Histórico.`;
    }

    if (q.includes('vistoria') && (q.includes('cancelar') || q.includes('excluir') || q.includes('agendada') || q.includes('pendente'))) {
      return `❌ *Como Cancelar ou Excluir uma Vistoria Agendada/Pendente:*\n\n1. Localize o cartão do veículo correspondente na tela principal.\n2. No cabeçalho do cartão ou na seção **Vistorias**, você verá o alerta da vistoria agendada.\n3. Clique no botão de lixeira vermelha 🗑️ **"Cancelar Agendamento"** ou **"Excluir Vistoria Pendente"**.\n4. O agendamento será cancelado e removido imediatamente!`;
    }

    if (q.includes('lembrete') || q.includes('sexta') || q.includes('sumir')) {
      return `📅 *Lembrete de Vistoria de Sexta-Feira:*\n\n• O banner de lembrete de vistoria semanal só é exibido nas **Sextas-Feiras**.\n• Para fazê-lo sumir após o envio, basta clicar no botão **"Marcar como Enviado / Concluir"** no próprio banner.\n• Ele permanecerá oculto durante o restante do dia e reaparecerá automaticamente na próxima sexta-feira!`;
    }

    if (q.includes('foto') || q.includes('ver fotos') || q.includes('visualiz')) {
      return `📸 *Visualizando Fotos do Checklist e Vistoria:*\n\n1. No cartão do veículo, expanda a aba **Vistorias do Veículo**.\n2. Todas as vistorias concluídas exibem as miniaturas das fotos enviadas.\n3. **Clique sobre qualquer foto** para abri-la em tela cheia com zoom e detalhes da vistoria.`;
    }

    if (q.includes('revisão') || q.includes('revisao') || q.includes('piscando') || q.includes('contagem') || q.includes('3 dias') || q.includes('manutenção') || q.includes('manutencao')) {
      return `⏱️ *Contagem Regressiva de Revisão / Manutenção Preventiva:*\n\n• Quando faltar **3 dias ou menos** para a próxima revisão agendada, um cronômetro em tempo real (dias, horas, minutos e segundos) aparecerá piscando em destaque no cartão do veículo e na agenda de manutenção!\n• Você também pode registrar despesas diretamente na ficha do veículo no campo Manutenção Preventiva.`;
    }

    if (q.includes('documento') || q.includes('crlv') || q.includes('contrato') || q.includes('whatsapp') || q.includes('arquivo')) {
      return `📄 *Envio de Documentos (CRLV, Contrato) pelo WhatsApp:*\n\n• Ao clicar em **Enviar p/ WhatsApp** no documento, o sistema baixa automaticamente o arquivo físico PDF/imagem no seu computador ou celular.\n• Para enviar no WhatsApp, basta anexar o arquivo baixado clicando no ícone do clipe 📎 do WhatsApp!\n• Dica: Em dispositivos móveis ou navegadores compatíveis, você também pode usar o botão **"Compartilhar Arquivo"** para abrir o menu nativo e anexar diretamente.`;
    }

    if (q.includes('caução') || q.includes('caucao') || q.includes('garantia') || q.includes('escondi') || q.includes('expandi')) {
      return `💰 *Caução de Garantia Oculta/Expansível:*\n\n• A seção de Caução fica recolhida para economizar espaço no cartão do veículo.\n• Clique na linha **"Caução de Garantia"** no cartão do carro para expandir/recolher os detalhes e pagamentos.`;
    }

    if (q.includes('tipo') || q.includes('entrega') || q.includes('periódica') || q.includes('periodica') || q.includes('devolução') || q.includes('devolucao')) {
      return `📋 *Tipos de Vistoria Disponíveis:*\n\nAo cadastrar ou solicitar uma vistoria, você pode selecionar uma destas 3 modalidades:\n1. **Entrega de Veículo** (para novos contratos)\n2. **Periódica (Semanal)** (rotina de manutenção)\n3. **Devolução de Veículo** (encerramento de locação)`;
    }

    if (q.includes('outros') || q.includes('categoria') || q.includes('deletar seguro')) {
      return `📁 *Abas de Documentos e Categoria Editável:*\n\n• A aba Documentos contém as categorias: Contrato, CRLV, Vistoria, Comprovante e **Outros**.\n• Ao selecionar a categoria **Outros**, um campo de texto é liberado para você digitar o nome exato desejado (ex: *Transferência, Nota Fiscal, Laudo Técnico*).`;
    }

    if (q.includes('vistoria realizada') || q.includes('verde') || q.includes('status') || q.includes('selo')) {
      return `✅ *Indicador "Vistoria Realizada" em Verde:*\n\nAssim que uma vistoria é concluída e enviada com fotos, o cartão do carro exibe um selo em destaque verde **"Vistoria Realizada"** no topo, indicando que o veículo está em dia!`;
    }

    if (q.includes('link') || q.includes('motorista') || q.includes('solicitar') || q.includes('preencher')) {
      return `📱 *Enviar Link de Vistoria para o Motorista:*\n\n1. No cartão do veículo, clique em **Solicitar Vistoria por WhatsApp**.\n2. O sistema gera uma mensagem pronta com um link seguro único para o motorista abrir no celular dele.\n3. O motorista tira as fotos e preenche os dados sem precisar ter conta no aplicativo!`;
    }

    if (q.includes('adicionar') || q.includes('cadastrar') || q.includes('carro') || q.includes('veiculo') || q.includes('veículo')) {
      return `🚗 *Cadastrar ou Editar Veículo:*\n\n• No topo da tela principal, clique no botão **+ Novo Veículo**.\n• Preencha o modelo, placa, nome do motorista, telefone e valores de cobrança.\n• Para editar informações de um veículo já existente, clique no ícone de lápis ✏️ no topo do cartão do carro.`;
    }

    if (q.includes('despesa') || q.includes('custo') || q.includes('gasto') || q.includes('balanço') || q.includes('financeiro')) {
      return `📊 *Controle Financeiro e Despesas:*\n\n• No cartão de cada veículo, você pode registrar custos extras e despesas detalhadas.\n• Os totais de recebimento semanal de aluguel e caução são calculados automaticamente e exibidos nos gráficos e balanços gerais no topo do aplicativo.`;
    }

    if (q.includes('backup') || q.includes('restaurar') || q.includes('json') || q.includes('limpar') || q.includes('reset')) {
      return `💾 *Backup e Restauração de Dados:*\n\n• No cabeçalho do app, clique em **Download** para salvar uma cópia .JSON de toda a sua frota.\n• Se precisar importar em outro aparelho, use o botão **Upload**.\n• Para restaurar os dados padrão do sistema, clique no botão de recarregar 🔄.`;
    }

    return `🤖 *Atendimento do Assistente de Frota:*\n\nEntendi sua dúvida sobre "${query}".\n\n📌 **Recursos do Sistema:**\n• **Vistorias:** Realize vistorias de Entrega, Periódica e Devolução com checklist inteligente.\n• **Contagem de Revisão:** Alerta automático piscando quando faltar 3 dias ou menos.\n• **Selo Verde:** Exibe "Vistoria Realizada" quando o veículo está vistoriado.\n• **Documentos:** Armazena CRLV, Contrato e Vistorias finalizadas.\n\nSe precisar de detalhes específicos, digite sua pergunta!`;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || isThinking) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setIsThinking(true);

    try {
      let responseText = '';
      const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;

      if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `Você é o Assistente Virtual IA de um aplicativo profissional de Gestão de Frota de Veículos e Vistorias em Português do Brasil.
          Responda com clareza, empatia e formatação amigável (use marcadores e negrito).
          Dúvida do usuário: "${query}"
          Contexto do sistema: O sistema possui controle de vistorias (Entrega, Periódica, Devolução), checklist com envio de itens marcados para WhatsApp, contagem regressiva de 3 dias para revisão de manutenção, caução recolhível, pasta "Contratos Finalizados" com geração automática de relatório PDF ao excluir um veículo, histórico geral de lançamentos expansível/retraído, salvamento de vistorias em Documentos -> Vistoria, e lembrete automático de Sexta-Feira.`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
          });
          responseText = response.text || '';
        } catch (e) {
          console.log('Gemini API call fallback to local rule-based assistant:', e);
        }
      }

      if (!responseText) {
        responseText = getSmartLocalAnswer(query);
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: responseText,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const fallbackMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: getSmartLocalAnswer(query),
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" id="help-modal-overlay">
      <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" id="help-modal-card">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#161616]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Central de Ajuda e Suporte com IA
              </h2>
              <p className="text-xs text-gray-400">
                Aprenda a utilizar todas as funcionalidades e tire dúvidas com a IA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
            title="Fechar"
            id="btn-close-help-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-[#0d0d0d] px-4 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('vistorias')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'vistorias'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>📱 Vistorias & Links (Sem Cadastro)</span>
          </button>

          <button
            onClick={() => setActiveTab('frota')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'frota'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>🚗 Frota, Contratos & PDF</span>
          </button>

          <button
            onClick={() => setActiveTab('financeiro')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'financeiro'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>💰 Financeiro, Revisão & Cobrança</span>
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'faq'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>❓ FAQ & Esclarecimentos</span>
          </button>

          <button
            onClick={() => setActiveTab('reset')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'reset'
                ? 'border-rose-500 text-rose-400 bg-rose-500/10 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                : 'border-transparent text-rose-300 hover:text-white'
            }`}
          >
            <RefreshCw className="w-4 h-4 text-rose-400" />
            <span>⚙️ Backup & Reiniciar de Fábrica</span>
          </button>

          <button
            onClick={() => setActiveTab('ia')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'ia'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                : 'border-transparent text-indigo-300 hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>🤖 Assistente IA</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-gray-300 text-xs leading-relaxed flex-1">
          
          {/* Vistorias Tab */}
          {activeTab === 'vistorias' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Highlight Banner */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 shadow-md shadow-emerald-950/20">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span>📱 Envio de Vistoria para o Motorista (Sem Cadastro e Sem Aplicativo)</span>
                </div>
                <p className="text-gray-200 text-xs leading-relaxed">
                  O motorista <strong>NÃO precisa ter conta, não precisa de login e não precisa instalar nenhum aplicativo</strong>! Você envia apenas um link seguro pelo WhatsApp e ele preenche tudo direto no navegador do celular dele.
                </p>
              </div>

              <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-3">
                <h4 className="font-bold text-white text-xs flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">1</span>
                  <span>Passo a Passo de Solicitação via WhatsApp</span>
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-gray-300 text-xs pl-2">
                  <li>No cartão do veículo na tela principal, clique no botão <strong className="text-emerald-400">"Solicitar Vistoria por WhatsApp"</strong>.</li>
                  <li>O aplicativo abre o WhatsApp com um link exclusivo contendo a placa do veículo, nome do motorista e tipo de vistoria.</li>
                  <li>O motorista clica no link pelo celular, tira as fotos do veículo (frente, traseira, laterais, painel e estofados) e assinala os itens do checklist.</li>
                  <li>Ao enviar, o laudo em <strong>PDF completo com fotos e assinaturas</strong> é gerado automaticamente e salvo na aba de documentos do veículo!</li>
                </ol>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>Cancelar Vistoria Agendada</span>
                  </div>
                  <p className="text-gray-400 text-xs">
                    Caso o agendamento não seja mais necessário, clique no botão vermelho com ícone de lixeira <strong className="text-rose-400">"Cancelar Agendamento"</strong> no cartão do veículo. O alerta pendente será removido na hora.
                  </p>
                </div>

                <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Selo "Vistoria Realizada"</span>
                  </div>
                  <p className="text-gray-400 text-xs">
                    Assim que a vistoria é concluída com fotos, o cartão do veículo ganha em destaque verde o selo <strong className="text-emerald-400 font-bold">"Vistoria Realizada"</strong>, confirmando o status atualizado do carro.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>Checklist Personalizado no WhatsApp</span>
                </div>
                <p className="text-gray-400 text-xs">
                  Na mensagem resumida enviada ao WhatsApp do gestor, o sistema exibe <strong>somente os itens marcados com ✅</strong> no checklist, mantendo o texto limpo, enxuto e sem poluentes.
                </p>
              </div>

              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Lembrete Automático de Sexta-Feira</span>
                </div>
                <p className="text-gray-300 text-xs">
                  Nas sextas-feiras, o sistema exibe um banner de alerta para envio das vistorias semanais. Para ocultá-lo após enviar, basta clicar no botão <strong className="text-purple-300">"Marcar como Enviado / Concluir"</strong>.
                </p>
              </div>

            </div>
          )}

          {/* Frota Tab */}
          {activeTab === 'frota' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span>Gestão de Frota, Contratos & Finalização</span>
                </div>
                <p className="text-gray-300 text-xs">
                  Cadastre veículos, emita contratos em PDF, controle dados de motoristas e mantenha o arquivo morto de contratos encerrados.
                </p>
              </div>

              <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-3">
                <h4 className="font-bold text-amber-400 text-xs flex items-center gap-2">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Exclusão de Veículo & Pasta "Contratos Finalizados"</span>
                </h4>
                <p className="text-gray-300 text-xs leading-relaxed">
                  Quando você encerra um aluguel e exclui o veículo do sistema:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-400 text-xs pl-1">
                  <li>O aplicativo gera automaticamente um <strong>Relatório Final em PDF</strong> contendo todo o histórico do carro, motorista, valores recebidos, vistorias efetuadas e documentos.</li>
                  <li>O PDF do relatório é baixado e salvo na pasta <strong className="text-amber-300">"Contratos Finalizados"</strong> (botão de pasta na barra superior).</li>
                  <li>Você pode abrir, pesquisar ou baixar o histórico de contratos finalizados sempre que precisar.</li>
                </ul>
              </div>

              <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-3">
                <h4 className="font-bold text-white text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Documentos e Categoria Personalizada ("Outros")</span>
                </h4>
                <p className="text-gray-400 text-xs">
                  Anexe CRLV, Contratos de Locação e fotos de comprovantes na aba <strong>Documentos</strong>. Ao selecionar a categoria <strong className="text-blue-300">"Outros"</strong>, um campo editável permite digitar o nome exato do documento (ex: <em>Transferência, Laudo do Inmetro, Seguro Auto</em>).
                </p>
              </div>
            </div>
          )}

          {/* Financeiro Tab */}
          {activeTab === 'financeiro' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <DollarSign className="w-4 h-4 shrink-0" />
                  <span>Controle Financeiro, Revisões e Mensagens de Cobrança</span>
                </div>
                <p className="text-gray-300 text-xs">
                  Acompanhe pagamentos de aluguel semanal, cauções, manutenções e cobranças por WhatsApp.
                </p>
              </div>

              <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-3">
                <h4 className="font-bold text-amber-400 text-xs flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                  <span>Contagem Regressiva de Revisão / Manutenção (3 Dias)</span>
                </h4>
                <p className="text-gray-300 text-xs leading-relaxed">
                  Quando restar <strong>3 dias ou menos</strong> para a data da próxima manutenção preventiva, o sistema ativa um <strong>cronômetro regressivo piscando em alerta em tempo real</strong> (dias, horas, minutos e segundos) no cartão do veículo e na agenda!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-2">
                  <h4 className="font-bold text-white text-xs">💰 Caução de Garantia Expansível</h4>
                  <p className="text-gray-400 text-xs">
                    Para manter a interface limpa, o módulo de Caução de Garantia inicia recolhido. Clique na linha da caução para expandir e gerenciar parcelas e devoluções.
                  </p>
                </div>

                <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-2">
                  <h4 className="font-bold text-white text-xs">📜 Histórico Geral Retraído</h4>
                  <p className="text-gray-400 text-xs">
                    O Histórico de lançamentos inicia oculto para não sobrecarregar a tela. Clique no botão <strong className="text-blue-400">"Expandir"</strong> no topo da seção para ver os filtros e buscas.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-2">
                <h4 className="font-bold text-emerald-400 text-xs">📲 Lembrete e Cobrança de Aluguel no WhatsApp</h4>
                <p className="text-gray-400 text-xs">
                  Utilize as opções rápidas de mensagem para WhatsApp para avisar o motorista sobre o vencimento semanal do aluguel: <strong>Lembrete Prévio</strong>, <strong>Vencimento Hoje</strong> e <strong>Cobrança de Atrasado</strong>.
                </p>
              </div>
            </div>
          )}

          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1">
                <h4 className="font-bold text-emerald-400 text-xs"> O motorista precisa de cadastro ou aplicativo?</h4>
                <p className="text-gray-200 text-xs">
                  <strong>NÃO!</strong> O motorista abre o link diretamente no navegador de qualquer celular (Android ou iPhone), tira as fotos e envia a vistoria sem precisar instalar nada e sem precisar criar conta.
                </p>
              </div>

              <div className="p-3.5 bg-white/[0.03] border border-white/10 rounded-xl space-y-1">
                <h4 className="font-bold text-amber-400 text-xs">O que acontece quando excluo um veículo da frota?</h4>
                <p className="text-gray-300">
                  O sistema compila automaticamente um <strong className="text-amber-300">Relatório Final em PDF</strong> contendo todos os dados do veículo, locatário, pagamentos semanais, vistorias e documentos. O PDF é baixado e salvo na pasta <strong className="text-amber-300">"Contratos Finalizados"</strong>.
                </p>
              </div>

              <div className="p-3.5 bg-white/[0.03] border border-white/10 rounded-xl space-y-1">
                <h4 className="font-bold text-amber-400 text-xs">Como fazer backup dos dados no celular ou PC?</h4>
                <p className="text-gray-300">
                  Na aba <strong className="text-emerald-400">"⚙️ Backup & Reiniciar de Fábrica"</strong> desta ajuda, clique no botão <strong>"Fazer Backup (Salvar JSON)"</strong>. O arquivo `.json` será salvo na sua pasta de downloads.
                </p>
              </div>

              <div className="p-3.5 bg-white/[0.03] border border-white/10 rounded-xl space-y-1">
                <h4 className="font-bold text-amber-400 text-xs">Como restaurar um backup antigo ou transferir de celular?</h4>
                <p className="text-gray-300">
                  Na aba <strong className="text-emerald-400">"⚙️ Backup & Reiniciar de Fábrica"</strong>, clique em <strong>"Restaurar Backup (Carregar Arquivo)"</strong> e selecione o arquivo `.json` salvo anteriormente. Todos os dados serão recarregados na hora.
                </p>
              </div>

              <div className="p-3.5 bg-white/[0.03] border border-white/10 rounded-xl space-y-1">
                <h4 className="font-bold text-amber-400 text-xs">Como apagar dados específicos sem apagar tudo?</h4>
                <p className="text-gray-300">
                  Na aba <strong className="text-rose-400">"⚙️ Backup & Reiniciar de Fábrica"</strong>, marque apenas as caixas das categorias que deseja excluir (ex: somente Vistorias, ou somente Manutenções) e clique em <strong>Excluir Selecionados</strong>.
                </p>
              </div>

              <div className="p-3.5 bg-white/[0.03] border border-white/10 rounded-xl space-y-1">
                <h4 className="font-bold text-amber-400 text-xs">O que significa o selo verde "Vistoria Realizada"?</h4>
                <p className="text-gray-300">
                  É o selo de confirmação indicando que o veículo já passou por uma vistoria concluída com fotos e laudo registrado no sistema.
                </p>
              </div>

              <div className="p-3.5 bg-white/[0.03] border border-white/10 rounded-xl space-y-1">
                <h4 className="font-bold text-amber-400 text-xs">Como cancelar uma vistoria pendente?</h4>
                <p className="text-gray-300">
                  No cartão do carro, clique na lixeira vermelha <strong className="text-rose-400">"Cancelar Agendamento"</strong>.
                </p>
              </div>

              <div className="p-3.5 bg-white/[0.03] border border-white/10 rounded-xl space-y-1">
                <h4 className="font-bold text-amber-400 text-xs">Como anexar CRLV/Contrato no WhatsApp?</h4>
                <p className="text-gray-300">
                  Ao clicar em enviar para o WhatsApp, o aplicativo baixa o arquivo PDF/imagem para seu aparelho. No WhatsApp, basta clicar no ícone do clipe 📎 e selecionar o arquivo baixado.
                </p>
              </div>

            </div>
          )}

          {/* AI Assistant Tab */}
          {activeTab === 'ia' && (
            <div className="space-y-4 animate-in fade-in duration-200 flex flex-col h-[480px]">
              <div className="p-3 bg-gradient-to-r from-indigo-950/60 via-purple-950/60 to-indigo-900/60 border border-indigo-500/30 rounded-xl flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-indigo-300">
                    <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Assistente IA de Gestão de Frota</span>
                      <span className="text-[9px] bg-indigo-500/30 text-indigo-200 px-1.5 py-0.2 rounded font-mono">
                        Gemini AI
                      </span>
                    </h4>
                    <p className="text-[10px] text-indigo-200/80">
                      Tire dúvidas sobre vistorias, pagamentos, revisões e relatórios
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMessages([{
                    id: 'msg-reset',
                    sender: 'ai',
                    text: 'Conversa reiniciada! Como posso ajudar você agora?',
                    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                  }])}
                  className="p-1.5 text-gray-400 hover:text-rose-400 transition-colors text-[10px] flex items-center gap-1 bg-white/5 hover:bg-white/10 rounded-md border border-white/5"
                  title="Limpar histórico do chat"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Limpar</span>
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-black/40 border border-white/5 rounded-xl scrollbar-thin">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl p-3 text-xs space-y-1 ${
                        m.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/20'
                          : 'bg-[#18181b] border border-white/10 text-gray-200 rounded-bl-none shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1 mb-1">
                        <span className="font-bold text-[10px] opacity-80 flex items-center gap-1">
                          {m.sender === 'user' ? 'Você' : '🤖 Assistente Frota IA'}
                        </span>
                        <span className="text-[9px] opacity-60 font-mono">{m.timestamp}</span>
                      </div>
                      <div className="whitespace-pre-wrap leading-relaxed text-[11px]">
                        {m.text}
                      </div>
                    </div>
                  </div>
                ))}

                {isThinking && (
                  <div className="flex justify-start">
                    <div className="bg-[#18181b] border border-white/10 text-indigo-300 rounded-xl p-3 text-xs flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>Analisando sua dúvida com IA...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-[10px] shrink-0 scrollbar-none">
                {[
                  'Como funciona a pasta Contratos Finalizados (PDF)?',
                  'Como cancelar vistoria agendada?',
                  'Como enviar link de vistoria para o motorista?',
                  'Como funciona o checklist do WhatsApp?',
                  'O que é o selo verde Vistoria Realizada?',
                  'Como funciona o Histórico de Lançamentos?',
                  'Como funciona o lembrete de Sexta-Feira?',
                  'Como enviar CRLV/Contrato pelo WhatsApp?',
                  'Como ver as fotos das vistorias?',
                  'Contagem regressiva de revisão (3 dias)',
                  'Como fazer backup dos dados?'
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip)}
                    className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 rounded-full shrink-0 transition-all font-medium"
                  >
                    💡 {chip}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2 shrink-0 pt-1">
                <input
                  type="text"
                  placeholder="Digite sua pergunta para a IA sobre a frota..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  className="flex-1 text-xs bg-black border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-indigo-500/80 transition-colors font-sans"
                />
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={isThinking || !inputQuery.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar</span>
                </button>
              </div>
            </div>
          )}

          {/* Reset / Reiniciar de Fábrica Tab */}
          {activeTab === 'reset' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Backup & Restauração Card */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-3 shadow-lg shadow-emerald-950/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <Download className="w-4 h-4 shrink-0" />
                    <span>💾 Backup dos Dados (Salvar em Pasta do Celular/PC)</span>
                  </div>
                  <span className="text-[10px] text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold w-fit">
                    Recomendado antes de apagar
                  </span>
                </div>
                <p className="text-gray-300 text-xs leading-relaxed">
                  Gere um arquivo de segurança com todas as vistorias, veículos, abastecimentos, despesas e contratos. Caso decida apagar tudo ou trocar de dispositivo, você pode carregar o arquivo salvo para restaurar seu sistema imediatamente.
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (onExportBackup) onExportBackup();
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Fazer Backup (Salvar Arquivo JSON)</span>
                  </button>

                  <label className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95">
                    <Upload className="w-4 h-4" />
                    <span>Restaurar Backup (Carregar Arquivo)</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={(e) => {
                        if (onImportBackup) onImportBackup(e);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <RefreshCw className="w-4 h-4" />
                  <span>Reiniciar de Fábrica & Exclusão Selecionada</span>
                </div>
                <p className="text-gray-300 text-xs">
                  Selecione abaixo as caixas de escolha das categorias de dados que você deseja apagar do sistema, ou clique no botão de exclusão total para redefinir todo o aplicativo.
                </p>
              </div>

              {/* Selection controls */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-gray-200">
                  Marque os dados que você deseja apagar:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const allSelected = Object.values(resetCategories).every(Boolean);
                    setResetCategories({
                      veiculos: !allSelected,
                      vistorias: !allSelected,
                      manutencoes: !allSelected,
                      abastecimentos: !allSelected,
                      contratosFinalizados: !allSelected,
                      agenda: !allSelected,
                      configuracoes: !allSelected
                    });
                  }}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                >
                  {Object.values(resetCategories).every(Boolean) ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </button>
              </div>

              {/* Checkboxes List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'veiculos', title: '🚗 Veículos e Frota', desc: 'Carros cadastrados, placas e dados de motoristas' },
                  { key: 'vistorias', title: '📋 Vistorias e Checklists', desc: 'Histórico de vistorias com laudos e fotos' },
                  { key: 'manutencoes', title: '🔧 Manutenções e Despesas', desc: 'Registros de manutenção, peças e custos extras' },
                  { key: 'abastecimentos', title: '⛽ Abastecimentos e Viagens', desc: 'Registros de combustível, km e viagens ativas' },
                  { key: 'contratosFinalizados', title: '📄 Contratos Finalizados', desc: 'Pasta de contratos encerrados e PDFs arquivados' },
                  { key: 'agenda', title: '📞 Agenda de Contatos', desc: 'Contatos salvos de motoristas e prestadores' },
                  { key: 'configuracoes', title: '⚙️ Configurações e Modelos', desc: 'Modelos de mensagens e preferências salvas' }
                ].map((item) => (
                  <label
                    key={item.key}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all cursor-pointer ${
                      resetCategories[item.key as keyof typeof resetCategories]
                        ? 'bg-rose-500/10 border-rose-500/30 text-white'
                        : 'bg-white/[0.02] border-white/10 text-gray-400 hover:bg-white/[0.04]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={resetCategories[item.key as keyof typeof resetCategories]}
                      onChange={(e) => {
                        const k = item.key as keyof typeof resetCategories;
                        setResetCategories((prev) => ({
                          ...prev,
                          [k]: e.target.checked
                        }));
                      }}
                      className="mt-1 w-4 h-4 accent-rose-500 rounded cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <span className="font-bold text-xs block text-white">{item.title}</span>
                      <span className="text-[11px] text-gray-400 block">{item.desc}</span>
                    </div>
                  </label>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  type="button"
                  disabled={!Object.values(resetCategories).some(Boolean)}
                  onClick={() => {
                    setIsResetAllMode(false);
                    setIsConfirmResetOpen(true);
                  }}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-600/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Selecionados</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setResetCategories({
                      veiculos: true,
                      vistorias: true,
                      manutencoes: true,
                      abastecimentos: true,
                      contratosFinalizados: true,
                      agenda: true,
                      configuracoes: true
                    });
                    setIsResetAllMode(true);
                    setIsConfirmResetOpen(true);
                  }}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Excluir Tudo (Reiniciar de Fábrica)</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-[#161616] flex justify-between items-center">
          <span className="text-[11px] text-gray-500">
            Sistema de Gestão de Frota • Ajuda e IA em Tempo Real
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-blue-500/15 cursor-pointer"
          >
            Entendi
          </button>
        </div>

      </div>

      {/* Pop-up de Confirmação para Exclusão de Dados */}
      {isConfirmResetOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[60] animate-in fade-in duration-150">
          <div className="bg-[#18181b] border border-rose-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {isResetAllMode ? 'Reiniciar de Fábrica (Excluir Tudo)?' : 'Excluir Dados Selecionados?'}
                </h3>
                <p className="text-xs text-rose-300 font-semibold">Esta ação é irreversível e apagará os registros!</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              {isResetAllMode
                ? 'Você está prestes a apagar TODOS os veículos, vistorias, documentos, despesas, agenda e configurações do sistema.'
                : 'Você está prestes a apagar permanentemente as categorias selecionadas.'}
            </p>

            <div className="bg-black/50 p-3 rounded-xl border border-white/10 text-[11px] space-y-1">
              <span className="font-bold text-gray-400 block uppercase text-[9px]">Categorias que serão apagadas:</span>
              <ul className="list-disc list-inside space-y-0.5 text-rose-300 font-medium">
                {(isResetAllMode || resetCategories.veiculos) && <li>Veículos e Frota</li>}
                {(isResetAllMode || resetCategories.vistorias) && <li>Vistorias e Checklists com Fotos</li>}
                {(isResetAllMode || resetCategories.manutencoes) && <li>Manutenções e Despesas</li>}
                {(isResetAllMode || resetCategories.abastecimentos) && <li>Abastecimentos e Viagens</li>}
                {(isResetAllMode || resetCategories.contratosFinalizados) && <li>Pasta de Contratos Finalizados</li>}
                {(isResetAllMode || resetCategories.agenda) && <li>Agenda de Contatos</li>}
                {(isResetAllMode || resetCategories.configuracoes) && <li>Configurações e Preferências</li>}
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmResetOpen(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmResetOpen(false);
                  if (onResetSelectedData) {
                    if (isResetAllMode) {
                      onResetSelectedData({
                        veiculos: true,
                        vistorias: true,
                        manutencoes: true,
                        abastecimentos: true,
                        contratosFinalizados: true,
                        agenda: true,
                        configuracoes: true
                      });
                    } else {
                      onResetSelectedData(resetCategories);
                    }
                  }
                  onClose();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Confirmar e Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
