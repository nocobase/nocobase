:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

## Instruções de Configuração

### Ativando a Impressão de Modelos
A impressão de modelos atualmente oferece suporte a blocos de detalhes e blocos de tabela. Abaixo, vamos descrever como configurar cada um deles.

#### Blocos de Detalhes

1.  **Abra o Bloco de Detalhes**:
    -   No aplicativo, navegue até o bloco de detalhes onde você precisa usar o recurso de impressão de modelos.

2.  **Acesse o Menu de Operações de Configuração**:
    -   Na parte superior da interface, clique no menu "Configurar Operação".

3.  **Selecione "Impressão de Modelos"**:
    -   No menu suspenso, clique na opção "Impressão de Modelos" para ativar a funcionalidade do **plugin**.

![Ativar Impressão de Modelos](https://static-docs.nocobase.com/20241212150539-2024-12-12-15-05-43.png)

### Configurando Modelos

1.  **Acesse a Página de Configuração de Modelos**:
    -   No menu de configuração do botão "Impressão de Modelos", selecione a opção "Configuração de Modelos".

![Opção de Configuração de Modelos](https://static-docs.nocobase.com/20241212151858-2024-12-12-15-19-01.png)

2.  **Adicione um Novo Modelo**:
    -   Clique no botão "Adicionar Modelo" para acessar a página de adição de modelos.

![Botão Adicionar Modelo](https://static-docs.nocobase.com/20241212151243-2024-12-12-15-12-46.png)

3.  **Preencha as Informações do Modelo**:
    -   No formulário do modelo, preencha o nome do modelo e selecione o tipo de modelo (Word, Excel, PowerPoint).
    -   Faça o upload do arquivo de modelo correspondente (suporta os formatos `.docx`, `.xlsx`, `.pptx`).

![Configurar Nome e Arquivo do Modelo](https://static-docs.nocobase.com/20241212151518-2024-12-12-15-15-21.png)

4.  **Edite e Salve o Modelo**:
    -   Vá para a página "Lista de Campos", copie os campos e preencha-os no modelo.
    ![Lista de Campos](https://static-docs.nocobase.com/20250107141010.png)
    ![20241212152743-2024-12-12-15-27-45](https://static-docs.nocobase.com/20241212152743-2024-12-12-15-27-45.png)
    -   Após preencher os detalhes, clique no botão "Salvar" para finalizar a adição do modelo.

5.  **Gerenciamento de Modelos**:
    -   Clique no botão "Usar" à direita da lista de modelos para ativar o modelo.
    -   Clique no botão "Editar" para modificar o nome do modelo ou substituir o arquivo do modelo.
    -   Clique no botão "Baixar" para fazer o download do arquivo de modelo configurado.
    -   Clique no botão "Excluir" para remover modelos que não são mais necessários. O sistema solicitará uma confirmação para evitar exclusões acidentais.
    ![Gerenciamento de Modelos](https://static-docs.nocobase.com/20250107140436.png)

#### Blocos de Tabela

O uso de blocos de tabela é basicamente o mesmo que o de blocos de detalhes, com as seguintes diferenças:

1.  **Suporte para Impressão de Múltiplos Registros**: Você precisa primeiro selecionar os registros a serem impressos, marcando-os. É possível imprimir até 100 registros de uma vez.

![20250416215633-2025-04-16-21-56-35](https://static-docs.nocobase.com/20250416215633-2025-04-16-21-56-35.png)

2.  **Gerenciamento Isolado de Modelos**: Os modelos para blocos de tabela e blocos de detalhes não são intercambiáveis — isso ocorre porque as estruturas de dados são diferentes (um é um objeto, o outro é um array).