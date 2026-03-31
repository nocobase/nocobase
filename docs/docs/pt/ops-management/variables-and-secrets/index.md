---
pkg: "@nocobase/plugin-environment-variables"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::



# Variáveis e Segredos

## Introdução

Configure e gerencie de forma centralizada as variáveis de ambiente e segredos. Isso é útil para armazenar dados sensíveis, reutilizar configurações e isolar configurações de ambiente.

## Diferenças em relação ao `.env`

| **Característica**       | **Arquivo `.env`**                                                                                               | **Variáveis e Segredos Configurados Dinamicamente**                                                                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Local de Armazenamento** | Armazenado no arquivo `.env` na raiz do projeto                                                                   | Armazenado na tabela `environmentVariables` do banco de dados                                                                                                                     |
| **Método de Carregamento** | Carregado em `process.env` usando ferramentas como `dotenv` durante a inicialização da aplicação                 | Lido dinamicamente e carregado em `app.environment` durante a inicialização da aplicação                                                                                          |
| **Método de Modificação** | Requer edição direta do arquivo; as alterações só entram em vigor após reiniciar a aplicação                     | Suporta modificação em tempo de execução; as alterações entram em vigor imediatamente após recarregar a configuração da aplicação                                                |
| **Isolamento de Ambiente** | Cada ambiente (desenvolvimento, teste, produção) requer manutenção separada dos arquivos `.env`                  | Cada ambiente (desenvolvimento, teste, produção) requer manutenção separada dos dados na tabela `environmentVariables`                                                           |
| **Cenários Aplicáveis**  | Adequado para configurações estáticas fixas, como informações do banco de dados principal da aplicação           | Adequado para configurações dinâmicas que exigem ajustes frequentes ou estão ligadas à lógica de negócios, como bancos de dados externos, informações de armazenamento de arquivos, etc. |

## Instalação

Este é um plugin integrado, então você não precisa instalá-lo separadamente.

## Uso

### Reutilização de Dados de Configuração

Por exemplo, se você tem vários nós de e-mail em um fluxo de trabalho que precisam de configuração SMTP, pode armazenar a configuração SMTP comum em variáveis de ambiente.

