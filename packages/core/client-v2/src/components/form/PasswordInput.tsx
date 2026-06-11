/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Input, type InputProps } from 'antd';
import type { PasswordProps as AntdPasswordProps } from 'antd/es/input';
import React from 'react';

// --- Strength scoring -------------------------------------------------------
// Pure scoring function ported from the v1 client's password utils. Returns a
// bucketed score in `[20, 40, 60, 80, 100]` based on character-class diversity,
// length, repeated / sequential / consecutive character penalties, and a
// "middle non-letter / non-symbol" bonus. No external dependencies — safe to
// run on any string.
//
// Kept private to this module on purpose. Callers consume the visual strength
// bar via `<PasswordInput checkStrength>`; they shouldn't need to compute the
// raw score themselves.

const isNum = (c: number) => c >= 48 && c <= 57;
const isLower = (c: number) => c >= 97 && c <= 122;
const isUpper = (c: number) => c >= 65 && c <= 90;
const isSymbol = (c: number) => !(isLower(c) || isUpper(c) || isNum(c));
const isLetter = (c: number) => isLower(c) || isUpper(c);

function getStrength(val: string): number {
  if (!val) return 0;
  let num = 0;
  let lower = 0;
  let upper = 0;
  let symbol = 0;
  let MNS = 0;
  let rep = 0;
  let repC = 0;
  let consecutive = 0;
  let sequential = 0;
  const len = () => num + lower + upper + symbol;
  const callMe = () => {
    let re = num > 0 ? 1 : 0;
    re += lower > 0 ? 1 : 0;
    re += upper > 0 ? 1 : 0;
    re += symbol > 0 ? 1 : 0;
    return re > 2 && len() >= 8 ? re + 1 : 0;
  };
  for (let i = 0; i < val.length; i++) {
    const c = val.charCodeAt(i);
    if (isNum(c)) {
      num++;
      if (i !== 0 && i !== val.length - 1) MNS++;
      if (i > 0 && isNum(val.charCodeAt(i - 1))) consecutive++;
    } else if (isLower(c)) {
      lower++;
      if (i > 0 && isLower(val.charCodeAt(i - 1))) consecutive++;
    } else if (isUpper(c)) {
      upper++;
      if (i > 0 && isUpper(val.charCodeAt(i - 1))) consecutive++;
    } else {
      symbol++;
      if (i !== 0 && i !== val.length - 1) MNS++;
    }
    let exists = false;
    for (let j = 0; j < val.length; j++) {
      if (val[i] === val[j] && i !== j) {
        exists = true;
        repC += Math.abs(val.length / (j - i));
      }
    }
    if (exists) {
      rep++;
      const unique = val.length - rep;
      repC = unique ? Math.ceil(repC / unique) : Math.ceil(repC);
    }
    if (i > 1) {
      const last1 = val.charCodeAt(i - 1);
      const last2 = val.charCodeAt(i - 2);
      if (isLetter(c)) {
        if (isLetter(last1) && isLetter(last2)) {
          const v = val.toLowerCase();
          const vi = v.charCodeAt(i);
          const vi1 = v.charCodeAt(i - 1);
          const vi2 = v.charCodeAt(i - 2);
          if (vi - vi1 === vi1 - vi2 && Math.abs(vi - vi1) === 1) sequential++;
        }
      } else if (isNum(c)) {
        if (isNum(last1) && isNum(last2)) {
          if (c - last1 === last1 - last2 && Math.abs(c - last1) === 1) sequential++;
        }
      } else if (isSymbol(last1) && isSymbol(last2)) {
        if (c - last1 === last1 - last2 && Math.abs(c - last1) === 1) sequential++;
      }
    }
  }
  let sum = 0;
  const length = len();
  sum += 4 * length;
  if (lower > 0) sum += 2 * (length - lower);
  if (upper > 0) sum += 2 * (length - upper);
  if (num !== length) sum += 4 * num;
  sum += 6 * symbol;
  sum += 2 * MNS;
  sum += 2 * callMe();
  if (length === lower + upper) sum -= length;
  if (length === num) sum -= num;
  sum -= repC;
  sum -= 2 * consecutive;
  sum -= 3 * sequential;
  sum = Math.max(0, Math.min(100, sum));

  if (sum >= 80) return 100;
  if (sum >= 60) return 80;
  if (sum >= 40) return 60;
  if (sum >= 20) return 40;
  return 20;
}

// --- Strength bar UI --------------------------------------------------------
// Colours and pixel sizes are intentionally kept identical to v1's
// `PasswordStrength` so the visual remains unchanged across the v1 → v2
// migration. When the design system formalises tokens for "strength signal"
// colours, swap these literals for the matching token expressions.

const segmentDividerStyle: React.CSSProperties = {
  position: 'absolute',
  zIndex: 1,
  height: 8,
  top: 0,
  background: '#fff',
  width: 1,
  transform: 'translate(-50%, 0)',
};

function StrengthBar({ score }: { score: number }) {
  return (
    <div
      style={{
        background: '#e0e0e0',
        marginBottom: 3,
        position: 'relative',
      }}
    >
      {/* Four white dividers split the bar into five strength brackets that
          line up with the bucketed scoring in `getStrength`. */}
      <div style={{ ...segmentDividerStyle, left: '20%' }} />
      <div style={{ ...segmentDividerStyle, left: '40%' }} />
      <div style={{ ...segmentDividerStyle, left: '60%' }} />
      <div style={{ ...segmentDividerStyle, left: '80%' }} />
      {/* The full gradient is always laid down, then `clip-path` trims it back
          to the current score percentage — gives a smooth fill animation on
          value change without re-painting the gradient on every render. */}
      <div
        style={{
          position: 'relative',
          backgroundImage: '-webkit-linear-gradient(left, #ff5500, #ff9300)',
          transition: 'all 0.35s ease-in-out',
          height: 8,
          width: '100%',
          marginTop: 5,
          clipPath: `polygon(0 0,${score}% 0,${score}% 100%,0 100%)`,
        }}
      />
    </div>
  );
}

// --- Public component -------------------------------------------------------

export interface PasswordInputProps extends AntdPasswordProps {
  /**
   * Render a visual strength bar beneath the input. Defaults to `false`. The
   * score is computed locally — opting in does NOT add any form validation;
   * use a separate `Form.Item.rules` entry for that (or wire the entry up to
   * a cross-plugin password-validator extension point if your project
   * provides one).
   */
  checkStrength?: boolean;
}

/**
 * `Input.Password` plus an optional strength meter, ported from the v1
 * `Password` component. The strength scoring and bar UI are identical to v1,
 * so users who switch from a v1 page to a v2 page see the same visual signal.
 *
 * The component is value-shape compatible with antd `Input.Password` — drop
 * it into any existing `Form.Item<password>` and toggle the meter with
 * `checkStrength`.
 *
 * Caveats:
 *
 * - Strength scoring is purely a UX hint, not validation. Submitting a weak
 *   password is still allowed unless the server (or a separately installed
 *   password-policy plugin) rejects it.
 * - The meter swallows the gap between `<Input.Password>` and the next form
 *   element. If your `Form.Item` already adds vertical rhythm, the meter
 *   inherits it; no extra spacing is added.
 */
export function PasswordInput(props: PasswordInputProps) {
  const { value, checkStrength, ...rest } = props;
  return (
    <span>
      <Input.Password {...(rest as InputProps)} value={value} />
      {checkStrength ? <StrengthBar score={getStrength(String(value || ''))} /> : null}
    </span>
  );
}

export default PasswordInput;
