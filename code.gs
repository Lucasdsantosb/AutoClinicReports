function gerarRelatoriosPacientes() {

  // ===========================
  // CONFIGURAÇÕES DO PROJETO
  // ===========================
  // PLANILHA_ID: ID da planilha do Google Sheets que recebe as respostas do formulário
  // NOME_ABA: nome da aba onde as respostas são armazenadas
  // PASTA_ID: ID da pasta do Google Drive onde os relatórios .txt serão salvos
  const PLANILHA_ID = "COLOQUE_O_ID_DA_SUA_PLANILHA";
  const NOME_ABA = "NOME_DA_ABA";
  const PASTA_ID = "ID_DA_SUA_PASTA_DO_DRIVE";

  // ===========================
  // MODO DE TESTE
  // ===========================
  // Se GERAR_APENAS_UM_RELATORIO_TESTE = true:
  // o script gera apenas 1 relatório com base na linha informada em LINHA_DA_RESPOSTA_TESTE.
  //
  // Exemplo:
  // - true  → gera somente o relatório da linha escolhida
  // - false → processa automaticamente apenas novas respostas da planilha
  const GERAR_APENAS_UM_RELATORIO_TESTE = false;
  const LINHA_DA_RESPOSTA_TESTE = 304;

  // Abre a planilha e acessa a aba onde estão as respostas
  const planilha = SpreadsheetApp.openById(PLANILHA_ID);
  const aba = planilha.getSheetByName(NOME_ABA);

  // Obtém a última linha e a última coluna preenchidas na planilha
  const ultimaLinha = aba.getLastRow();
  const ultimaColuna = aba.getLastColumn();

  // Lê a primeira linha da planilha, onde estão os cabeçalhos das colunas
  const cabecalhos = aba.getRange(1, 1, 1, ultimaColuna).getValues()[0];

  // Localiza os índices das colunas importantes com base no nome do cabeçalho
  const indiceData = cabecalhos.indexOf("Carimbo de data/hora");
  const indicePaciente = cabecalhos.indexOf("NOME DO PACIENTE COMPLETO");

  // Se os cabeçalhos obrigatórios não existirem, interrompe o script com erro
  if (indiceData === -1) {
    throw new Error("Cabeçalho 'Carimbo de data/hora' não encontrado.");
  }

  if (indicePaciente === -1) {
    throw new Error("Cabeçalho 'NOME DO PACIENTE COMPLETO' não encontrado.");
  }

  // Abre a pasta do Drive onde os relatórios serão criados
  const pasta = DriveApp.getFolderById(PASTA_ID);

  // Array que vai armazenar as respostas que serão processadas
  let respostas = [];

  // ===========================
  // DEFINIÇÃO DAS RESPOSTAS A PROCESSAR
  // ===========================
  if (GERAR_APENAS_UM_RELATORIO_TESTE) {

    // Modo teste:
    // pega somente a linha definida em LINHA_DA_RESPOSTA_TESTE
    respostas = aba
      .getRange(LINHA_DA_RESPOSTA_TESTE, 1, 1, ultimaColuna)
      .getValues();

  } else {

    // Modo produção:
    // processa apenas novas respostas que ainda não viraram relatório
    const props = PropertiesService.getScriptProperties();
    let ultimaProcessada = Number(props.getProperty("ULTIMA_LINHA"));

    // Primeira execução:
    // apenas salva a última linha atual como ponto de partida
    // e não gera relatórios antigos
    if (!ultimaProcessada) {
      props.setProperty("ULTIMA_LINHA", ultimaLinha.toString());
      Logger.log("Inicializado. Nenhum relatório gerado.");
      return;
    }

    // Se não houver novas respostas, encerra o script
    if (ultimaLinha <= ultimaProcessada) {
      Logger.log("Sem novas respostas.");
      return;
    }

    // Busca apenas as linhas novas ainda não processadas
    respostas = aba
      .getRange(ultimaProcessada + 1, 1, ultimaLinha - ultimaProcessada, ultimaColuna)
      .getValues();

    // Atualiza o controle da última linha processada
    props.setProperty("ULTIMA_LINHA", ultimaLinha.toString());
  }

  // ===========================
  // PROCESSAMENTO DAS RESPOSTAS
  // ===========================
  respostas.forEach(function(dados) {

    // Converte a data da resposta para objeto Date
    const dataResposta = new Date(dados[indiceData]);

    // Obtém o nome completo do paciente
    const nomePaciente = String(dados[indicePaciente] || "").trim();

    // Define o nome do arquivo usando primeiro nome + último sobrenome
    let primeiroNome = "Paciente";
    let ultimoSobrenome = "";

    if (nomePaciente) {
      const partes = nomePaciente.split(/\s+/);
      primeiroNome = partes[0];
      ultimoSobrenome = partes.length > 1 ? partes[partes.length - 1] : "";
    }

    // Formata a data e o horário para compor o nome do arquivo
    const dataArquivo = Utilities.formatDate(
      dataResposta,
      Session.getScriptTimeZone(),
      "dd-MM-yyyy"
    );

    const horaArquivo = Utilities.formatDate(
      dataResposta,
      Session.getScriptTimeZone(),
      "HH-mm-ss"
    );

    // Nome final do arquivo
    const nomeArquivo =
      primeiroNome +
      (ultimoSobrenome ? "_" + ultimoSobrenome : "") +
      "_" +
      dataArquivo +
      "_" +
      horaArquivo +
      ".txt";

    // Array que armazenará todas as linhas do relatório
    const linhas = [];

    // Cabeçalho visual do relatório
    linhas.push("==================================================");
    linhas.push("             RELATÓRIO DO PACIENTE");
    linhas.push("==================================================");
    linhas.push("");

    // Percorre todas as colunas da resposta e escreve no relatório
    for (let i = 0; i < cabecalhos.length; i++) {
      const valor =
        dados[i] !== null && dados[i] !== "" ? String(dados[i]) : "";

      linhas.push(cabecalhos[i] + ": " + valor);
      linhas.push("");
    }

    // Rodapé do relatório
    linhas.push("==================================================");
    linhas.push(
      "Gerado automaticamente pelo sistema em " +
      Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        "dd/MM/yyyy 'às' HH:mm:ss"
      )
    );
    linhas.push("==================================================");

    // Evita criar arquivo duplicado com o mesmo nome
    if (pasta.getFilesByName(nomeArquivo).hasNext()) {
      Logger.log("Arquivo já existe: " + nomeArquivo);
      return;
    }

    // Cria o arquivo .txt na pasta do Drive
    pasta.createFile(
      nomeArquivo,
      linhas.join("\n"),
      MimeType.PLAIN_TEXT
    );

    Logger.log("Relatório criado: " + nomeArquivo);
  });
}
