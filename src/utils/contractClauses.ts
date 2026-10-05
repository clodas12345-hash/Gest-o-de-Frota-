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
    title: 'Aviso Prévio',
    text: 'A rescisão por qualquer das partes exige aviso prévio por escrito com antecedência mínima de 48 (quarenta e oito) horas, ressalvadas as hipóteses de retomada imediata previstas neste instrumento.'
  },
  {
    id: 'clausula_5_valores',
    section: '5. DOS VALORES, PAGAMENTO E CAUÇÃO',
    clauseLabel: 'Cláusula 5ª',
    title: 'Aluguel Semanal e Pagamento',
    text: 'O aluguel semanal é de R$ {VALOR_SEMANAL} ({VALOR_SEMANAL_EXTENSO}). A primeira semana é paga no prazo de 7 (sete) dias corridos a contar da retirada do veículo, e os pagamentos subsequentes ocorrem {DIA_VENCIMENTO}, via PIX para a chave (telefone) {CHAVE_PIX}.'
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
    id: 'clausula_10_manutencao',
    section: '7. DA MANUTENÇÃO, USO E SEGURANÇA',
    clauseLabel: 'Cláusula 10ª',
    title: 'Quilometragem e Manutenção Preventiva',
    text: 'O veículo possui limite de quilometragem de {LIMITE_KM} rodados por mês. Caso este limite seja ultrapassado e torne-se necessário antecipar a revisão, os custos da manutenção preventiva antecipada serão rateados em 50/50 entre LOCADOR e LOCATÁRIO. A manutenção preventiva regular ocorre a cada 7.000 km rodados{OFICINA_NOME}.'
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
    text: 'O veículo possui apólice de seguro contratada junto à Loovi Seguros ({SEGURADORA_NOME}), contemplando assistência 24 horas, cobertura para furto/roubo, colisão completa (danos próprios e a terceiros), carro reserva e proteção de vidros.'
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
  }
];

const STORAGE_KEY = 'fleet_contract_clauses_custom';

export function getSavedContractClauses(): ContractClause[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONTRACT_CLAUSES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.warn('Erro ao ler cláusulas salvas do localStorage:', e);
  }
  return DEFAULT_CONTRACT_CLAUSES;
}

export function saveContractClauses(clauses: ContractClause[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clauses));
  } catch (e) {
    console.warn('Erro ao salvar cláusulas no localStorage:', e);
  }
}

export function resetContractClauses(): ContractClause[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Erro ao resetar cláusulas:', e);
  }
  return DEFAULT_CONTRACT_CLAUSES;
}

export function replaceClauseVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(pattern, value || '');
  }
  return result;
}
