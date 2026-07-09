## Como configurar o acionador no Google Apps Script

Para que o script rode automaticamente sempre que houver novas respostas na planilha, é necessário criar um **acionador baseado em tempo**.

### Passo a passo

1. Abra o projeto no **Google Apps Script**.
2. No menu lateral esquerdo, clique em **Acionadores** (ícone de relógio).
3. Clique em **+ Adicionar acionador**.
4. Configure da seguinte forma:

   * **Função a ser executada:** `gerarRelatoriosPacientes`
   * **Implantação:** `Head`
   * **Origem do evento:** `Baseado no tempo`
   * **Tipo de acionador baseado no tempo:** `Contador de minutos`
   * **Selecione o intervalo de minutos:** `A cada 1 minuto`
5. Clique em **Salvar**.
6. Na primeira vez, o Google solicitará autorização para que o script acesse o Google Sheets e o Google Drive. Basta aceitar as permissões.

### Como o acionador funciona

Depois de configurado, o script será executado automaticamente no intervalo definido.
No modo de produção (`GERAR_APENAS_UM_RELATORIO_TESTE = false`), ele:

* verifica se surgiram novas respostas na planilha;
* gera relatórios apenas para as respostas ainda não processadas;
* salva os arquivos `.txt` na pasta configurada do Google Drive.

### Observação importante

Durante os testes, recomenda-se manter:

```javascript
const MODO_TESTE = true;
```

Quando tudo estiver funcionando corretamente, altere para:

```javascript
const MODO_TESTE = false;
```

A partir desse momento, o acionador passará a processar automaticamente apenas novas respostas da planilha.
Assim, o script gera apenas um relatório de teste com base na linha definida em `LINHA_DA_RESPOSTA_TESTE`.

## Sobre este projeto

Estou publicando este projeto de forma aberta porque acredito no compartilhamento de conhecimento e na ideia de que código útil não precisa ficar trancado. Se isso puder ajudar alguém a automatizar um processo, aprender Google Apps Script ou usar como base para um projeto próprio, então já valeu a pena.

Pode usar, adaptar, melhorar e reaproveitar à vontade.

Se você tiver qualquer comentário, crítica, sugestão ou ideia de melhoria, vou ficar genuinamente feliz em ler. Feedback, correções e contribuições são muito bem-vindos.

Obrigado por passar por aqui.
