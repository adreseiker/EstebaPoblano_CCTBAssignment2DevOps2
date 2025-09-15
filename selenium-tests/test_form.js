// E2E: formulario correcto debe mostrar #success
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

    await driver.findElement(By.id('name')).sendKeys('Jane Doe');
    await driver.findElement(By.id('email')).sendKeys('jane@example.com');
    await driver.findElement(By.id('role')).sendKeys('Player');
    await driver.findElement(By.id('submit-btn')).click();

    await driver.wait(until.elementLocated(By.id('success')), 5000);
    const isHidden = await driver.findElement(By.id('success')).getAttribute('hidden');
    if (isHidden === null || isHidden === false || isHidden === 'false') {
      console.log('OK: success shown');
      process.exit(0);
    } else {
      console.error('FAIL: #success is hidden');
      process.exit(1);
    }
  } catch (err) {
    console.error('FAIL:', err.message);
    process.exit(1);
  } finally {
    await driver.quit();
  }
})();
