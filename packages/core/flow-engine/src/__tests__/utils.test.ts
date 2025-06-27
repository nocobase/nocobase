/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TranslationUtil } from '../utils';

describe('TranslationUtil', () => {
  let translationUtil: TranslationUtil;
  let mockTranslator: (key: string, options?: any) => string;

  beforeEach(() => {
    translationUtil = new TranslationUtil();
    mockTranslator = (key: string, options?: any) => {
      // 简单的模拟翻译函数
      if (options?.name) {
        return key.replace('{name}', options.name);
      }
      return `translated_${key}`;
    };
  });

  describe('translate', () => {
    it('should handle simple translation', () => {
      const result = translationUtil.translate('Hello World', mockTranslator);
      expect(result).toBe('translated_Hello World');
    });

    it('should handle translation with options', () => {
      const result = translationUtil.translate('Hello {name}', mockTranslator, { name: 'John' });
      expect(result).toBe('Hello John');
    });

    it('should handle template compilation with single quotes', () => {
      const template = "{{t('Hello World')}}";
      const result = translationUtil.translate(template, mockTranslator);
      expect(result).toBe('translated_Hello World');
    });

    it('should handle template compilation with double quotes', () => {
      const template = '{{t("User Name")}}';
      const result = translationUtil.translate(template, mockTranslator);
      expect(result).toBe('translated_User Name');
    });

    it('should handle template compilation with backticks', () => {
      const template = '{{t(`Email`)}}';
      const result = translationUtil.translate(template, mockTranslator);
      expect(result).toBe('translated_Email');
    });

    it('should handle template with options', () => {
      const template = '{{t(\'Hello {name}\', {"name": "John"})}}';
      const result = translationUtil.translate(template, mockTranslator);
      expect(result).toBe('Hello John');
    });

    it('should handle template with whitespace', () => {
      const template = "{{  t  (  'User Name'  )  }}";
      const result = translationUtil.translate(template, mockTranslator);
      expect(result).toBe('translated_User Name');
    });

    it('should handle mixed content', () => {
      const template = "前缀 {{t('User Name')}} 后缀";
      const result = translationUtil.translate(template, mockTranslator);
      expect(result).toBe('前缀 translated_User Name 后缀');
    });

    it('should handle multiple templates', () => {
      const template = "{{t('Hello')}} {{t('World')}}";
      const result = translationUtil.translate(template, mockTranslator);
      expect(result).toBe('translated_Hello translated_World');
    });

    it('should handle invalid template gracefully', () => {
      const template = "{{t('unclosed quote)}}";
      const result = translationUtil.translate(template, mockTranslator);
      // 由于模板格式不匹配，会被当作普通字符串翻译
      expect(result).toBe("translated_{{t('unclosed quote)}}");
    });

    it('should return original value for non-string input', () => {
      const result = translationUtil.translate(null as any, mockTranslator);
      expect(result).toBe(null);
    });

    it('should return empty string for empty input', () => {
      const result = translationUtil.translate('', mockTranslator);
      expect(result).toBe('');
    });
  });

  describe('caching', () => {
    it('should cache template results', () => {
      const template = "{{t('Hello World')}}";

      // 第一次调用
      const result1 = translationUtil.translate(template, mockTranslator);
      expect(result1).toBe('translated_Hello World');
      expect(translationUtil.getCacheSize()).toBe(1);

      // 第二次调用应该使用缓存
      const result2 = translationUtil.translate(template, mockTranslator);
      expect(result2).toBe('translated_Hello World');
      expect(translationUtil.getCacheSize()).toBe(1);
    });

    it('should not cache simple translations', () => {
      const result1 = translationUtil.translate('Hello World', mockTranslator);
      expect(result1).toBe('translated_Hello World');
      expect(translationUtil.getCacheSize()).toBe(0);
    });

    it('should clear cache', () => {
      const template = "{{t('Hello World')}}";
      translationUtil.translate(template, mockTranslator);
      expect(translationUtil.getCacheSize()).toBe(1);

      translationUtil.clearCache();
      expect(translationUtil.getCacheSize()).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle translator function errors', () => {
      const errorTranslator = () => {
        throw new Error('Translation error');
      };

      const template = "{{t('Hello World')}}";
      const result = translationUtil.translate(template, errorTranslator);
      // 应该返回原始模板而不是抛出错误
      expect(result).toBe("{{t('Hello World')}}");
    });

    it('should handle invalid JSON options', () => {
      const template = "{{t('Hello', invalid json)}}";
      const result = translationUtil.translate(template, mockTranslator);
      // JSON 解析失败，但仍会调用翻译器，只是没有 options
      expect(result).toBe('translated_Hello');
    });
  });
});
