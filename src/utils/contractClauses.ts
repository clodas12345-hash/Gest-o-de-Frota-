export interface ContractClause {
  id: string;
  section: string;
  clauseLabel: string;
  title: string;
  text: string;
  isCustom?: boolean;
}

export const DEFAULT_CONTRACT_CLAUSES: ContractClause[] = [
  {
    id: 'clausula_1_objeto',
    section: '2. DO OBJETO',
    clauseLabel: 'Cláusula 1ª',
    title: 'Objeto da Locação',
    text: 'O objeto deste contrato é a locação do veículo de propriedade do LOCADOR, com as seguintes características: Marca/Modelo: {MARCA_MODELO} | Ano/Modelo: {ANO_MODELO} | Placa: {PLACA} | Cor: {COR}. O veículo é entregue com tanque cheio (álcool/gasolina) e quilometragem inicial de {KM_INICIAL} km.'
  },
  {
    id: 'clausula_2_finalidade',
    section: '3. DA FINALIDADE EXCLUSIVA',
    clauseLabel: 'Cláusula 2ª',
    title: 'Finalidade do Veículo',
    text: 'O veículo destina-se exclusivamente à prestação de serviços de transporte privado de passageiros por meio de aplicativos regulamentados (ex.: Uber, 99, InDrive).'
  },
  {
    id: 'clausula_2_paragrafo',
    section: '3. DA FINALIDADE EXCLUSIVA',
    clauseLabel: '• Parágrafo Único',
    title: 'Vedação a Terceiros',
    text: 'É expressamente proibida a sublocação, o empréstimo ou a cessão a terceiros (mesmo que parentes), sob pena de rescisão imediata e retomada do veículo.'
  },
  {
    id: 'clausula_3_prazo',
    section: '4. DO PRAZO E RENOVAÇÃO',
    clauseLabel: 'Cláusula 3ª',
    title: 'Prazo de Vigência',
    text: 'A vigência tem início em {DATA_INICIO}, com duração inicial de 30 (trinta) dias, renovável automaticamente a cada 7 (sete) dias, por prazo indeterminado.'
  },
  {
    id: 'clausula_4_rescisao',
    section: '4. DO PRAZO E RENOVAÇÃO',
    clauseLabel: 'Cláusula 4ª',
    title: 'Aviso Prévio e Rescisão Antecipada',
    text: 'A rescisão por qualquer das partes exige aviso prévio por escrito com antecedência mínima de 48 (quarenta e oito) horas, ressalvadas as hipóteses de retomada imediata previstas neste instrumento.'
  },
  {
    id: 'clausula_4_paragrafo',
    section: '4. DO PRAZO E RENOVAÇÃO',
    clauseLabel: '• Parágrafo Único',
    title: 'Multa por Quebra Antecipada',
    text: 'Caso o LOCATÁRIO solicite a rescisão antes de completado o período mínimo inicial de 30 (trinta) dias, incidirá multa compensatória de 20% (vinte por cento) calculada proporcionalmente sobre o saldo dos dias restantes para o término do referido prazo mínimo, sem prejuízo do cumprimento do aviso prévio de 48 horas e das demais obrigações financeiras pendentes.'
  },
  {
    id: 'clausula_5_valores',
    section: '5. DOS VALORES, PAGAMENTO E CAUÇÃO',
    clauseLabel: 'Cláusula 5ª',
    title: 'Aluguel Semanal e Pagamento',
    text: 'O aluguel semanal é de R$ {VALOR_SEMANAL} ({VALOR_SEMANAL_EXTENSO}). A primeira semana é paga no prazo de 7 (sete) dias corridos a contar da retirada do veículo, e os pagamentos subsequentes ocorrem {DIA_VENCIMENTO}, via PIX para a chave {CHAVE_PIX}.'
  },
  {
    id: 'clausula_6_mora',
    section: '5. DOS VALORES, PAGAMENTO E CAUÇÃO',
    clauseLabel: 'Cláusula 6ª (Multa, Juros e Bloqueio por Atraso)',
    title: 'Mora, Juros e Bloqueio Remoto',
    text: 'O não pagamento do aluguel ou dos valores acessórios até às 23h59 da data de vencimento constitui o LOCATÁRIO em mora automática, gerando multa fixa de {TAXA_MULTA}% ({TAXA_MULTA_EXTENSO}) sobre o valor da semana vencida, acrescida de juros moratórios de {TAXA_JUROS}% ao mês (pro rata die) logo a partir do 1º (primeiro) dia de atraso. Caso o pagamento não seja regularizado, o LOCADOR notificará o LOCATÁRIO, via aplicativo, SMS ou WhatsApp, para que estacione o veículo em local seguro, realizando o bloqueio remoto do veículo, sem prejuízo de outras sanções legais.'
  },
  {
    id: 'clausula_7_caucao',
    section: '5. DOS VALORES, PAGAMENTO E CAUÇÃO',
    clauseLabel: 'Cláusula 7ª (Caução)',
    title: 'Depósito Caução',
    text: 'O LOCATÁRIO pagará R$ {VALOR_CAUCAO} ({VALOR_CAUCAO_EXTENSO}) a título de caução à vista, no ato da retirada do veículo. O valor da caução não pode, em hipótese alguma, ser utilizado para abatimento ou pagamento de aluguel semanal, sendo restituído integralmente em até 30 (trinta) dias após a devolução do veículo, desde que inexistam danos, multas ou pendências financeiras.'
  },
  {
    id: 'clausula_8_semparar',
    section: '5. DOS VALORES, PAGAMENTO E CAUÇÃO',
    clauseLabel: 'Cláusula 8ª (Sem Parar)',
    title: 'Reembolso de Pedágios e Estacionamentos',
    text: 'O LOCADOR será reembolsado integralmente pelo LOCATÁRIO na primeira semana de cada mês, mediante a apresentação de extrato detalhado de utilização do sistema de pedágio/estacionamento automático.'
  },
  {
    id: 'clausula_9_multas',
    section: '6. DAS MULTAS DE TRÂNSITO',
    clauseLabel: 'Cláusula 9ª',
    title: 'Responsabilidade por Infrações',
    text: 'O LOCATÁRIO é o único responsável pelas multas de trânsito cometidas durante a vigência do contrato, contadas desde a retirada até a efetiva devolução do veículo, ainda que a notificação seja emitida ou entregue após a restituição do automóvel ou da caução. Infrações cometidas após a devolução formal do veículo não são de responsabilidade do LOCATÁRIO.'
  },
  {
    id: 'clausula_9_paragrafo_1',
    section: '6. DAS MULTAS DE TRÂNSITO',
    clauseLabel: '• Parágrafo Primeiro',
    title: 'Cobrança da Multa',
    text: 'O valor das multas de trânsito será cobrado junto ao aluguel semanal 15 dias após a notificação, integrando o montante devido para todos os efeitos, inclusive incidência de mora, multa e bloqueio previstos na Cláusula 6ª.'
  },
  {
    id: 'clausula_9_paragrafo_2',
    section: '6. DAS MULTAS DE TRÂNSITO',
    clauseLabel: '• Parágrafo Segundo',
    title: 'Infrações Notificadas Pós-Devolução',
    text: 'Multas de infrações cometidas durante a vigência do contrato, mas notificadas após a devolução do veículo, deverão ser pagas em até 15 (quinze) dias corridos a contar da notificação, sob pena de execução e cobrança judicial. A data e o horário da infração registrados no órgão competente definem a responsabilidade temporal.'
  },
  {
    id: 'clausula_9_paragrafo_3',
    section: '6. DAS MULTAS DE TRÂNSITO',
    clauseLabel: '• Parágrafo Terceiro (Taxa Administrativa por Pagamento Direto)',
    title: 'Taxa Administrativa de Gestão',
    text: 'Caso o LOCATÁRIO não efetue o pagamento da multa de trânsito no prazo estabelecido, exigindo que o LOCADOR realize o pagamento e a gestão administrativa da infração, incidirá taxa administrativa de 20% (vinte por cento) sobre o valor nominal da multa, a ser reembolsada pelo LOCATÁRIO no próximo vencimento semanal.'
  },
  {
    id: 'clausula_10_manutencao',
    section: '7. DA MANUTENÇÃO, USO E SEGURANÇA',
    clauseLabel: 'Cláusula 10ª',
    title: 'Quilometragem e Manutenção Preventiva',
    text: 'O veículo possui limite de quilometragem de {LIMITE_KM} rodados por mês. Caso este limite seja ultrapassado e torne-se necessário antecipar a revisão, os custos da manutenção preventiva antecipada serão rateados em 50/50 entre LOCADOR e LOCATÁRIO. A manutenção preventiva regular ocorre a cada 7.000 km rodados {OFICINA_NOME}.'
  },
  {
    id: 'clausula_10_paragrafo',
    section: '7. DA MANUTENÇÃO, USO E SEGURANÇA',
    clauseLabel: '• Parágrafo Único',
    title: 'Divisão de Despesas de Manutenção',
    text: 'Despesas com troca de óleo e filtros correm por conta do LOCADOR; o desgaste natural de peças de uso periódico é dividido igualmente (50/50); e eventuais danos decorrentes de mau uso, imperícia ou negligência são de responsabilidade integral do LOCATÁRIO.'
  },
  {
    id: 'clausula_11_seguranca',
    section: '7. DA MANUTENÇÃO, USO E SEGURANÇA',
    clauseLabel: 'Cláusula 11ª',
    title: 'Proibição de Fumo e Câmeras/Rastreador',
    text: 'É expressamente proibido fumar no interior do veículo. O veículo é equipado com rastreador e câmeras internas/externas, sendo proibida qualquer tentativa de obstrução, violação ou desligamento desses dispositivos.'
  },
  {
    id: 'clausula_12_combustivel',
    section: '7. DA MANUTENÇÃO, USO E SEGURANÇA',
    clauseLabel: 'Cláusula 12ª',
    title: 'Combustível Adulterado',
    text: 'Caso a luz de injeção acenda por suspeita de abastecimento com combustível de baixa qualidade, o LOCATÁRIO obriga-se a realizar a troca imediata do combustível para a devida verificação e solução do problema.'
  },
  {
    id: 'clausula_13_bloqueio',
    section: '7. DA MANUTENÇÃO, USO E SEGURANÇA',
    clauseLabel: 'Cláusula 13ª (Bloqueio Remoto e Retomada Imediata)',
    title: 'Hipóteses de Retomada e Bloqueio',
    text: 'O LOCADOR poderá realizar o bloqueio remoto do veículo e declarar o contrato rescindido com retomada imediata, sem aviso prévio, nas seguintes hipóteses: (i) inadimplência superior a 2 (dois) dias; (ii) uso indevido, sublocação ou condução por terceiros não autorizados; (iii) abandono do veículo; ou (iv) descumprimento de qualquer cláusula deste instrumento. O bloqueio remoto não desobriga o LOCATÁRIO do pagamento dos valores devidos da locação.'
  },
  {
    id: 'clausula_13_paragrafo',
    section: '7. DA MANUTENÇÃO, USO E SEGURANÇA',
    clauseLabel: '• Parágrafo Único',
    title: 'Apropriação Indébita',
    text: 'A recusa injustificada em restituir o veículo ao LOCADOR após a rescisão ou notificação de retomada configurará crime de Apropriação Indébita (art. 168 do Código Penal), autorizando o acionamento imediato das autoridades policiais e medidas judiciais de busca e apreensão.'
  },
  {
    id: 'clausula_14_modificacoes',
    section: '7. DA MANUTENÇÃO, USO E SEGURANÇA',
    clauseLabel: 'Cláusula 14ª (Modificações e Documentos)',
    title: 'Modificações e Porte do CRLV',
    text: 'É proibido modificar, adesivar, plotar, remover peças ou instalar equipamentos no veículo sem autorização prévia e por escrito do LOCADOR. O LOCATÁRIO deverá portar e manter o CRLV (físico ou digital) válido e acessível durante a condução, devolvendo-o incontinenti ao término do contrato e abstendo-se de entregá-lo a terceiros.'
  },
  {
    id: 'clausula_15_avarias',
    section: '8. DA DEVOLUÇÃO E AVARIAS',
    clauseLabel: 'Cláusula 15ª',
    title: 'Conserto de Avarias e Lucros Cessantes',
    text: 'Em caso de avarias decorrentes de mau uso que exijam reparo em oficina, o LOCATÁRIO arcará com o valor integral do conserto em até 20 (vinte) dias corridos da ocorrência, restando expressamente estabelecido que a obrigatoriedade do pagamento do aluguel com o carro parado continua sendo do LOCATÁRIO.'
  },
  {
    id: 'clausula_16_termos_devolucao',
    section: '8. DA DEVOLUÇÃO E AVARIAS',
    clauseLabel: 'Cláusula 16ª (Termos de Devolução)',
    title: 'Condições de Devolução',
    text: 'O veículo deverá ser devolvido limpo, com o tanque de combustível no mesmo nível da retirada e acompanhado das fotos/vídeos comparativos de vistoria.'
  },
  {
    id: 'clausula_16_paragrafo_1',
    section: '8. DA DEVOLUÇÃO E AVARIAS',
    clauseLabel: '• Parágrafo Primeiro',
    title: 'Combustível e Higienização',
    text: 'Caso o veículo seja devolvido com combustível abaixo do nível da retirada, o LOCATÁRIO reembolsará o valor correspondente. Se for devolvido em condições de sujeira excessiva que exijam higienização profissional, será cobrada a taxa correspondente de R$ 150,00 (ou o valor equivalente à higienização).'
  },
  {
    id: 'clausula_16_paragrafo_2',
    section: '8. DA DEVOLUÇÃO E AVARIAS',
    clauseLabel: '• Parágrafo Segundo',
    title: 'Atraso na Devolução',
    text: 'A devolução realizada após o horário combinado implicará a cobrança de diária proporcional de 1/7 do valor do aluguel semanal por dia de atraso, sem prejuízo das penalidades por quebra contratual.'
  },
  {
    id: 'clausula_17_vistoria',
    section: '9. DA VISTORIA E MONITORAMENTO (LGPD)',
    clauseLabel: 'Cláusula 17ª',
    title: 'Obrigatoriedade de Vistoria Semanal',
    text: 'É obrigatório o registro fotográfico e em vídeo do painel, pneus e lataria no momento da retirada e da devolução. O LOCATÁRIO obriga-se, ainda, a enviar a vistoria semanal por aplicativo ou WhatsApp em dia e horário previamente ajustados com o LOCADOR.'
  },
  {
    id: 'clausula_18_lgpd',
    section: '9. DA VISTORIA E MONITORAMENTO (LGPD)',
    clauseLabel: 'Cláusula 18ª (Privacidade e LGPD)',
    title: 'Consentimento de Monitoramento e LGPD',
    text: 'O LOCATÁRIO autoriza expressamente o monitoramento do veículo por meio de rastreador e câmeras, abrangendo localização em tempo real, rotas, velocidades, imagens e áudio interno, para fins estritos de segurança, gestão de frota, prevenção de fraudes e defesa jurídica em eventuais litígios, em total conformidade com a Lei nº 13.709/2018 (LGPD).'
  },
  {
    id: 'clausula_19_sinistros',
    section: '10. DOS SINISTROS E TRATATIVAS COM TERCEIROS',
    clauseLabel: 'Cláusula 19ª',
    title: 'Comunicação de Sinistros e B.O.',
    text: 'Em caso de acidente, colisão, furto, roubo ou qualquer sinistro envolvendo terceiros, o LOCATÁRIO deverá comunicar o LOCADOR imediatamente e registrar o respectivo Boletim de Ocorrência (B.O.).'
  },
  {
    id: 'clausula_19_paragrafo_1',
    section: '10. DOS SINISTROS E TRATATIVAS COM TERCEIROS',
    clauseLabel: '• Parágrafo Primeiro',
    title: 'Tratativas Exclusivas com o Proprietário',
    text: 'Qualquer negociação, acordo, tratativa ou contato com terceiros envolvidos ou com as seguradoras respectivas deverá ser conduzido e autorizado estritamente pelo LOCADOR. É vedado ao LOCATÁRIO firmar acordos ou prometer pagamentos em nome do proprietário.'
  },
  {
    id: 'clausula_19_paragrafo_2',
    section: '10. DOS SINISTROS E TRATATIVAS COM TERCEIROS',
    clauseLabel: '• Parágrafo Segundo',
    title: 'Vedação ao Uso de Dados do Locatário',
    text: 'O CPF e os documentos pessoais do LOCATÁRIO não poderão ser utilizados por terceiros para abertura de reclamações, processos ou acionamentos de seguros, sendo tal prerrogativa exclusiva do LOCADOR.'
  },
  {
    id: 'clausula_19_paragrafo_3',
    section: '10. DOS SINISTROS E TRATATIVAS COM TERCEIROS',
    clauseLabel: '• Parágrafo Terceiro',
    title: 'Penalidades por Descumprimento',
    text: 'A violação desta cláusula caracteriza infração contratual grave, ensejando rescisão imediata do contrato e responsabilização civil e criminal do LOCATÁRIO por eventuais prejuízos.'
  },
  {
    id: 'clausula_20_seguro',
    section: '11. DO SEGURO',
    clauseLabel: 'Cláusula 20ª',
    title: 'Cobertura Securitária',
    text: 'O veículo possui apólice de seguro contratada junto à {SEGURADORA_NOME}, contemplando assistência 24 horas, cobertura para furto/roubo, colisão completa (danos próprios e a terceiros), carro reserva e proteção de vidros.'
  },
  {
    id: 'clausula_20_paragrafo_1',
    section: '11. DO SEGURO',
    clauseLabel: '• Parágrafo Primeiro',
    title: 'Franquia do Seguro',
    text: 'Em caso de sinistro com necessidade de acionamento do seguro, a franquia e eventuais despesas acessórias serão de responsabilidade integral do LOCATÁRIO.'
  },
  {
    id: 'clausula_20_paragrafo_2',
    section: '11. DO SEGURO',
    clauseLabel: '• Parágrafo Segundo',
    title: 'Limite de Acionamento de Assistência',
    text: 'É permitido apenas 01 (um) acionamento por mês para serviços de assistência 24 horas. Acionamentos adicionais correrão exclusivamente por conta do LOCATÁRIO.'
  },
  {
    id: 'clausula_20_paragrafo_3',
    section: '11. DO SEGURO',
    clauseLabel: '• Parágrafo Terceiro',
    title: 'Telefones de Emergência',
    text: 'Contatos de emergência do seguro: {SEGURADORA_FONES}.'
  },
  {
    id: 'clausula_21_observacoes',
    section: '12. OBSERVAÇÕES E CONDIÇÕES ESPECÍFICAS',
    clauseLabel: 'Cláusula 21ª',
    title: 'Condições Específicas do Ajuste',
    text: 'Caução de R$ 1.000,00 no ato, sendo R$ 920,00 divididos em 8x de R$ 100,00 + 1x de R$ 120,00 pagos semanalmente junto com a semanal do carro. Contrato de 3 meses, com desconto de R$ 25,00 semanal por 12 semanas. Caso ocorra a quebra de contrato antes das 12 semanas, o valor de desconto acumulado será descontado da caução. Da 13ª semana em diante, o valor retorna ao padrão integral ou mediante aditivo contratual.'
  },
  {
    id: 'clausula_22_foro',
    section: '13. DO FORO E DISPOSIÇÕES FINAIS',
    clauseLabel: 'Cláusula 22ª',
    title: 'Eleição de Foro',
    text: 'Para dirimir quaisquer controvérsias ou litígios oriundos do presente contrato, as partes elegem expressamente o Foro da Comarca de São Paulo/SP, renunciando a qualquer outro, por mais privilegiado que seja.'
  }
];

