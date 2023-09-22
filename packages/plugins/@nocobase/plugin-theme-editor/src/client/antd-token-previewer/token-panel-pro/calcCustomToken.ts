import { TinyColor } from '@ctrl/tinycolor';

const calcCustomToken = (name: string, value: any) => {
  if (name === 'colorSettings') {
    const color = new TinyColor(value);
    return {
      colorSettings: value,
      colorBgSettingsHover: color.setAlpha(0.06).toHex8String(),
      colorBorderSettingsHover: color.setAlpha(0.3).toHex8String(),
    };
  }

  return {
    [name]: value,
  };
};

export default calcCustomToken;
