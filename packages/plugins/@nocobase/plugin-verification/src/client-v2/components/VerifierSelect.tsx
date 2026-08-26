/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RemoteSelect } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { Typography } from 'antd';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useT, useVerificationTranslation } from '../locale';

export interface VerifierSelectProps {
  /**
   * Verification scene name passed to `verifiers:listByScene`. Each
   * consumer plugin uses its own scene (e.g. `auth-sms`, `two-factor`,
   * `unbind-verifier`) so different scenes can opt different verifier
   * types in or out via server config.
   */
  scene: string;
  value?: string | string[];
  onChange?: (next: string | string[]) => void;
  /** Default false. */
  multiple?: boolean;
  placeholder?: string;
  disabled?: boolean;
  /**
   * antd `Select` style passthrough. Keep this open in case a caller
   * needs to size the dropdown explicitly inside a constrained form.
   */
  style?: React.CSSProperties;
  /**
   * Suppress the helper text rendered under the Select. Defaults to
   * `false`; pass `true` when the caller wants to host its own hint
   * (e.g. inside a `Form.Item.extra` slot).
   */
  hideHint?: boolean;
}

type VerifierItem = { name: string; title: string };
type VerifiersListResponse = {
  verifiers?: VerifierItem[];
  availableTypes?: Array<{ name: string; title?: string }>;
};

/**
 * Domain wrapper around the framework-level `RemoteSelect`. Loads the
 * verifiers configured for `scene` from `/verifiers:listByScene` and
 * binds them to a single- or multi-select. The helper text underneath
 * mirrors the v1 affordance: a list of available verifier types and a
 * deep link into the admin settings page. The list of available types
 * comes from the same response, so no extra request is needed.
 */
export function VerifierSelect(props: VerifierSelectProps) {
  const { scene, value, onChange, multiple, placeholder, disabled, style, hideHint } = props;
  const { t } = useVerificationTranslation();
  const compileT = useT();
  const ctx = useFlowContext();

  const cacheKey = useMemo(() => `@nocobase/plugin-verification:verifiers:listByScene:${scene}`, [scene]);

  const [availableTypeNames, setAvailableTypeNames] = useState<string[]>([]);

  return (
    <>
      <RemoteSelect<VerifierItem, VerifiersListResponse, string | string[]>
        request={async () => {
          const response = await ctx.api.resource('verifiers').listByScene({ scene });
          return (response?.data?.data ?? {}) as VerifiersListResponse;
        }}
        selectItems={(resp) => resp?.verifiers || []}
        onLoaded={(_, resp) => {
          setAvailableTypeNames((resp?.availableTypes || []).map((item) => compileT(item.title || item.name)));
        }}
        cacheKey={cacheKey}
        refreshDeps={[scene]}
        // Server titles can arrive as legacy `{{t("…")}}` Schema templates;
        // useT() compiles them via flowEngine.context.t.
        mapOptions={(item) => ({ label: compileT(item.title || item.name), value: item.name })}
        mode={multiple ? 'multiple' : undefined}
        value={value as any}
        onChange={onChange as any}
        placeholder={placeholder}
        disabled={disabled}
        style={style}
      />
      {hideHint ? null : (
        <Typography.Text type="secondary">
          {t('The following types of verifiers are available:')} {availableTypeNames.join(', ')}
          {'. '}
          {t('Go to')} <Link to="/admin/settings/verification">{t('create verifiers')}</Link>
        </Typography.Text>
      )}
    </>
  );
}

export default VerifierSelect;