const STORAGE_KEY = 'fleet_contract_clauses_custom';
export const FULL_TEXT_STORAGE_KEY = 'fleet_contract_full_text_custom';

let inMemoryClauses: ContractClause[] | null = null;
let inMemoryFullText: string | null | undefined = undefined;

function freeStorageSpaceForTemplates(): void {
  try {
    // 1. Remove redundant snapshot cache first (fleet_vehicles is already stored separately)
    localStorage.removeItem('fleet_vehicles_last_known');
  } catch (e) {}

  try {
    // 2. Trim oversized base64 document data URLs inside fleet_vehicles cache if still tight
    const rawVehicles = localStorage.getItem('fleet_vehicles');
    if (rawVehicles && rawVehicles.length > 500000) {
      const parsed = JSON.parse(rawVehicles);
      if (Array.isArray(parsed)) {
        const lean = parsed.map((v: any) => ({
          ...v,
          documents: Array.isArray(v.documents)
            ? v.documents.map((d: any) => ({
                ...d,
                contentUrl: d?.contentUrl && d.contentUrl.length > 50000 ? '' : d?.contentUrl
              }))
            : []
        }));
        localStorage.setItem('fleet_vehicles', JSON.stringify(lean));
      }
    }
  } catch (e) {}

  try {
    // 3. Trim oversized base64 photos inside fleet_vistorias cache if still tight
    const rawVistorias = localStorage.getItem('fleet_vistorias');
    if (rawVistorias && rawVistorias.length > 500000) {
      const parsed = JSON.parse(rawVistorias);
      if (Array.isArray(parsed)) {
        const lean = parsed.map((vist: any) => ({
          ...vist,
          pdfDataUrl: vist?.pdfDataUrl && vist.pdfDataUrl.length > 50000 ? '' : vist?.pdfDataUrl,
          photos: Array.isArray(vist.photos)
            ? vist.photos.filter((p: any) => typeof p === 'string' && p.length <= 50000)
            : []
        }));
        localStorage.setItem('fleet_vistorias', JSON.stringify(lean));
      }
    }
  } catch (e) {}
}

