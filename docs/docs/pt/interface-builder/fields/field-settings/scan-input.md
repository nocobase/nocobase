---
title: "Entrada por Escaneamento"
description: "Configurações do campo: ative a entrada por escaneamento para campos de formulário de texto e suporte a gravação de valores por QR code ou código de barras."
keywords: "entrada por escaneamento,QR code,código de barras,configurações do campo,construtor de interface,NocoBase"
---

# Entrada por Escaneamento

## Introdução

A entrada por escaneamento é usada em campos de texto de formulários editáveis. Depois de ativada, um botão de escaneamento aparece no lado direito do campo de entrada. Os usuários podem escanear um QR code ou código de barras, ou selecionar uma imagem do álbum para reconhecimento, e gravar o resultado reconhecido no campo atual.

Em geral, ela é adequada para inserir números de equipamento, códigos de ativos, números de pedido, números de rastreamento e outros valores que não são convenientes para digitar manualmente.

## Campos compatíveis

A entrada por escaneamento é usada principalmente para campos baseados em texto, como:

- Texto de linha única
- Número de celular
- E-mail
- URL
- UUID
- Nano ID

Se o campo estiver em modo somente leitura, em modo de leitura, ou não suportar entrada editável, a configuração de entrada por escaneamento não será exibida.

## Configuração

Selecione o campo correspondente em um bloco de formulário, abra o menu de configuração do campo e procure por `Configurações de entrada por escaneamento`.

As opções incluem:

- `Ativar entrada por escaneamento`: após ativar, um botão de escaneamento será exibido no lado direito da caixa de entrada
- `Desativar entrada manual`: após ativar, os usuários só poderão gravar o valor do campo por escaneamento e não poderão editar manualmente a caixa de entrada

Depois que `Ativar entrada por escaneamento` for desativado, `Desativar entrada manual` também ficará inativo.

## Uso

Depois que o usuário clicar no botão de escaneamento à direita do campo, ele poderá usar a câmera para reconhecer um QR code ou código de barras. O escaneamento no navegador exige permissão de acesso à câmera. Em ambientes móveis com capacidade nativa de escaneamento, essa capacidade será usada primeiro.

Se não for conveniente usar a câmera diretamente, o usuário também pode clicar em `Álbum` para selecionar uma imagem para reconhecimento.
