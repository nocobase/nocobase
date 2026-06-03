/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const generatePassword = (length = 10) => {
  const uppercaseLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseLetters = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialCharacters = '!#$%^&*-_+=';

  const allCharacters = uppercaseLetters + lowercaseLetters + numbers + specialCharacters;

  const passwordArray = new Uint32Array(length);
  crypto.getRandomValues(passwordArray);

  let password = '';
  password += uppercaseLetters.charAt(passwordArray[0] % uppercaseLetters.length);
  password += lowercaseLetters.charAt(passwordArray[1] % lowercaseLetters.length);
  password += numbers.charAt(passwordArray[2] % numbers.length);
  password += specialCharacters.charAt(passwordArray[3] % specialCharacters.length);

  for (let i = 4; i < length; i++) {
    const randomIndex = passwordArray[i] % allCharacters.length;
    password += allCharacters.charAt(randomIndex);
  }

  password =
    password[0] +
    password
      .slice(1)
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');

  return password;
};
