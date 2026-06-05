---
pkg: "@nocobase/plugin-data-source-main"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Banco de Dados Principal

## Introdução

O banco de dados principal do NocoBase pode ser usado para armazenar tanto os dados de negócio quanto os metadados da aplicação, incluindo dados de tabelas do sistema e dados de tabelas personalizadas. Ele suporta bancos de dados relacionais como MySQL, PostgreSQL, entre outros. Ao instalar o NocoBase, o banco de dados principal é instalado junto e não pode ser excluído.

## Instalação

É um plugin integrado, não precisa de instalação separada.

## Gerenciamento de Coleções

A fonte de dados principal oferece funcionalidades completas de gerenciamento de coleções, permitindo que você crie novas coleções através do NocoBase e também sincronize estruturas de coleções já existentes no banco de dados.

![20240322230134](https://static-docs.nocobase.com/20240322230134.png)

### Sincronizando Coleções Existentes do Banco de Dados

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Uma característica importante da fonte de dados principal é a capacidade de sincronizar coleções que já existem no banco de dados para serem gerenciadas no NocoBase. Isso significa:

- **Proteger Investimentos Existentes**: Se você já tem muitas coleções de negócio no seu banco de dados, não precisa recriá-las — você pode sincronizá-las e usá-las diretamente.
- **Integração Flexível**: Coleções criadas através de outras ferramentas (como scripts SQL, ferramentas de gerenciamento de banco de dados, etc.) podem ser gerenciadas pelo NocoBase.
- **Migração Progressiva**: Suporte para migrar sistemas existentes para o NocoBase gradualmente, em vez de refatorar tudo de uma vez.

Através da funcionalidade "Carregar do Banco de Dados", você pode:
1. Navegar por todas as coleções no banco de dados
2. Selecionar as coleções que você precisa sincronizar
3. Identificar automaticamente as estruturas das coleções e os tipos de campo
4. Importá-las para o NocoBase para gerenciamento com um clique

### Suporte para Vários Tipos de Coleção

![nocobase_doc-2025-10-29-19-47-14](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-47-14.png)

O NocoBase suporta a criação e o gerenciamento de vários tipos de coleções:
- **Coleção Geral**: com campos de sistema de uso comum integrados;
- **Coleção de Herança**: permite a criação de uma coleção pai da qual coleções filhas podem ser derivadas. As coleções filhas herdam a estrutura da coleção pai e podem definir suas próprias colunas.
- **Coleção em Árvore**: uma coleção com estrutura de árvore, atualmente suporta apenas o design de lista de adjacência;
- **Coleção de Calendário**: para criar coleções de eventos relacionadas a calendário;
- **Coleção de Arquivos**: para gerenciamento de armazenamento de arquivos;
- **Coleção de Expressão**: para cenários de expressão dinâmica em fluxos de trabalho;
- **Coleção SQL**: não é uma coleção de banco de dados real, mas apresenta rapidamente consultas SQL de forma estruturada;
- **Coleção de View de Banco de Dados**: conecta-se a views de banco de dados existentes;
- **Coleção FDW**: permite que o sistema de banco de dados acesse e consulte diretamente dados em fontes de dados externas, baseada na tecnologia FDW;

### Suporte para Gerenciamento de Classificação de Coleções

![20240322231520](https://static-docs.nocobase.com/20240322231520.png)

### Diversos Tipos de Campo

![nocobase_doc-2025-10-29-19-48-51](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-48-51.png)

#### Conversão Flexível de Tipos de Campo

O NocoBase suporta a conversão flexível de tipos de campo com base no mesmo tipo de banco de dados.

**Exemplo: Opções de Conversão para Campos do Tipo String**

Quando um campo do banco de dados é do tipo String, ele pode ser convertido para qualquer uma das seguintes formas no NocoBase:

- **Básico**: Texto de linha única, Texto longo, Telefone, E-mail, URL, Senha, Cor, Ícone
- **Escolhas**: Seleção única (dropdown), Grupo de rádio
- **Mídia**: Markdown, Markdown (Vditor), Texto Rico, Anexo (URL)
- **Data e Hora**: Data e Hora (com fuso horário), Data e Hora (sem fuso horário)
- **Avançado**: Sequência, Seletor de coleção, Criptografia

Esse mecanismo de conversão flexível significa:
- **Não é Necessário Modificar a Estrutura do Banco de Dados**: O tipo de armazenamento subjacente do campo permanece inalterado; apenas sua representação no NocoBase muda.
- **Adaptação às Mudanças de Negócio**: À medida que as necessidades de negócio evoluem, você pode ajustar rapidamente a exibição e os métodos de interação do campo.
- **Segurança dos Dados**: O processo de conversão não afeta a integridade dos dados existentes.

### Sincronização Flexível em Nível de Campo

O NocoBase não apenas sincroniza coleções inteiras, mas também suporta o gerenciamento de sincronização granular em nível de campo:

![nocobase_doc-2025-10-29-19-49-56](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-49-56.png)

#### Recursos de Sincronização de Campo:

1. **Sincronização em Tempo Real**: Quando a estrutura da coleção do banco de dados muda, novos campos adicionados podem ser sincronizados a qualquer momento.
2. **Sincronização Seletiva**: Você pode sincronizar seletivamente os campos que precisa, em vez de todos os campos.
3. **Reconhecimento Automático de Tipo**: Identifica automaticamente os tipos de campo do banco de dados e os mapeia para os tipos de campo do NocoBase.
4. **Manter a Integridade dos Dados**: O processo de sincronização não afeta os dados existentes.

#### Casos de Uso:

- **Evolução do Esquema do Banco de Dados**: Quando as necessidades de negócio mudam e novos campos precisam ser adicionados ao banco de dados, eles podem ser rapidamente sincronizados com o NocoBase.
- **Colaboração em Equipe**: Quando outros membros da equipe ou DBAs adicionam campos ao banco de dados, eles podem ser sincronizados prontamente.
- **Modo de Gerenciamento Híbrido**: Alguns campos gerenciados através do NocoBase, outros através de métodos tradicionais — combinações flexíveis.

Esse mecanismo de sincronização flexível permite que o NocoBase se integre bem às arquiteturas técnicas existentes, sem exigir mudanças nas práticas de gerenciamento de banco de dados existentes, ao mesmo tempo em que você desfruta da conveniência do desenvolvimento low-code que o NocoBase oferece.

Veja mais na seção "[Campos de Coleção / Visão Geral](/data-sources/data-modeling/collection-fields)".