![20250102181045](https://static-docs.nocobase.com/20250102181045.png)

### Armazenamento de Dados Sensíveis

Armazene informações de configuração de diversos bancos de dados externos, chaves de armazenamento de arquivos na nuvem e outros dados sensíveis.

![20250102103513](https://static-docs.nocobase.com/20250102103513.png)

### Isolamento de Configuração de Ambiente

Em diferentes ambientes, como desenvolvimento, teste e produção, usamos estratégias de gerenciamento de configuração independentes para garantir que as configurações e os dados de cada ambiente não interfiram uns nos outros. Cada ambiente tem suas próprias configurações, variáveis e recursos, o que evita conflitos entre os ambientes de desenvolvimento, teste e produção e garante que o sistema funcione como esperado em cada um deles.

Por exemplo, a configuração para serviços de armazenamento de arquivos pode ser diferente entre os ambientes de desenvolvimento e produção, como mostrado abaixo:

Ambiente de Desenvolvimento

```bash
FILE_STORAGE_OSS_BASE_URL=dev-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=dev-storage
```

Ambiente de Produção

```bash
FILE_STORAGE_OSS_BASE_URL=prod-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=prod-storage
```

## Gerenciamento de Variáveis de Ambiente

![20250102155314](https://static-docs.nocobase.com/20250102155314.png)

### Adicionando Variáveis de Ambiente

- Suporta adição individual e em lote
- Suporta armazenamento em texto simples e criptografado

![20250102155509](https://static-docs.nocobase.com/20250102155509.png)

Adição Individual

![20250102155731](https://static-docs.nocobase.com/20250102155731.png)

Adição em Lote

![20250102155258](https://static-docs.nocobase.com/20250102155258.png)

## Observações

### Reiniciando a Aplicação

Após modificar ou excluir variáveis de ambiente, uma notificação para reiniciar a aplicação aparecerá no topo. As alterações nas variáveis de ambiente só entrarão em vigor depois que a aplicação for reiniciada.

![20250102155007](https://static-docs.nocobase.com/20250102155007.png)

### Armazenamento Criptografado

Os dados criptografados das variáveis de ambiente utilizam criptografia simétrica AES. A CHAVE PRIVADA para criptografia e descriptografia é armazenada no diretório `storage`. Por favor, guarde-a com segurança; se for perdida ou sobrescrita, os dados criptografados não poderão ser descriptografados.

```bash
./storage/environment-variables/<app-name>/aes_key.dat
```

## Plugins Atualmente Suportados para Variáveis de Ambiente

### Action: Requisição Personalizada

![20250102180751](https://static-docs.nocobase.com/20250102180751.png)

### Autenticação: CAS

![20250102160129](https://static-docs.nocobase.com/20250102160129.png)

### Autenticação: DingTalk

![20250102160205](https://static-docs.nocobase.com/20250102160205.png)

### Autenticação: LDAP

![20250102160312](https://static-docs.nocobase.com/20250102160312.png)

### Autenticação: OIDC

![20250102160426](https://static-docs.nocobase.com/20250102160426.png)

### Autenticação: SAML

![20250102160652](https://static-docs.nocobase.com/20250102160652.png)

### Autenticação: WeCom

![20250102160758](https://static-docs.nocobase.com/20250102160758.png)

### Fonte de Dados: MariaDB Externo

![20250102160935](https://static-docs.nocobase.com/20250102160935.png)

### Fonte de Dados: MySQL Externo

![20250102173602](https://static-docs.nocobase.com/20250102173602.png)

### Fonte de Dados: Oracle Externo

![20250102174153](https://static-docs.nocobase.com/20250102174153.png)

### Fonte de Dados: PostgreSQL Externo

![20250102175630](https://static-docs.nocobase.com/20250102175630.png)

### Fonte de Dados: SQL Server Externo

![20250102175814](https://static-docs.nocobase.com/20250102175814.png)

### Fonte de Dados: KingbaseES

![20250102175951](https://static-docs.nocobase.com/20250102175951.png)

### Fonte de Dados: API REST

![20250102180109](https://static-docs.nocobase.com/20250102180109.png)

### Armazenamento de Arquivos: Local

![20250102161114](https://static-docs.nocobase.com/20250102161114.png)

### Armazenamento de Arquivos: Aliyun OSS

![20250102161404](https://static-docs.nocobase.com/20250102161404.png)

### Armazenamento de Arquivos: Amazon S3

![20250102163730](https://static-docs.nocobase.com/20250102163730.png)

### Armazenamento de Arquivos: Tencent COS

![20250102173109](https://static-docs.nocobase.com/20250102173109.png)

### Armazenamento de Arquivos: S3 Pro

Não adaptado

### Mapa: AMap

![20250102163803](https://static-docs.nocobase.com/20250102163803.png)

### Mapa: Google

![20250102171524](https://static-docs.nocobase.com/20250102171524.png)

### Configurações de E-mail

Não adaptado

### Notificação: E-mail

![20250102164059](https://static-docs.nocobase.com/20250102164059.png)

### Formulários Públicos

![20250102163849](https://static-docs.nocobase.com/20250102163849.png)

### Configurações do Sistema

![20250102164139](https://static-docs.nocobase.com/20250102164139.png)

### Verificação: SMS Aliyun

![20250102164247](https://static-docs.nocobase.com/20250102164247.png)

### Verificação: SMS Tencent

![20250102165814](https://static-docs.nocobase.com/20250102165814.png)

### Fluxo de Trabalho

![20250102180537](https://static-docs.nocobase.com/20250102180537.png)