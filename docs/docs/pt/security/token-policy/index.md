---
pkg: '@nocobase/plugin-auth'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Política de Segurança de Token

## Introdução

A Política de Segurança de Token é uma configuração funcional projetada para proteger a segurança do sistema e melhorar a experiência do usuário. Ela inclui três itens de configuração principais: "Período de Validade da Sessão", "Período de Validade do Token" e "Limite de Tempo para Atualização de Token Expirado".

## Acesso à Configuração

Você encontra a configuração em Configurações do **Plugin** - Segurança - Política de Token:

![20250105111821-2025-01-05-11-18-24](https://static-docs.nocobase.com/20250105111821-2025-01-05-11-18-24.png)

## Período de Validade da Sessão

**Definição:**

O Período de Validade da Sessão refere-se à duração máxima que o sistema permite que um usuário mantenha uma sessão ativa após o login.

**Como funciona:**

Após o Período de Validade da Sessão ser excedido, o usuário receberá uma resposta de erro 401 ao tentar acessar o sistema novamente, e será redirecionado para a página de login para reautenticação.
Exemplo:
Se o Período de Validade da Sessão for definido para 8 horas, a sessão expirará 8 horas após o login do usuário, assumindo que não haja interações adicionais.

**Configurações Recomendadas:**

- Cenários de operação de curto prazo: Recomenda-se 1-2 horas para aumentar a segurança.
- Cenários de trabalho de longo prazo: Pode ser definido para 8 horas para atender às necessidades do negócio.

## Período de Validade do Token

**Definição:**

O Período de Validade do Token refere-se ao ciclo de vida de cada Token emitido pelo sistema durante a sessão ativa do usuário.

**Como funciona:**

Quando um Token expira, o sistema emitirá automaticamente um novo Token para manter a sessão ativa.
Cada Token expirado só pode ser atualizado uma vez.

**Configurações Recomendadas:**

Por motivos de segurança, recomenda-se configurá-lo entre 15 e 30 minutos.
Pode ser ajustado conforme a necessidade do cenário. Por exemplo:
- Cenários de alta segurança: O Período de Validade do Token pode ser reduzido para 10 minutos ou menos.
- Cenários de baixo risco: O Período de Validade do Token pode ser estendido para 1 hora.

## Limite de Tempo para Atualização de Token Expirado

**Definição:**

O Limite de Tempo para Atualização de Token Expirado refere-se à janela de tempo máxima permitida para um usuário obter um novo Token através de uma operação de atualização, após o Token ter expirado.

**Características:**

- Se o limite de tempo para atualização for excedido, o usuário deverá fazer login novamente para obter um novo Token.
- A operação de atualização não estende o Período de Validade da Sessão, ela apenas regenera o Token.

**Configurações Recomendadas:**

Por motivos de segurança, recomenda-se configurá-lo entre 5 e 10 minutos.