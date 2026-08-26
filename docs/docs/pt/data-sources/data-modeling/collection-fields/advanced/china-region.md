---
title: "Divisão administrativa da China"
description: "Campo de divisão administrativa da China, com seleção em três níveis (província/cidade/distrito), ideal para endereços, naturalidade etc."
keywords: "divisão administrativa,China,província cidade distrito,seleção em três níveis,NocoBase"
---

# Divisão administrativa da China

<PluginInfo name="field-china-region"></PluginInfo>

## Introdução

O campo de divisão administrativa da China é usado para armazenar informações de divisões administrativas chinesas (província, cidade, distrito etc.) em uma tabela de dados. O campo se baseia na tabela interna `chinaRegions` e oferece um seletor em cascata, permitindo que o usuário selecione província, cidade e distrito por níveis no formulário.

Cenários comuns:

- Localização de clientes, contatos, lojas, projetos e outros registros
- Endereço base como naturalidade, cidade natal ou região de entrega
- Dados que precisam ser filtrados ou agregados por província/cidade/distrito

O valor do campo é armazenado como registro relacionado, vinculado por padrão à tabela `chinaRegions`, e a exibição segue a hierarquia administrativa. Por exemplo, ao selecionar "Pequim / Distritos municipais / Dongcheng", a forma de leitura concatena o caminho completo seguindo a hierarquia.

## Configuração do campo

![](https://static-docs.nocobase.com/data-source-manager-main-NocoBase-04-29-2026_04_52_PM.png)

Ao criar o campo, escolha o tipo "Divisão administrativa da China". É possível configurar:

| Opção | Descrição |
| --- | --- |
| Nível selecionável | Controla até qual nível pode ser selecionado. Atualmente são suportados "Província", "Cidade" e "Distrito"; o padrão é "Distrito". "Bairro" e "Vila" aparecem desabilitados na UI. |
| Exigir seleção até o último nível | Quando marcada, o usuário precisa selecionar até o nível mais profundo configurado para enviar; quando desmarcada, é possível concluir a seleção em um nível intermediário. |

## Uso na UI

No formulário, o campo aparece como um seletor em cascata:

1. Ao abrir o dropdown, os dados de província são carregados.
2. Ao expandir uma província, as cidades correspondentes são carregadas sob demanda.
3. Ao continuar expandindo uma cidade, os distritos são carregados sob demanda.
4. Após salvar, em telas de detalhe, tabela e similares, o valor é exibido como `Província/Cidade/Distrito`.

O campo aceita as configurações comuns de formulário, como título, descrição, obrigatoriedade, valor padrão e modo somente leitura. No modo de leitura, o valor é exibido como caminho de texto, por exemplo:

```text
Pequim / Distritos municipais / Dongcheng
```

![](https://static-docs.nocobase.com/%E7%9C%81%E5%B8%82%E5%8C%BA-04-29-2026_04_54_PM.png)

## Atenção

- Atualmente, o campo de divisão administrativa da China suporta apenas a seleção de um único caminho; não há suporte a múltipla seleção.
- Os dados embutidos e habilitados são apenas os três níveis província/cidade/distrito; bairro e vila ainda não estão disponíveis.
- Na importação, é necessário usar nomes idênticos aos da base interna de divisão administrativa, separando os níveis por `/`.
- O campo depende da tabela `chinaRegions` fornecida pelo Plugin. Confirme que o Plugin "Divisão administrativa da China" está habilitado.
