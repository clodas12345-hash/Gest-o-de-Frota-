# Regras e Diretrizes do Projeto

- **Foco Estrito no Pedido do Usuário**: Fazer apenas as alterações explicitamente solicitadas pelo usuário.
- **Proibido Adicionar Funcionalidades Unsolicited**: Não adicionar novos recursos, botões, campos ou modificações visuais não pedidas.
- **Confirmação Prévia**: Perguntar e solicitar confirmação do usuário antes de realizar alterações ou propor mudanças adicionais fora do pedido direto.

- **Vistorias e Geração de PDF**:
  - Quando gerar PDFs (ex: relatórios ou vistorias), as fotos em base64 DEVEM ser convertidas via `urlToDataUrl` (garantindo JPEG/PNG) para que o `jsPDF` as processe corretamente e elas não fiquem em branco nos documentos.
  - O PDF gerado na tela do motorista/usuário deve ter seu `dataUrl` repassado e salvo diretamente nos `documents` do veículo (para garantir que a mesma versão com fotos que foi enviada pro WhatsApp seja a que fica salva no sistema).
