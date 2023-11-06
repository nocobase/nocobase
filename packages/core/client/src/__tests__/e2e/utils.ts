//颜色值的近似比较，而不是精确比较
function approximateColor(actualColor, expectedColor) {
  const regex = /rgba?\((\d+), (\d+), (\d+)(?:, ([0-9.]+))?\)/;
  const actualMatch = actualColor.match(regex);
  const expectedMatch = expectedColor.match(regex);

  if (actualMatch && expectedMatch) {
    const tolerance = 2; // 允许的颜色分量误差
    for (let i = 1; i <= 4; i++) {
      const actualValue = parseInt(actualMatch[i], 10);
      const expectedValue = parseInt(expectedMatch[i], 10);
      if (Math.abs(actualValue - expectedValue) > tolerance) {
        return false;
      }
    }
    return true;
  }

  return false;
}

async function waitForModalToBeHidden(page) {
  await page.waitForFunction(() => {
    const modal = document.querySelector('.ant-modal');
    if (modal) {
      const computedStyle = window.getComputedStyle(modal);
      return computedStyle.display === 'none' || computedStyle.visibility === 'hidden';
    }
    return true; // 如果找不到modal，也算作不可见
  });
}

export { approximateColor, waitForModalToBeHidden };