function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn(`Erro ao salvar ${key} no localStorage, tentando liberar espaço:`, e);
    freeStorageSpaceForTemplates();
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e2) {
      console.error(`Falha definitiva ao gravar ${key} no localStorage:`, e2);
      return false;
    }
  }
}

export function getSavedContractClauses(): ContractClause[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryClauses = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Erro ao ler cláusulas salvas do localStorage:', e);
  }
  if (inMemoryClauses && inMemoryClauses.length > 0) {
    return inMemoryClauses;
  }
  return DEFAULT_CONTRACT_CLAUSES;
}

export function saveContractClauses(clauses: ContractClause[]): boolean {
  inMemoryClauses = clauses;
  return safeLocalStorageSet(STORAGE_KEY, JSON.stringify(clauses));
}

export function resetContractClauses(): ContractClause[] {
  inMemoryClauses = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Erro ao resetar cláusulas:', e);
  }
  return DEFAULT_CONTRACT_CLAUSES;
}

export interface ContractVariableMeta {
  key: string;
  label: string;
  example: string;
}

export const CONTRACT_VARIABLES: ContractVariableMeta[] = [
  { key: 'LOCADOR_NOME', label: 'Nome do Locador', example: 'Cláudio Oliveira da Silva' },
  { key: 'LOCADOR_CPF', label: 'CPF do Locador', example: '065.426.576-30' },
  { key: 'LOCADOR_RG', label: 'RG do Locador', example: '39.508.321-7' },
  { key: 'LOCADOR_ENDERECO', label: 'Endereço do Locador', example: 'Rua Manuel Leiroz, 230, apto 1306 - Cangaíba, São Paulo/SP, CEP 03735-180' },
  { key: 'LOCATARIO_NOME', label: 'Nome do Motorista/Locatário', example: 'Carlos Eduardo Silva' },
  { key: 'LOCATARIO_CPF', label: 'CPF do Motorista', example: '341.892.108-44' },
  { key: 'LOCATARIO_RG', label: 'RG do Motorista', example: '44.123.456-7' },
  { key: 'LOCATARIO_CNH', label: 'CNH do Motorista', example: '08912347101' },
  { key: 'LOCATARIO_ENDERECO', label: 'Endereço do Motorista', example: 'Av. Paulista, 1000 - São Paulo/SP' },
  { key: 'LOCATARIO_FONE', label: 'Telefone do Motorista', example: '(11) 98765-4321' },
  { key: 'MARCA_MODELO', label: 'Marca / Modelo do Carro', example: 'Chevrolet Onix Plus' },
  { key: 'ANO_MODELO', label: 'Ano de Fabricação / Modelo', example: '2022/2023' },
  { key: 'PLACA', label: 'Placa do Veículo', example: 'TDD-5I76' },
  { key: 'COR', label: 'Cor do Veículo', example: 'Branco' },
  { key: 'KM_INICIAL', label: 'Quilometragem Inicial', example: '18.601' },
  { key: 'VALOR_SEMANAL', label: 'Valor do Aluguel Semanal', example: '960,00' },
  { key: 'VALOR_SEMANAL_EXTENSO', label: 'Aluguel Semanal por Extenso', example: 'novecentos e sessenta reais' },
  { key: 'VALOR_CAUCAO', label: 'Valor da Caução', example: '1.000,00' },
  { key: 'VALOR_CAUCAO_EXTENSO', label: 'Caução por Extenso', example: 'mil reais' },
  { key: 'DATA_INICIO', label: 'Data de Início da Locação', example: '01/11/2026' },
  { key: 'DIA_VENCIMENTO', label: 'Dia do Vencimento Semanal', example: 'toda segunda-feira até às 23h59' },
  { key: 'CHAVE_PIX', label: 'Chave Pix para Pagamento', example: '11953292570' },
  { key: 'TAXA_MULTA', label: 'Percentual de Multa por Atraso', example: '10' },
  { key: 'TAXA_MULTA_EXTENSO', label: 'Multa por Extenso', example: 'dez por cento' },
  { key: 'TAXA_JUROS', label: 'Taxa de Juros Moratórios ao Mês', example: '1' },
  { key: 'LIMITE_KM', label: 'Limite Mensal de KM', example: '5.000 km' },
  { key: 'OFICINA_NOME', label: 'Oficina Credenciada', example: 'Oficina Central GKD' },
  { key: 'SEGURADORA_NOME', label: 'Nome da Seguradora', example: 'Loovi Seguros' },
  { key: 'SEGURADORA_FONES', label: 'Telefones da Seguradora', example: '0800 591 0422 / WhatsApp 0800 000 0000' },
  { key: 'DATA_ATUAL', label: 'Data Atual Formatada', example: '11 de novembro de 2026' }
];

