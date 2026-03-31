:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Gerenciamento de Lançamentos

## Introdução

Em aplicações reais, para garantir a segurança dos dados e a estabilidade das aplicações, geralmente precisamos implantar múltiplos ambientes, como ambiente de desenvolvimento, ambiente de pré-produção e ambiente de produção. Este documento apresenta dois processos comuns de desenvolvimento no-code e detalha como implementar o gerenciamento de lançamentos no NocoBase.

## Instalação

Três plugins são essenciais para o gerenciamento de lançamentos. Certifique-se de que os seguintes plugins estejam ativados.

### Variáveis e Segredos

- Plugin integrado, instalado e ativado por padrão.
- Oferece configuração e gerenciamento centralizados de variáveis de ambiente e segredos, utilizados para armazenamento de dados sensíveis, reutilização de dados de configuração, isolamento de configurações por ambiente, etc. ([Ver Documentação](#)).

### Gerenciador de Backup

- Este plugin está disponível apenas na edição Professional ou superior ([Saiba mais](https://www.nocobase.com/en/commercial)).
- Oferece funcionalidades de backup e restauração, incluindo backups agendados, garantindo a segurança dos dados e uma recuperação rápida. ([Ver Documentação](../backup-manager/index.mdx)).

### Gerenciador de Migração

- Este plugin está disponível apenas na edição Professional ou superior ([Saiba mais](https://www.nocobase.com/en/commercial)).
- Usado para migrar configurações de aplicações de um ambiente para outro ([Ver Documentação](../migration-manager/index.md)).

## Processos Comuns de Desenvolvimento No-Code

### Ambiente de Desenvolvimento Único, Lançamento Unidirecional

Ideal para processos de desenvolvimento simples. Há um único ambiente de desenvolvimento, um de pré-produção e um de produção. As alterações fluem do ambiente de desenvolvimento para o ambiente de pré-produção e, finalmente, são implantadas no ambiente de produção. Neste processo, apenas o ambiente de desenvolvimento pode modificar as configurações — nem o ambiente de pré-produção nem o de produção permitem modificações.

![20250106234710](https://static-docs.nocobase.com/20250106234710.png)

Ao configurar as regras de migração, selecione a regra **"Sobrescrever Prioritariamente"** para as tabelas internas do core e dos plugins, se necessário; para as demais, você pode manter as configurações padrão, caso não haja requisitos especiais.

![20250105194845](https://static-docs.nocobase.com/20250105194845.png)

### Múltiplos Ambientes de Desenvolvimento, Lançamento Consolidado

Ideal para cenários de colaboração em equipe ou projetos complexos. Vários ambientes de desenvolvimento paralelos podem ser usados independentemente, e todas as alterações são consolidadas em um único ambiente de pré-produção para testes e validação antes de serem implantadas em produção. Neste processo, também, apenas o ambiente de desenvolvimento pode modificar as configurações — nem o ambiente de pré-produção nem o de produção permitem modificações.

![20250107103829](https://static-docs.nocobase.com/20250107103829.png)

Ao configurar as regras de migração, selecione a regra **"Inserir ou Atualizar Prioritariamente"** para as tabelas internas do core e dos plugins, se necessário; para as demais, você pode manter as configurações padrão, caso não haja requisitos especiais.

![20250105194942](https://static-docs.nocobase.com/20250105194942.png)

## Reversão

Antes de executar uma migração, o sistema cria automaticamente um backup da aplicação atual. Se a migração falhar ou os resultados não forem os esperados, você pode reverter e restaurar através do [Gerenciador de Backup](../backup-manager/index.mdx).

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)