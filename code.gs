function gerarRelatoriosPacientes() {

  // ===========================
  // CONFIGURAÇÕES PRINCIPAIS
  // ===========================
  // PLANILHA_ID: ID da planilha do Google Sheets que recebe as respostas do formulário
  // NOME_ABA: nome da aba onde as respostas estão armazenadas
  // PASTA_ID: ID da pasta do Google Drive onde os arquivos .txt serão salvos
  const PLANILHA_ID = "COLOQUE_O_ID_DA_SUA_PLANILHA";
  const NOME_ABA = "COLOQUE_O_NOME_DA_ABA";
  const PASTA_ID = "COLOQUE_O_ID_DA_PASTA_DO_DRIVE";

  // ===========================
  // MODO DE EXECUÇÃO
  // ===========================
  // MODO_TESTE = true:
  // gera relatórios apenas das linhas informadas em LINHAS_DE_TESTE
  //
  // MODO_TESTE = false:
  // processa automaticamente apenas novas respostas da planilha
  const MODO_TESTE = false;

  // Linhas específicas da planilha usadas apenas no modo de teste
  const LINHAS_DE_TESTE = [2];

  // ===========================
  // ABERTURA DA PLANILHA
  // ===========================
  const planilha = SpreadsheetApp.openById(PLANILHA_ID);
  const aba = planilha.getSheetByName(NOME_ABA);

  // Última linha e última coluna preenchidas da planilha
  const ultimaLinha = aba.getLastRow();
  const ultimaColuna = aba.getLastColumn();

  // Lê a primeira linha da planilha, onde ficam os cabeçalhos
  const cabecalhos = aba.getRange(1, 1, 1, ultimaColuna).getValues()[0];

  // ===========================
  // LOCALIZAÇÃO DOS CABEÇALHOS IMPORTANTES
  // ===========================
  // Procura a coluna da data/hora e a coluna do nome do paciente
  // usando o texto do cabeçalho, sem depender da letra da coluna
  const indiceData = cabecalhos.findIndex(cabecalho =>
    String(cabecalho)
      .trim()
      .toUpperCase()
      .includes("CARIMBO DE DATA/HORA")
  );

  const indicePaciente = cabecalhos.findIndex(cabecalho =>
    String(cabecalho)
      .trim()
      .toUpperCase()
      .includes("NOME DO PACIENTE COMPLETO")
  );

  // Se os cabeçalhos obrigatórios não forem encontrados, o script é interrompido
  if (indiceData === -1) {
    throw new Error("Cabeçalho 'Carimbo de data/hora' não encontrado.");
  }

  if (indicePaciente === -1) {
    throw new Error("Cabeçalho 'NOME DO PACIENTE COMPLETO' não encontrado.");
  }

  // Abre a pasta do Google Drive onde os relatórios serão salvos
  const pasta = DriveApp.getFolderById(PASTA_ID);

  // Array que armazenará as respostas a serem processadas
  let respostas = [];

  // ===========================
  // DEFINIÇÃO DAS RESPOSTAS A PROCESSAR
  // ===========================
  if (MODO_TESTE) {

    // No modo de teste, gera relatórios apenas das linhas informadas manualmente
    respostas = LINHAS_DE_TESTE.map(function(linha) {
      return aba.getRange(linha, 1, 1, ultimaColuna).getValues()[0];
    });

  } else {

    // No modo produção, o script processa apenas novas respostas
    const props = PropertiesService.getScriptProperties();

    // Recupera a última linha já processada em execuções anteriores
    let ultimaProcessada = Number(props.getProperty("ULTIMA_LINHA"));

    // Se for a primeira execução em modo produção:
    // salva a última linha atual e encerra, para evitar gerar relatórios antigos
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

    // Busca apenas as novas respostas que ainda não foram processadas
    respostas = aba
      .getRange(ultimaProcessada + 1, 1, ultimaLinha - ultimaProcessada, ultimaColuna)
      .getValues();

    // Atualiza a última linha processada
    props.setProperty("ULTIMA_LINHA", ultimaLinha.toString());
  }

  // ===========================
  // GERAÇÃO DOS RELATÓRIOS
  // ===========================
  respostas.forEach(function(dados) {

    // Converte a data da resposta para objeto Date
    const dataResposta = new Date(dados[indiceData]);

    // Obtém o nome completo do paciente
    const nomePaciente = String(dados[indicePaciente] || "").trim();

    // Divide o nome do paciente em primeiro nome e último sobrenome
    // para compor o nome do arquivo
    let primeiroNome = "Paciente";
    let ultimoSobrenome = "";

    if (nomePaciente) {
      const partes = nomePaciente.split(/\s+/);
      primeiroNome = partes[0];
      ultimoSobrenome = partes.length > 1 ? partes[partes.length - 1] : "";
    }

    // Formata a data e a hora da resposta para compor o nome do arquivo
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

    // Exemplo de nome final:
    // Maria_Oliveira_06-07-2026_11-30-15.txt
    const nomeArquivo =
      primeiroNome +
      (ultimoSobrenome ? "_" + ultimoSobrenome : "") +
      "_" +
      dataArquivo +
      "_" +
      horaArquivo +
      ".txt";

    // Array que armazenará o conteúdo do relatório
    const linhas = [];

    // Cabeçalho visual do arquivo .txt
    linhas.push("==================================================");
    linhas.push("             RELATÓRIO DO PACIENTE");
    linhas.push("==================================================");
    linhas.push("");

    // Percorre todas as colunas da resposta e escreve no relatório
    // no formato: "Nome do campo: valor"
    for (let i = 0; i < cabecalhos.length; i++) {
      const valor =
        dados[i] !== null && dados[i] !== "" ? String(dados[i]) : "";

      linhas.push(cabecalhos[i] + ": " + valor);
      linhas.push("");
    }

    // Rodapé do relatório com data/hora de geração do arquivo
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

    // Evita criar arquivo duplicado caso já exista um arquivo com o mesmo nome
    if (pasta.getFilesByName(nomeArquivo).hasNext()) {
      Logger.log("Arquivo já existe: " + nomeArquivo);
      return;
    }

    // Cria o arquivo .txt na pasta do Google Drive
    pasta.createFile(
      nomeArquivo,
      linhas.join("\n"),
      MimeType.PLAIN_TEXT
    );

    Logger.log("Relatório criado: " + nomeArquivo);
  });
}