export interface ContractTopicGroup {
  topic: string;
  clauses: ContractClause[];
}

export function groupClausesByTopic(clauses: ContractClause[]): ContractTopicGroup[] {
  const map = new Map<string, ContractClause[]>();
  clauses.forEach((c) => {
    const topic = (c.section || 'DISPOSIÇÕES GERAIS').trim();
    if (!map.has(topic)) map.set(topic, []);
    map.get(topic)!.push(c);
  });

  const groups: ContractTopicGroup[] = Array.from(map.entries()).map(([topic, items]) => ({
    topic,
    clauses: items
  }));

  const getTopicOrder = (topic: string): number => {
    const upper = topic.toUpperCase();
    const numMatch = topic.match(/^(\d+)\./);
    if (numMatch) {
      const n = Number(numMatch[1]);
      if (upper.includes('DO FORO')) return 10000 + n;
      return n;
    }
    if (upper.includes('DO FORO')) return 10000;
    return 9000;
  };

  groups.sort((a, b) => getTopicOrder(a.topic) - getTopicOrder(b.topic));
  return groups;
}

export function sortClausesByTopic(clauses: ContractClause[]): ContractClause[] {
  return groupClausesByTopic(clauses).flatMap((g) => g.clauses);
}

export function buildDefaultFullContractText(clauses: ContractClause[] = DEFAULT_CONTRACT_CLAUSES): string {
  const topicGroups = groupClausesByTopic(clauses);

  let full = `CONTRATO DE LOCAÇÃO DE VEÍCULO AUTOMOTOR PARA TRANSPORTE PRIVADO DE PASSAGEIROS POR APLICATIVO

1. DAS PARTES
* LOCADOR: {LOCADOR_NOME}, portador do CPF nº {LOCADOR_CPF} e RG nº {LOCADOR_RG}, residente e domiciliado à {LOCADOR_ENDERECO}.
* LOCATÁRIO: {LOCATARIO_NOME}, portador(a) da CNH nº {LOCATARIO_CNH} com EAR (atividade remunerada), CPF nº {LOCATARIO_CPF}, RG nº {LOCATARIO_RG}, residente e domiciliado(a) à {LOCATARIO_ENDERECO}. Telefone: {LOCATARIO_FONE}.

As partes acima qualificadas têm, entre si, justo e acordado o presente Contrato de Locação de Veículo Automotor, que se regerá pelas seguintes cláusulas e condições:\n`;

  let hasForoSection = false;
  for (const { topic, clauses: secClauses } of topicGroups) {
    const upperTitle = topic.toUpperCase();
    if (upperTitle.includes('DO FORO')) {
      hasForoSection = true;
    }
    full += `\n${upperTitle}\n`;

    secClauses.forEach((c) => {
      full += `* ${c.clauseLabel}${c.title ? ` (${c.title})` : ''}: ${c.text}\n`;
    });
  }

  if (!hasForoSection) {
    full += `\n13. DO FORO E DISPOSIÇÕES FINAIS\n`;
  } else {
    full += `\n`;
  }
  full += `E por estarem assim justas e contratadas, as partes assinam o presente instrumento em 02 (duas) vias de igual teor e forma para um só efeito legal.\n\n`;
  full += `São Paulo/SP, {DATA_ATUAL}.\n\n\n`;
  full += `_______________________________________\n{LOCADOR_NOME}\n(Locador)\n\n`;
  full += `_______________________________________\n{LOCATARIO_NOME}\n(Locatário)\n`;

  return full;
}

