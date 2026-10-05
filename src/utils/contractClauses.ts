export interface ContractClause {
  id: string;
  sectionNumber: number;
  sectionTitle: string;
  clauseLabel: string;
  title: string;
  text: string;
  defaultText: string;
  isCustom?: boolean;
}

export const DEFAULT_CONTRACT_CLAUSES: ContractClause[] = [
  {
    id: 'clausula_1_objeto',
    sectionNumber: 2,
    sectionTitle: '2. DO OBJETO',
    clauseLabel: 'Cláusula 1ª',
    title: 'Objeto da Locação e Condições do Veículo',
    text: 'O objeto deste contrato é a locação do veículo de propriedade do LOCADOR, com as seguintes características: Marca/Modelo: {MARCA_MODELO} | Ano/Modelo: {ANO_MODELO} | Placa: {PLACA} | Cor: {COR}. O veículo é entregue com tanque cheio (álcool/gasolina) e quilometragem inicial de {KM_INICIAL} km.',
    defaultText: 'O objeto deste contrato é a locação do veículo de propriedade do LOCADOR, com as seguintes características: Marca/Modelo: {MARCA_MODELO} | Ano/Modelo: {ANO_MODELO} | Placa: {PLACA} | Cor: {COR}. O veículo é entregue com tanque cheio (álcool/gasolina) e quilometragem inicial de {KM_INICIAL} km.'
  },
  {
    id: 'clausula_2_finalidade',
    sectionNumber: 3,
    sectionTitle: '3. DA FINALIDADE EXCLUSIVA',
    clauseLabel: 'Cláusula 2ª',
    title: 'Destinação do Veículo (Transporte por Aplicativo)',
    text: 'O veículo destina-se exclusivamente à prestação de serviços de transporte privado de passageiros por meio de aplicativos regulamentados (ex.: Uber, 99, InDrive).',
    defaultText: 'O veículo destina-se exclusivamente à prestação de serviços de transporte privado de passageiros por meio de aplicativos regulamentados (ex.: Uber, 99, InDrive).'
  },
  {
    id: 'clausula_2_paragrafo',
    sectionNumber: 3,
    sectionTitle: '3. DA FINALIDADE EXCLUSIVA',
    clauseLabel: '• Parágrafo Único',
    title: 'Proibição de Sublocação e Empréstimo',
    text: 'É expressamente proibida a sublocação, o empréstimo ou a cessão a terceiros (mesmo que parentes), sob pena de rescisão imediata e retomada do veículo.',
    defaultText: 'É expressamente proibida a sublocação, o empréstimo ou a cessão a terceiros (mesmo que parentes), sob pena de rescisão imediata e retomada do veículo.'
  },
  {
    id: 'clausula_3_prazo',
    sectionNumber: 4,
    sectionTitle: '4. DO PRAZO E RENOVAÇÃO',
    clauseLabel: 'Cláusula 3ª',
    title: 'Vigência Inicial e Renovação Automática',
    text: 'A vigência tem início em {DATA_INICIO}, com duração inicial de 30 (trinta) dias, renovável automaticamente a cada 7 (sete) dias, por prazo indeterminado.',
    defaultText: 'A vigência tem início em {DATA_INICIO}, com duração inicial de 30 (trinta) dias, renovável automaticamente a cada 7 (sete) dias, por prazo indeterminado.'
  },
  {
    id: 'clausula_4_rescisao',
    sectionNumber: 4,
    sectionTitle: '4. DO PRAZO E RENOVAÇÃO',
    clauseLabel: 'Cláusula 4ª',
    title: 'Aviso Prévio de Rescisão',
    text: 'A rescisão por qualquer das partes exige aviso prévio por escrito com antecedência mínima de 48 (quarenta e oito) horas, ressalvadas as hipóteses de retomada imediata previstas neste instrumento.',
    defaultText: 'A rescisão por qualquer das partes exige aviso prévio por escrito com antecedência mínima de 48 (quarenta e oito) horas, ressalvadas as hipóteses de retomada imediata previstas neste instrumento.'
  },
  {
    id: 'clausula_5_valores',
    sectionNumber: 5,
    sectionTitle: '5. DOS VALORES, PAGAMENTO E CAUÇÃO',
    clauseLabel: 'Cláusula 5ª',
    title: 'Aluguel Semanal, Vencimento e Meio de Pagamento (PIX)',
    text: 'O aluguel semanal é de R$ {VALOR_SEMANAL} ({VALOR_SEMANAL_EXTENSO}). A primeira semana é paga no prazo de 7 (sete) dias corridos a contar da retirada do veículo, e os pagamentos subsequentes ocorrem {DIA_VENCIMENTO}, via PIX para a chave (telefone) {CHAVE_PIX}.',
    defaultText: 'O aluguel semanal é de R$ {VALOR_SEMANAL} ({VALOR_SEMANAL_EXTENSO}). A primeira semana é paga no prazo de 7 (sete) dias corridos a contar da retirada do veículo, e os pagamentos subsequentes ocorrem {DIA_VENCIMENTO}, via PIX para a chave (telefone) {CHAVE_PIX}.'
  },
  {
    id: 'clausula_6_mora',
    sectionNumber: 5,
    sectionTitle: '5. DOS VALORES, PAGAMENTO E CAUÇÃO',
    clauseLabel: 'Cláusula 6ª (Multa, Juros e Bloqueio por Atraso)',
    title: 'Mora Automática, Multa de 10%, Juros 1% ao Mês e Bloqueio Remoto',
    text: 'O não pagamento do aluguel ou dos valores acessórios até às 23h59 da data de vencimento constitui o LOCATÁRIO em mora automática, gerando multa fixa de {TAXA_MULTA}% ({TAXA_MULTA_EXTENSO}) sobre o valor da semana vencida, acrescida de juros moratórios de {TAXA_JUROS}% ao mês (pro rata die) logo a partir do 1º (primeiro) dia de atraso. Caso o pagamento não seja regularizado, o LOCADOR notificará o LOCATÁRIO, via aplicativo, SMS ou WhatsApp, para que estacione o veículo em local seguro, realizando o bloqueio remoto do veículo, sem prejuízo de outras sanções legais.',
    defaultText: 'O não pagamento do aluguel ou dos valores acessórios até às 23h59 da data de vencimento constitui o LOCATÁRIO em mora automática, gerando multa fixa de {TAXA_MULTA}% ({TAXA_MULTA_EXTENSO}) sobre o valor da semana vencida, acrescida de juros moratórios de {TAXA_JUROS}% ao mês (pro rata die) logo a partir do 1º (primeiro) dia de atraso. Caso o pagamento não seja regularizado, o LOCADOR notificará o LOCATÁRIO, via aplicativo, SMS ou WhatsApp, para que estacione o veículo em local seguro, realizando o bloqueio remoto do veículo, sem prejuízo de outras sanções legais.'
  },
  {
    id: 'clausula_7_caucao',
    sectionNumber: 5,
    sectionTitle: '5. DOS VALORES, PAGAMENTO E CAUÇÃO',
    clauseLabel: 'Cláusula 7ª (Caução)',
    title: 'Valor da Caução à Vista e Devolução em até 30 Dias',
    text: 'O LOCATÁRIO pagará R$ {VALOR_CAUCAO} ({VALOR_CAUCAO_EXTENSO}) a título de caução à vista, no ato da retirada do veículo. O valor da caução não pode, em hipótese alguma, ser utilizado para abatimento ou pagamento de aluguel semanal, sendo restituído integralmente em até 30 (trinta) dias após a devolução do veículo, desde que inexistam danos, multas ou pendências financeiras.',
    defaultText: 'O LOCATÁRIO pagará R$ {VALOR_CAUCAO} ({VALOR_CAUCAO_EXTENSO}) a título de caução à vista, no ato da retirada do veículo. O valor da caução não pode, em hipótese alguma, ser utilizado para abatimento ou pagamento de aluguel semanal, sendo restituído integralmente em até 30 (trinta) dias após a devolução do veículo, desde que inexistam danos, multas ou pendências financeiras.'
  },
  {
    id: 'clausula_8_semparar',
    sectionNumber: 5,
    sectionTitle: '5. DOS VALORES, PAGAMENTO E CAUÇÃO',
    clauseLabel: 'Cláusula 8ª (Sem Parar)',
    title: 'Reembolso do Sistema de Pedágio / Sem Parar',
    text: 'O LOCADOR será reembolsado integralmente pelo LOCATÁRIO na primeira semana de cada mês, mediante a apresentação de extrato detalhado de utilização do sistema de pedágio/estacionamento automático.',
    defaultText: 'O LOCADOR será reembolsado integralmente pelo LOCATÁRIO na primeira semana de cada mês, mediante a apresentação de extrato detalhado de utilização do sistema de pedágio/estacionamento automático.'
  },
  {
    id: 'clausula_9_multas',
    sectionNumber: 6,
    sectionTitle: '6. DAS MULTAS DE TRÂNSITO',
    clauseLabel: 'Cláusula 9ª',
    title: 'Responsabilidade pelas Infrações e Multas',
    text: 'O LOCATÁRIO é o único responsável pelas multas de trânsito cometidas durante a vigência do contrato, contadas desde a retirada até a efetiva devolução do veículo, ainda que a notificação seja emitida ou entregue após a restituição do automóvel ou da caução. Infrações cometidas após a devolução formal do veículo não são de responsabilidade do LOCATÁRIO.',
    defaultText: 'O LOCATÁRIO é o único responsável pelas multas de trânsito cometidas durante a vigência do contrato, contadas desde a retirada até a efetiva devolução do veículo, ainda que a notificação seja emitida ou entregue após a restituição do automóvel ou da caução. Infrações cometidas após a devolução formal do veículo não são de responsabilidade do LOCATÁRIO.'
  },
  {
    id: 'clausula_9_paragrafo_1',
    sectionNumber: 6,
    sectionTitle: '6. DAS MULTAS DE TRÂNSITO',
    clauseLabel: '• Parágrafo Primeiro',
    title: 'Cobrança da Multa 15 Dias Após Notificação',
    text: 'O valor das multas de trânsito será cobrado junto ao aluguel semanal 15 dias após a notificação, integrando o montante devido para todos os efeitos, inclusive incidência de mora, multa e bloqueio previstos na Cláusula 6ª.',
    defaultText: 'O valor das multas de trânsito será cobrado junto ao aluguel semanal 15 dias após a notificação, integrando o montante devido para todos os efeitos, inclusive incidência de mora, multa e bloqueio previstos na Cláusula 6ª.'
  },
  {
    id: 'clausula_9_paragrafo_2',
    sectionNumber: 6,
    sectionTitle: '6. DAS MULTAS DE TRÂNSITO',
    clauseLabel: '• Parágrafo Segundo',
    title: 'Multas Notificadas Após a Devolução do Carro',
    text: 'Multas de infrações cometidas durante a vigência do contrato, mas notificadas após a devolução do veículo, deverão ser pagas em até 15 (quinze) dias corridos a contar da notificação, sob pena de execução e cobrança judicial. A data e o horário da infração registrados no órgão competente definem a responsabilidade temporal.',
    defaultText: 'Multas de infrações cometidas durante a vigência do contrato, mas notificadas após a devolução do veículo, deverão ser pagas em até 15 (quinze) dias corridos a contar da notificação, sob pena de execução e cobrança judicial. A data e o horário da infração registrados no órgão competente definem a responsabilidade temporal.'
  },
  {
    id: 'clausula_10_manutencao',
    sectionNumber: 7,
    sectionTitle: '7. DA MANUTENÇÃO, USO E SEGURANÇA',
    clauseLabel: 'Cláusula 10ª',
    title: 'Limite Mensal de KM e Manutenções Preventivas',
    text: 'O veículo possui limite de quilometragem de {LIMITE_KM} rodados por mês. Caso este limite seja ultrapassado e torne-se necessário antecipar a revisão, os custos da manutenção preventiva antecipada serão rateados em 50/50 entre LOCADOR e LOCATÁRIO. A manutenção preventiva regular ocorre a cada 7.000 km rodados{OFICINA_NOME}.',
    defaultText: 'O veículo possui limite de quilometragem de {LIMITE_KM} rodados por mês. Caso este limite seja ultrapassado e torne-se necessário antecipar a revisão, os custos da manutenção preventiva antecipada serão rateados em 50/50 entre LOCADOR e LOCATÁRIO. A manutenção preventiva regular ocorre a cada 7.000 km rodados{OFICINA_NOME}.'
  },
  {
    id: 'clausula_10_paragrafo',
    sectionNumber: 7,
    sectionTitle: '7. DA MANUTENÇÃO, USO E SEGURANÇA',
    clauseLabel: '• Parágrafo Único',
    title: 'Rateio de Óleo, Filtros, Desgaste e Mau Uso',
    text: 'Despesas com troca de óleo e filtros correm por conta do LOCADOR; o desgaste natural de peças de uso periódico é dividido igualmente (50/50); e eventuais danos decorrentes de mau uso, imperícia ou negligência são de responsabilidade integral do LOCATÁRIO.',
    defaultText: 'Despesas com troca de óleo e filtros correm por conta do LOCADOR; o desgaste natural de peças de uso periódico é dividido igualmente (50/50); e eventuais danos decorrentes de mau uso, imperícia ou negligência são de responsabilidade integral do LOCATÁRIO.'
  },
  {
    id: 'clausula_11_seguranca',
    sectionNumber: 7,
    sectionTitle: '7. DA MANUTENÇÃO, USO E SEGURANÇA',
    clauseLabel: 'Cláusula 11ª',
    title: 'Proibição de Fumar e Violação de Câmeras/Rastreador',
    text: 'É expressamente proibido fumar no interior do veículo. O veículo é equipado com rastreador e câmeras internas/externas, sendo proibida qualquer tentativa de obstrução, violação ou desligamento desses dispositivos.',
    defaultText: 'É expressamente proibido fumar no interior do veículo. O veículo é equipado com rastreador e câmeras internas/externas, sendo proibida qualquer tentativa de obstrução, violação ou desligamento desses dispositivos.'
  },
  {
    id: 'clausula_12_combustivel',
    sectionNumber: 7,
    sectionTitle: '7. DA MANUTENÇÃO, USO E SEGURANÇA',
    clauseLabel: 'Cláusula 12ª',
    title: 'Luz de Injeção e Combustível Adulterado',
    text: 'Caso a luz de injeção acenda por suspeita de abastecimento com combustível de baixa qualidade, o LOCATÁRIO obriga-se a realizar a troca imediata do combustível para a devida verificação e solução do problema.',
    defaultText: 'Caso a luz de injeção acenda por suspeita de abastecimento com combustível de baixa qualidade, o LOCATÁRIO obriga-se a realizar a troca imediata do combustível para a devida verificação e solução do problema.'
  },
  {
    id: 'clausula_13_bloqueio',
    sectionNumber: 7,
    sectionTitle: '7. DA MANUTENÇÃO, USO E SEGURANÇA',
    clauseLabel: 'Cláusula 13ª (Bloqueio Remoto e Retomada Imediata)',
    title: 'Hipóteses de Bloqueio Remoto e Rescisão',
    text: 'O LOCADOR poderá realizar o bloqueio remoto do veículo e declarar o contrato rescindido com retomada imediata, sem aviso prévio, nas seguintes hipóteses: (i) inadimplência superior a 2 (dois) dias; (ii) uso indevido, sublocação ou condução por terceiros não autorizados; (iii) abandono do veículo; ou (iv) descumprimento de qualquer cláusula deste instrumento. O bloqueio remoto não desobriga o LOCATÁRIO do pagamento dos valores devidos da locação.',
    defaultText: 'O LOCADOR poderá realizar o bloqueio remoto do veículo e declarar o contrato rescindido com retomada imediata, sem aviso prévio, nas seguintes hipóteses: (i) inadimplência superior a 2 (dois) dias; (ii) uso indevido, sublocação ou condução por terceiros não autorizados; (iii) abandono do veículo; ou (iv) descumprimento de qualquer cláusula deste instrumento. O bloqueio remoto não desobriga o LOCATÁRIO do pagamento dos valores devidos da locação.'
  },
  {
    id: 'clausula_13_paragrafo',
    sectionNumber: 7,
    sectionTitle: '7. DA MANUTENÇÃO, USO E SEGURANÇA',
    clauseLabel: '• Parágrafo Único',
    title: 'Crime de Apropriação Indébita (Art. 168 do CP)',
    text: 'A recusa injustificada em restituir o veículo ao LOCADOR após a rescisão ou notificação de retomada configurará crime de Apropriação Indébita (art. 168 do Código Penal), autorizando o acionamento imediato das autoridades policiais e medidas judiciais de busca e apreensão.',
    defaultText: 'A recusa injustificada em restituir o veículo ao LOCADOR após a rescisão ou notificação de retomada configurará crime de Apropriação Indébita (art. 168 do Código Penal), autorizando o acionamento imediato das autoridades policiais e medidas judiciais de busca e apreensão.'
  },
  {
    id: 'clausula_14_modificacoes',
    sectionNumber: 7,
    sectionTitle: '7. DA MANUTENÇÃO, USO E SEGURANÇA',
    clauseLabel: 'Cláusula 14ª (Modificações e Documentos)',
    title: 'Proibição de Alterações e Guarda do CRLV',
    text: 'É proibido modificar, adesivar, plotar, remover peças ou instalar equipamentos no veículo sem autorização prévia e por escrito do LOCADOR. O LOCATÁRIO deverá portar e manter o CRLV (físico ou digital) válido e acessível durante a condução, devolvendo-o incontinenti ao término do contrato e abstendo-se de entregá-lo a terceiros.',
    defaultText: 'É proibido modificar, adesivar, plotar, remover peças ou instalar equipamentos no veículo sem autorização prévia e por escrito do LOCADOR. O LOCATÁRIO deverá portar e manter o CRLV (físico ou digital) válido e acessível durante a condução, devolvendo-o incontinenti ao término do contrato e abstendo-se de entregá-lo a terceiros.'
  },
  {
    id: 'clausula_15_avarias',
    sectionNumber: 8,
    sectionTitle: '8. DA DEVOLUÇÃO E AVARIAS',
    clauseLabel: 'Cláusula 15ª',
    title: 'Reparo de Avarias por Mau Uso e Carro Parado',
    text: 'Em caso de avarias decorrentes de mau uso que exijam reparo em oficina, o LOCATÁRIO arcará com o valor integral do conserto em até 20 (vinte) dias corridos da ocorrência, restando expressamente estabelecido que a obrigatoriedade do pagamento do aluguel com o carro parado continua sendo do LOCATÁRIO.',
    defaultText: 'Em caso de avarias decorrentes de mau uso que exijam reparo em oficina, o LOCATÁRIO arcará com o valor integral do conserto em até 20 (vinte) dias corridos da ocorrência, restando expressamente estabelecido que a obrigatoriedade do pagamento do aluguel com o carro parado continua sendo do LOCATÁRIO.'
  },
  {
    id: 'clausula_16_termos_devolucao',
    sectionNumber: 8,
    sectionTitle: '8. DA DEVOLUÇÃO E AVARIAS',
    clauseLabel: 'Cláusula 16ª (Termos de Devolução)',
    title: 'Limpeza, Tanque e Fotos Comparativas',
    text: 'O veículo deverá ser devolvido limpo, com o tanque de combustível no mesmo nível da retirada e acompanhado das fotos/vídeos comparativos de vistoria.',
    defaultText: 'O veículo deverá ser devolvido limpo, com o tanque de combustível no mesmo nível da retirada e acompanhado das fotos/vídeos comparativos de vistoria.'
  },
  {
    id: 'clausula_16_paragrafo_1',
    sectionNumber: 8,
    sectionTitle: '8. DA DEVOLUÇÃO E AVARIAS',
    clauseLabel: '• Parágrafo Primeiro',
    title: 'Combustível Faltante e Taxa de Higienização de R$ 150,00',
    text: 'Caso o veículo seja devolvido com combustível abaixo do nível da retirada, o LOCATÁRIO reembolsará o valor correspondente. Se for devolvido em condições de sujeira excessiva que exijam higienização profissional, será cobrada a taxa correspondente de R$ 150,00 (ou o valor equivalente à higienização).',
    defaultText: 'Caso o veículo seja devolvido com combustível abaixo do nível da retirada, o LOCATÁRIO reembolsará o valor correspondente. Se for devolvido em condições de sujeira excessiva que exijam higienização profissional, será cobrada a taxa correspondente de R$ 150,00 (ou o valor equivalente à higienização).'
  },
  {
    id: 'clausula_16_paragrafo_2',
    sectionNumber: 8,
    sectionTitle: '8. DA DEVOLUÇÃO E AVARIAS',
    clauseLabel: '• Parágrafo Segundo',
    title: 'Atraso na Devolução e Diária Proporcional de 1/7',
    text: 'A devolução realizada após o horário combinado implicará a cobrança de diária proporcional de 1/7 do valor do aluguel semanal por dia de atraso, sem prejuízo das penalidades por quebra contratual.',
    defaultText: 'A devolução realizada após o horário combinado implicará a cobrança de diária proporcional de 1/7 do valor do aluguel semanal por dia de atraso, sem prejuízo das penalidades por quebra contratual.'
  },
  {
    id: 'clausula_17_vistoria',
    sectionNumber: 9,
    sectionTitle: '9. DA VISTORIA E MONITORAMENTO (LGPD)',
    clauseLabel: 'Cláusula 17ª',
    title: 'Vistoria Obrigatória de Retirada/Devolução e Semanal',
    text: 'É obrigatório o registro fotográfico e em vídeo do painel, pneus e lataria no momento da retirada e da devolução. O LOCATÁRIO obriga-se, ainda, a enviar a vistoria semanal por aplicativo ou WhatsApp em dia e horário previamente ajustados com o LOCADOR.',
    defaultText: 'É obrigatório o registro fotográfico e em vídeo do painel, pneus e lataria no momento da retirada e da devolução. O LOCATÁRIO obriga-se, ainda, a enviar a vistoria semanal por aplicativo ou WhatsApp em dia e horário previamente ajustados com o LOCADOR.'
  },
  {
    id: 'clausula_18_lgpd',
    sectionNumber: 9,
    sectionTitle: '9. DA VISTORIA E MONITORAMENTO (LGPD)',
    clauseLabel: 'Cláusula 18ª (Privacidade e LGPD)',
    title: 'Consentimento de Monitoramento por Câmeras, Rastreador e Áudio',
    text: 'O LOCATÁRIO autoriza expressamente o monitoramento do veículo por meio de rastreador e câmeras, abrangendo localização em tempo real, rotas, velocidades, imagens e áudio interno, para fins estritos de segurança, gestão de frota, prevenção de fraudes e defesa jurídica em eventuais litígios, em total conformidade com a Lei nº 13.709/2018 (LGPD).',
    defaultText: 'O LOCATÁRIO autoriza expressamente o monitoramento do veículo por meio de rastreador e câmeras, abrangendo localização em tempo real, rotas, velocidades, imagens e áudio interno, para fins estritos de segurança, gestão de frota, prevenção de fraudes e defesa jurídica em eventuais litígios, em total conformidade com a Lei nº 13.709/2018 (LGPD).'
  },
  {
    id: 'clausula_19_sinistros',
    sectionNumber: 10,
    sectionTitle: '10. DOS SINISTROS E TRATATIVAS COM TERCEIROS',
    clauseLabel: 'Cláusula 19ª',
    title: 'Comunicação Imediata de Sinistros e Boletim de Ocorrência',
    text: 'Em caso de acidente, colisão, furto, roubo ou qualquer sinistro envolvendo terceiros, o LOCATÁRIO deverá comunicar o LOCADOR imediatamente e registrar o respectivo Boletim de Ocorrência (B.O.).',
    defaultText: 'Em caso de acidente, colisão, furto, roubo ou qualquer sinistro envolvendo terceiros, o LOCATÁRIO deverá comunicar o LOCADOR imediatamente e registrar o respectivo Boletim de Ocorrência (B.O.).'
  },
  {
    id: 'clausula_19_paragrafo_1',
    sectionNumber: 10,
    sectionTitle: '10. DOS SINISTROS E TRATATIVAS COM TERCEIROS',
    clauseLabel: '• Parágrafo Primeiro',
    title: 'Exclusividade do Locador em Negociações',
    text: 'Qualquer negociação, acordo, tratativa ou contato com terceiros envolvidos ou com as seguradoras respectivas deverá ser conduzido e autorizado estritamente pelo LOCADOR. É vedado ao LOCATÁRIO firmar acordos ou prometer pagamentos em nome do proprietário.',
    defaultText: 'Qualquer negociação, acordo, tratativa ou contato com terceiros envolvidos ou com as seguradoras respectivas deverá ser conduzido e autorizado estritamente pelo LOCADOR. É vedado ao LOCATÁRIO firmar acordos ou prometer pagamentos em nome do proprietário.'
  },
  {
    id: 'clausula_19_paragrafo_2',
    sectionNumber: 10,
    sectionTitle: '10. DOS SINISTROS E TRATATIVAS COM TERCEIROS',
    clauseLabel: '• Parágrafo Segundo',
    title: 'Vedação do Uso de Documentos Pessoais por Terceiros',
    text: 'O CPF e os documentos pessoais do LOCATÁRIO não poderão ser utilizados por terceiros para abertura de reclamações, processos ou acionamentos de seguros, sendo tal prerrogativa exclusiva do LOCADOR.',
    defaultText: 'O CPF e os documentos pessoais do LOCATÁRIO não poderão ser utilizados por terceiros para abertura de reclamações, processos ou acionamentos de seguros, sendo tal prerrogativa exclusiva do LOCADOR.'
  },
  {
    id: 'clausula_19_paragrafo_3',
    sectionNumber: 10,
    sectionTitle: '10. DOS SINISTROS E TRATATIVAS COM TERCEIROS',
    clauseLabel: '• Parágrafo Terceiro',
    title: 'Infração Contratual Grave',
    text: 'A violação desta cláusula caracteriza infração contratual grave, ensejando rescisão imediata do contrato e responsabilização civil e criminal do LOCATÁRIO por eventuais prejuízos.',
    defaultText: 'A violação desta cláusula caracteriza infração contratual grave, ensejando rescisão imediata do contrato e responsabilização civil e criminal do LOCATÁRIO por eventuais prejuízos.'
  },
  {
    id: 'clausula_20_seguro',
    sectionNumber: 11,
    sectionTitle: '11. DO SEGURO (LOOVI SEGUROS)',
    clauseLabel: 'Cláusula 20ª',
    title: 'Apólice de Seguro e Cobertura Contratada',
    text: 'O veículo possui apólice de seguro contratada junto à Loovi Seguros ({SEGURADORA_NOME}), contemplando assistência 24 horas, cobertura para furto/roubo, colisão completa (danos próprios e a terceiros), carro reserva e proteção de vidros.',
    defaultText: 'O veículo possui apólice de seguro contratada junto à Loovi Seguros ({SEGURADORA_NOME}), contemplando assistência 24 horas, cobertura para furto/roubo, colisão completa (danos próprios e a terceiros), carro reserva e proteção de vidros.'
  },
  {
    id: 'clausula_20_paragrafo_1',
    sectionNumber: 11,
    sectionTitle: '11. DO SEGURO (LOOVI SEGUROS)',
    clauseLabel: '• Parágrafo Primeiro',
    title: 'Franquia e Despesas Acessórias pelo Locatário',
    text: 'Em caso de sinistro com necessidade de acionamento do seguro, a franquia e eventuais despesas acessórias serão de responsabilidade integral do LOCATÁRIO.',
    defaultText: 'Em caso de sinistro com necessidade de acionamento do seguro, a franquia e eventuais despesas acessórias serão de responsabilidade integral do LOCATÁRIO.'
  },
  {
    id: 'clausula_20_paragrafo_2',
    sectionNumber: 11,
    sectionTitle: '11. DO SEGURO (LOOVI SEGUROS)',
    clauseLabel: '• Parágrafo Segundo',
    title: 'Limite de 1 Acionamento de Assistência por Mês',
    text: 'É permitido apenas 01 (um) acionamento por mês para serviços de assistência 24 horas. Acionamentos adicionais correrão exclusivamente por conta do LOCATÁRIO.',
    defaultText: 'É permitido apenas 01 (um) acionamento por mês para serviços de assistência 24 horas. Acionamentos adicionais correrão exclusivamente por conta do LOCATÁRIO.'
  },
  {
    id: 'clausula_20_paragrafo_3',
    sectionNumber: 11,
    sectionTitle: '11. DO SEGURO (LOOVI SEGUROS)',
    clauseLabel: '• Parágrafo Terceiro',
    title: 'Telefones Oficiais de Emergência',
    text: 'Contatos de emergência do seguro: {SEGURADORA_FONES}.',
    defaultText: 'Contatos de emergência do seguro: {SEGURADORA_FONES}.'
  },
  {
    id: 'clausula_21_foro',
    sectionNumber: 12,
    sectionTitle: '12. DO FORO E DISPOSIÇÕES FINAIS',
    clauseLabel: 'Cláusula 21ª',
    title: 'Eleição do Foro da Comarca de São Paulo/SP',
    text: 'Para dirimir quaisquer controvérsias ou litígios oriundos do presente contrato, as partes elegem expressamente o Foro da Comarca de São Paulo/SP, renunciando a qualquer outro, por mais privilegiado que seja.',
    defaultText: 'Para dirimir quaisquer controvérsias ou litígios oriundos do presente contrato, as partes elegem expressamente o Foro da Comarca de São Paulo/SP, renunciando a qualquer outro, por mais privilegiado que seja.'
  }
];

