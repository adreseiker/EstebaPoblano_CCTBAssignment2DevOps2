// E2E: formulario incompleto debe mostrar #error
require('chromedriver');
const {Builder, By, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

(async () => {
  const TESTING_URL = process.env.TESTING_URL || 'http://<TESTING-IP>/';
  const options = new chrome.Options().addArguments(
    '--headless=new', '--no-sandbox', '--disable-dev-shm-usage'
  );

  let driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  try {
    await driver.get(TESTING_URL);

    // Dejamos email vacío para provocar validación
    await driver.findElement(By.id('name')).sendKeys('John');
    await driver.findElement(By.id('role')).sendKeys('Coach');
    await driver.findElement(By.id('submit-btn')).click();

    await driver.wait(until.elementLocated(By.id('error')), 5000);
    const isHidden = await driver.findElement(By.id('error')).getAttribute('hidden');
    if (isHidden === null || isHidden === false || isHidden === 'false') {
      console.log('OK: error shown');
      process.exit(0);
    } else {
      console.error('FAIL: #error is hidden');
      process.exit(1);
    }
  } catch (err) {
    console.error('FAIL:', err.message);
    process.exit(1);
  } finally {
    await driver.quit();
  }
})();