export function getFullContractTextTemplate(): string | null {
  try {
    const stored = localStorage.getItem(FULL_TEXT_STORAGE_KEY);
    if (stored !== null) {
      inMemoryFullText = stored;
      return stored;
    }
  } catch (e) {
    console.warn('Erro ao ler texto completo do contrato:', e);
  }
  if (inMemoryFullText !== undefined) {
    return inMemoryFullText;
  }
  return null;
}

export function saveFullContractTextTemplate(text: string | null): boolean {
  if (text === null || text.trim() === '') {
    inMemoryFullText = null;
    try {
      localStorage.removeItem(FULL_TEXT_STORAGE_KEY);
      return true;
    } catch (e) {
      console.warn('Erro ao remover texto completo do contrato:', e);
      return false;
    }
  }
  inMemoryFullText = text;
  return safeLocalStorageSet(FULL_TEXT_STORAGE_KEY, text);
}

export function resetFullContractTextTemplate(): void {
  inMemoryFullText = null;
  try {
    localStorage.removeItem(FULL_TEXT_STORAGE_KEY);
  } catch (e) {
    console.warn('Erro ao resetar texto completo do contrato:', e);
  }
}

export function parseFullTextToClauses(
  fullText: string,
  existingClauses: ContractClause[] = DEFAULT_CONTRACT_CLAUSES
): ContractClause[] {
  if (!fullText || !fullText.trim()) return existingClauses;

  const lines = fullText.split(/\r?\n/);
  const hasPartiesHeader = /1\.\s*DAS\s+PARTES/i.test(fullText);
  let inPartiesPreamble = hasPartiesHeader;
  let currentSection = '';
  const parsed: ContractClause[] = [];

  const pool = [...existingClauses, ...DEFAULT_CONTRACT_CLAUSES];
  const usedIds = new Set<string>();

  const findMatchedMeta = (section: string, label: string, title: string): ContractClause | undefined => {
    const normLabel = label.trim().toLowerCase();
    const normTitle = title.trim().toLowerCase();
    const normSec = section.trim().toLowerCase();

    const exact = pool.find(
      (c) =>
        !usedIds.has(c.id) &&
        c.clauseLabel.trim().toLowerCase() === normLabel &&
        c.title.trim().toLowerCase() === normTitle
    );
    if (exact) return exact;

    const byLabelAndSec = pool.find(
      (c) =>
        !usedIds.has(c.id) &&
        c.clauseLabel.trim().toLowerCase() === normLabel &&
        c.section.trim().toLowerCase() === normSec
    );
    if (byLabelAndSec) return byLabelAndSec;

    const byLabel = pool.find(
      (c) => !usedIds.has(c.id) && c.clauseLabel.trim().toLowerCase() === normLabel
    );
    return byLabel;
  };

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    if (
      /^E\s+por\s+estarem\s+assim\s+justas/i.test(trimmed) ||
      /^São\s+Paulo\/SP,/i.test(trimmed) ||
      /^_{5,}/.test(trimmed)
    ) {
      break;
    }

    if (
      trimmed.startsWith('CONTRATO DE LOCAÇÃO') ||
      trimmed.startsWith('TRANSPORTE PRIVADO DE PASSAGEIROS') ||
      trimmed === 'APLICATIVO' ||
      /^-{3,}$/.test(trimmed) ||
      /^={3,}$/.test(trimmed)
    ) {
      continue;
    }

    if (/^1\.\s*DAS\s+PARTES$/i.test(trimmed)) {
      inPartiesPreamble = true;
      continue;
    }

    const isSectionHeader =
      !trimmed.startsWith('*') &&
      !trimmed.startsWith('•') &&
      (/^\d+\.\s+[^\n:]{2,90}$/.test(trimmed) ||
        (/^[A-ZÀ-Ÿ0-9\s/()\-]{4,80}$/.test(trimmed) && !trimmed.includes(':')));

    if (isSectionHeader) {
      inPartiesPreamble = false;
      currentSection = trimmed;
      continue;
    }

    if (inPartiesPreamble) {
      continue;
    }

    if (trimmed.startsWith('*') || /^Cláusula\s+\d+/i.test(trimmed) || /^•\s*Parágrafo/i.test(trimmed)) {
      const content = trimmed.replace(/^\*\s*/, '').trim();
      const colonIdx = content.indexOf(':');
      let clauseLabel = '';
      let title = '';
      let text = '';

      if (colonIdx > 0 && colonIdx < 120) {
        const prefix = content.slice(0, colonIdx).trim();
        text = content.slice(colonIdx + 1).trim();
        const parenMatch = prefix.match(/^(.+?)\s*\(([^()]+)\)$/);
        if (parenMatch) {
          clauseLabel = parenMatch[1].trim();
          title = parenMatch[2].trim();
        } else {
          clauseLabel = prefix;
        }
      } else {
        clauseLabel = `Cláusula ${parsed.length + 1}ª`;
        text = content;
      }

      const sec = currentSection || 'DISPOSIÇÕES GERAIS';
      const matched = findMatchedMeta(sec, clauseLabel, title);
      const id = matched?.id || `parsed_clause_${parsed.length + 1}_${Date.now()}`;
      usedIds.add(id);

      parsed.push({
        id,
        section: sec,
        clauseLabel,
        title: title || matched?.title || '',
        text,
        isCustom: matched ? matched.isCustom : !DEFAULT_CONTRACT_CLAUSES.some((d) => d.id === id)
      });
    } else if (parsed.length > 0) {
      // Continuation line of the previous clause
      parsed[parsed.length - 1].text = `${parsed[parsed.length - 1].text} ${trimmed}`.trim();
    }
  }

  return parsed.length > 0 ? parsed : existingClauses;
}

