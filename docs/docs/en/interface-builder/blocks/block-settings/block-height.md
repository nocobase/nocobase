# Block Height

## Introduction

Block height supports three modes: **Default height**, **Specified height**, and **Full height**. Most blocks support height settings.

![20260211153947](https://static-docs.nocobase.com/20260211153947.png)

![20260211154020](https://static-docs.nocobase.com/20260211154020.png)

## Height Modes

### Default Height

The default height strategy varies for different types of blocks. For example, Table and Form blocks will automatically adapt their height based on the content, and no scrollbars will appear inside the block.

### Specified Height

You can manually specify the total height of the block's outer frame. The block will automatically calculate and allocate the available height internally.

![20260211154043](https://static-docs.nocobase.com/20260211154043.gif)

### Full Height

Full height mode is similar to specified height, but the block height is calculated based on the current browser **viewport** to achieve the maximum full-screen height. No scrollbars will appear on the browser page; scrollbars will only appear inside the block.

Internal scroll handling in full height mode differs slightly across blocks:

- **Table**: Internal scrolling within `tbody`;
- **Form / Details**: Internal scrolling within the Grid (content scrolling excluding the action area);
- **List / Grid Card**: Internal scrolling within the Grid (content scrolling excluding the action area and pagination bar);
- **Map / Calendar**: Overall adaptive height, no scrollbars;
- **Iframe / Markdown**: Limits the total height of the block frame, with scrollbars appearing inside the block.

#### Full Height Table

![20260211154204](https://static-docs.nocobase.com/20260211154204.gif)

#### Full Height Form

![20260211154335](https://static-docs.nocobase.com/20260211154335.gif)