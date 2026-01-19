:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Busca RAG

## Introdução

Depois de configurar a base de conhecimento, você pode habilitar o recurso RAG nas configurações do funcionário de IA.

Com o RAG habilitado, quando um usuário conversar com um funcionário de IA, o funcionário de IA usará a busca RAG para obter documentos da base de conhecimento com base na mensagem do usuário e responderá com base nos documentos recuperados.

## Habilitar RAG

Acesse a página de configuração do **plugin** de funcionário de IA, clique na aba `AI employees` para entrar na página de gerenciamento de funcionários de IA.

![20251023010811](https://static-docs.nocobase.com/20251023010811.png)

Selecione o funcionário de IA para o qual você deseja habilitar o RAG, clique no botão `Edit` para acessar a página de edição do funcionário de IA.

Na aba `Knowledge base`, ative o interruptor `Enable`.

- Em `Knowledge Base Prompt`, insira o prompt para referenciar a base de conhecimento. `{knowledgeBaseData}` é um placeholder fixo e não deve ser modificado;
- Em `Knowledge Base`, selecione a base de conhecimento configurada. Veja: [Base de Conhecimento](/ai-employees/knowledge-base/knowledge-base);
- No campo `Top K`, insira o número de documentos a serem recuperados. O padrão é 3;
- No campo `Score`, insira o limite de relevância do documento para a busca;

Clique no botão `Submit` para salvar as configurações do funcionário de IA.

![20251023010844](https://static-docs.nocobase.com/20251023010844.png)