export function rebuildFullTextWithClauses(
  clauses: ContractClause[],
  referenceFullText?: string | null
): string {
  const defaultGenerated = buildDefaultFullContractText(clauses);
  if (!referenceFullText || !referenceFullText.trim()) {
    return defaultGenerated;
  }

  const normalizedRef = referenceFullText.trim();
  // Locate the first body section header (e.g., "\n2. DO OBJETO") and closing signature anchor
  const bodyStartMatch = normalizedRef.match(/\n(?=\d+\.\s+(?!DAS\s+PARTES\b)[A-ZÀ-Ÿ])/);
  const closingMatch = normalizedRef.match(/\n(?=E\s+por\s+estarem\s+assim\s+justas|São\s+Paulo\/SP,|_____)/i);

  if (!bodyStartMatch || bodyStartMatch.index === undefined) {
    return defaultGenerated;
  }

  const customPreamble = normalizedRef.slice(0, bodyStartMatch.index).trimEnd();
  const customClosing =
    closingMatch && closingMatch.index !== undefined
      ? normalizedRef.slice(closingMatch.index).trimStart()
      : `E por estarem assim justas e contratadas, as partes assinam o presente instrumento em 02 (duas) vias de igual teor e forma para um só efeito legal.\n\nSão Paulo/SP, {DATA_ATUAL}.\n\n\n_______________________________________\n{LOCADOR_NOME}\n(Locador)\n\n_______________________________________\n{LOCATARIO_NOME}\n(Locatário)\n`;

  const topicGroups = groupClausesByTopic(clauses);

  let sectionsText = '';
  for (const { topic, clauses: secClauses } of topicGroups) {
    sectionsText += `\n${topic.toUpperCase()}\n`;
    secClauses.forEach((c) => {
      sectionsText += `* ${c.clauseLabel}${c.title ? ` (${c.title})` : ''}: ${c.text}\n`;
    });
  }

  return `${customPreamble}\n${sectionsText}\n${customClosing}`;
}

export function replaceClauseVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(pattern, value || '');
  }
  return result.replace(/[ \t]+\./g, '.');
}
