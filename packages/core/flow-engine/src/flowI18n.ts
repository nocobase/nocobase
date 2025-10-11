/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export class FlowI18n {
  constructor(protected context) {}

  /**
   * 翻译函数，支持简单翻译和模板编译
   * @param keyOrTemplate 翻译键或包含 {{t('key', options)}} 的模板字符串
   * @param options 翻译选项（如命名空间、参数等）
   * @returns 翻译后的文本
   *
   * @example
   * // 简单翻译
   * flowEngine.t('Hello World')
   * flowEngine.t('Hello {name}', { name: 'John' })
   *
   * // 模板编译
   * flowEngine.t("{{t('Hello World')}}")
   * flowEngine.t("{{ t( 'User Name' ) }}")
   * flowEngine.t("{{  t  (  'Email'  ,  { ns: 'fields' }  )  }}")
   * flowEngine.t("前缀 {{ t('User Name') }} 后缀")
   * flowEngine.t("{{t('Hello {name}', {name: 'John'})}}")
   */
  public translate(keyOrTemplate: string, options?: any): string {
    if (!keyOrTemplate || typeof keyOrTemplate !== 'string') {
      return keyOrTemplate;
    }

    // 先尝试一次翻译
    let result = this.translateKey(keyOrTemplate, options);

    // 检查翻译结果是否包含模板语法，如果有则进行模板编译
    if (this.isTemplate(result)) {
      result = this.compileTemplate(result);
    }

    return result;
  }

  /**
   * 内部翻译方法
   * @private
   */
  private translateKey(key: string, options?: any): string {
    if (this.context?.i18n?.t) {
      return this.context.i18n.t(key, options);
    }
    // 如果没有翻译函数，返回原始键值
    return key;
  }

  /**
   * 检查字符串是否包含模板语法
   * @private
   */
  private isTemplate(str: string): boolean {
    return /\{\{\s*t\s*\(\s*["'`].*?["'`]\s*(?:,\s*.*?)?\s*\)\s*\}\}/g.test(str);
  }

  /**
   * 编译模板字符串
   * @private
   */
  private compileTemplate(template: string): string {
    return template.replace(
      /\{\{\s*t\s*\(\s*["'`](.*?)["'`]\s*(?:,\s*((?:[^{}]|\{[^}]*\})*?))?\s*\)\s*\}\}/g,
      (match, key, optionsStr) => {
        try {
          let templateOptions = {};
          if (optionsStr) {
            optionsStr = optionsStr.trim();
            if (optionsStr.startsWith('{') && optionsStr.endsWith('}')) {
              // 使用受限的 Function 构造器解析
              try {
                templateOptions = new Function('$root', `with($root) { return (${optionsStr}); }`)({});
              } catch (parseError) {
                return match;
              }
            }
          }
          return this.translateKey(key, templateOptions);
        } catch (error) {
          console.warn(`FlowEngine: Failed to compile template "${match}":`, error);
          return match;
        }
      },
    );
  }
}
