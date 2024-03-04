export const generatePassword = (length = 10) => {
  const uppercaseLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseLetters = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialCharacters = '!#$%^&*-_+=';

  // Combine all character sets
  const allCharacters = uppercaseLetters + lowercaseLetters + numbers + specialCharacters;

  const passwordArray = new Uint32Array(length);
  crypto.getRandomValues(passwordArray);

  // Ensure at least one character from each character set
  let password = '';
  password += uppercaseLetters.charAt(passwordArray[0] % uppercaseLetters.length);
  password += lowercaseLetters.charAt(passwordArray[1] % lowercaseLetters.length);
  password += numbers.charAt(passwordArray[2] % numbers.length);
  password += specialCharacters.charAt(passwordArray[3] % specialCharacters.length);

  // Fill the rest of the password with random characters
  for (let i = 4; i < length; i++) {
    const randomIndex = passwordArray[i] % allCharacters.length;
    password += allCharacters.charAt(randomIndex);
  }

  // Shuffle the password characters to ensure randomness
  password =
    password[0] +
    password
      .slice(1)
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');

  return password;
};