const STORAGE_KEY = 'fleet_contract_custom_clauses';

export function getSavedContractClauses(): ContractClause[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with defaults to guarantee all IDs exist
        const map = new Map<string, ContractClause>();
        DEFAULT_CONTRACT_CLAUSES.forEach(def => map.set(def.id, { ...def }));
        parsed.forEach((item: ContractClause) => {
          if (map.has(item.id)) {
            const current = map.get(item.id)!;
            map.set(item.id, {
              ...current,
              text: item.text ?? current.defaultText,
              clauseLabel: item.clauseLabel ?? current.clauseLabel,
              title: item.title ?? current.title
            });
          } else if (item.isCustom) {
            map.set(item.id, item);
          }
        });
        return Array.from(map.values());
      }
    }
  } catch (e) {
    console.warn('Error reading saved contract clauses:', e);
  }
  return DEFAULT_CONTRACT_CLAUSES.map(c => ({ ...c }));
}

export function saveContractClauses(clauses: ContractClause[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clauses));
    window.dispatchEvent(new CustomEvent('contract-clauses-updated'));
  } catch (e) {
    console.error('Error saving contract clauses:', e);
  }
}

export function resetContractClausesToDefault(): ContractClause[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('contract-clauses-updated'));
  } catch (e) {
    console.warn('Error resetting contract clauses:', e);
  }
  return DEFAULT_CONTRACT_CLAUSES.map(c => ({ ...c }));
}

export function replaceClauseVariables(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}
