var webdriver = require('selenium-webdriver'),
  By = webdriver.By,
  until = webdriver.until

var driver = new webdriver.Builder()
  .forBrowser('chrome')
  .build()

driver.get('http://www.google.com')
driver.findElement(By.id('lst-ib')).sendKeys('hahaha')
driver.findElement(By.name('btnK')).click()

driver.quit()
