// 외부 라이브러리
const { Builder, Browser, By, Key, until } = require("selenium-webdriver");
const path = require("path");
const fs = require("fs");
const Tesseract = require("tesseract.js");

// -------------------------
// 실행시키기 전에 입력할 정보 확인
// -------------------------
const year = 2023; // yyyy
const month = 10; // mm
const day = 16; // dd

// section
// 1 : 6시 ~ 8시
// 2 : 8시 ~ 10시
// 3 : 10시 ~ 12시
// 4 : 12시 ~ 14시
// 5 : 14시 ~ 16시
// 6 : 16시 ~ 18시
// 7 : 18시 ~ 20시
// 8 : 20시 ~ 22시
const section = 4;

const groupName = "FC가운";
const numUsers = 12;
const phoneNumber = "01012345678";
const address1 = "미사강변중앙로 90";
const address2 = "111-1234";
const refFile = "/Users/sgoh/Pictures/photo.jpeg"; //file path

const URL_TENIS1 = `https://www.hanam.go.kr/www/selectMisaParkResveWeb.do?key=7465&misaParkCode=TS01&searchCategoryCode=B1&searchResveDate=${year}${month}${day}&yyyymm=${year}${month}`;

(async function run() {
  try {
    // 드라이버 생성, url 오픈 (예약사이트로 이동함)
    const driver = await new Builder().forBrowser(Browser.CHROME).build();
    await driver.get(URL_TENIS1);
    console.log("success : opened site");

    // 로그인이 안되어있을 경우 로그인 요청
    const login = await driver
      .findElement(By.css(".link_item .user_anchor"))
      .getText();

    if (login === "로그인") {
      await driver.findElement(By.css(".link_item .user_anchor")).click();
    }
    // 사용자가 로그인을 완료할 때까지 기다림.
    await driver.wait(until.urlContains("selectMisaParkResveWeb"));
    console.log("success : user logged in");

    // 예약 오픈 시간까지 기다림.
    waitforOpenTime();

    // 팝업 닫기
    await closePopups(driver);
    console.log("success : closed popups");

    // 예약하기 버튼 클릭
    await driver
      .findElement(
        By.xpath(`//tbody[@id='dynamicTbody']/tr[${section}]/td[3]/a`)
      )
      .click();

    // 예약 페이지로 이동할 때까지 대기
    await driver.wait(until.urlContains("addMisaParkResveView"));
    console.log("success : page is changed");

    // 예약 필수정보 입력
    await driver.findElement(By.id("grpNm")).sendKeys(groupName);
    await driver.findElement(By.id("nmpr")).sendKeys(numUsers);
    await driver.findElement(By.id("moblphon")).sendKeys(phoneNumber);
    console.log("success : put basic info");

    // 주소입력
    const originalWindow = await driver.getWindowHandle();
    await driver.findElement(By.linkText("우편번호")).click();
    await driver.wait(
      async () => (await driver.getAllWindowHandles()).length === 2,
      10000
    );
    //Loop through until we find a new window handle
    const windows = await driver.getAllWindowHandles();
    windows.forEach(async (handle) => {
      if (handle !== originalWindow) {
        await driver.switchTo().window(handle);
      }
    });
    await driver.findElement(By.id("keyword")).sendKeys(address1);
    await driver.findElement(By.css(".wrap > input:nth-child(2)")).click(); // 검색
    await driver.manage().setTimeouts({ implicit: 1000 });

    // (중요!!) 본인 주소가 몇번째에 나오는지 알아야함.
    await driver.findElement(By.css("#roadAddrDiv1 > b")).click(); // 첫 번째 나올 경우 #roadAddrDiv1, 두번 째 나올 경우 #roadAddrDiv2 ...

    await driver.findElement(By.id("rtAddrDetail")).sendKeys(address2);
    await driver.findElement(By.linkText("주소입력")).click();

    console.log("success : put address");

    await driver.switchTo().window(windows[0]);
    await driver.findElement(By.id("THUMB")).sendKeys(refFile);
    console.log("success : uploaded reference file");

    const screenshot = await driver
      .findElement(By.css("#catpcha > img"))
      .takeScreenshot(true);

    console.log("success : take screenshot");
    fs.writeFileSync("./tmpcaptcha.png", screenshot, "base64");
    console.log("success : saved screenshot");

    // 보안 문자 입력부분이지만 현재 정상동작하고있지 않음. 추후에 업데이트 필요함.
    const recognizedString = await Tesseract.recognize("./tmpcaptcha.png");
    console.log(recognizedString.data.text);
    await driver.findElement(By.css("#catpcha > input")).click();
    // .sendKeys(recognizedString.data.text);

    console.log("success : put captcha");

    // const yearMonth = await driver
    //   .findElement(By.className("date_now"))
    //   .getText();
    // // await console.log(yearMonth);
    // await driver.findElement(By.className("date_next")).takeScreenshot();

    // const day = await driver.findElement(By.className("button.day"));
    await driver.wait(until.urlContains("selectMisaParkResveWeb"));
  } finally {
    await driver.quit();
  }
})();

async function closePopups(driver) {
  if (await driver.findElement(By.id("divpopup3")).isDisplayed()) {
    await driver.findElement(By.css("#chkbox3")).click();
    await driver.findElement(By.css("#divpopup3 .divpopup_form img")).click();
  }
  if (await driver.findElement(By.id("divpopup6")).isDisplayed()) {
    await driver.findElement(By.css("#chkbox6")).click();
    await driver.findElement(By.css("#divpopup6 .divpopup_form img")).click();
  }
}

function waitforOpenTime() {
  while (true) {
    const date = new Date();
    const hh = date.getHours();
    const mm = date.getMinutes();
    if (hh >= 9) {
      return;
    }
  }
}
// const photo = path.join(__dirname, "./photo.jpeg");

// console.log(photo);

// (async function test() {
//   const driver = await new Builder().forBrowser(Browser.CHROME).build();
//   await driver.get("https://icoconvert.com/");
//   await driver.findElement(By.id("localimg")).sendKeys(photo);
// })();

//

// const photo = path.join(__dirname, "./captchar.jpeg");

// Tesseract.recognize(photo).then(({ data: { text } }) => {
//   console.log(text);
// });
