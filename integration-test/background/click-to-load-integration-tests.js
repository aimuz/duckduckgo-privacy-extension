const harness = require('../helpers/harness')

const testSite = 'https://privacy-test-pages.glitch.me/privacy-protections/click-to-load/'
let browser
let bgPage

// DISABLED due to perma failing
xdescribe('Test Click To Load', () => {
    beforeAll(async () => {
        ({ browser, bgPage } = await harness.setup())

        await bgPage.waitForFunction(
            () => {
                console.log('waiting for tds...')
                return window.dbg && window.dbg.tds && window.dbg.tds.ClickToLoadConfig
            },
            { polling: 100, timeout: 10000 }
        )
        // wait a little more for the social config to load
        await bgPage.waitForTimeout(3000)
    })

    afterAll(async () => {
        try {
            await harness.teardown(browser)
        } catch (e) {}
    })

    it('CTL: Should block FB requests by default', async () => {
        const page = await browser.newPage()

        try {
            await page.goto(testSite, { waitUntil: 'networkidle2', timeout: 10000 })
        } catch (e) {
            // timed out waiting for page to load, let's try running the test anyway
            console.log(`Timed out: ${e}`)
        }

        // give it little time just to be sure (facebook widgets can take time to load)
        await page.waitForTimeout(4000)
        const fbRequestData = await page.evaluate(() => {
            return {
                requests: document.getElementById('facebook_call_count').innerHTML,
                expectedCalls: document.getElementById('facebook_iFrames').innerHTML
            }
        })

        expect(Number(fbRequestData.requests)).toBeLessThanOrEqual(Number(fbRequestData.expectedCalls))

        try {
            await page.close()
        } catch (e) {}
    })

    it('CTL: Should load facebook elements on click', async () => {
        const page = await browser.newPage()

        try {
            await page.goto(testSite, { waitUntil: 'networkidle2', timeout: 10000 })
        } catch (e) {
            // timed out waiting for page to load, let's try running the test anyway
            console.log(`Timed out: ${e}`)
        }
        // give it little time just to be sure (facebook widgets can take time to load)
        await page.waitForTimeout(4000)

        const fbRequestDataBeforeClick = await page.evaluate(() => {
            return {
                requests: document.getElementById('facebook_call_count').innerHTML
            }
        })

        // click image element to trigger click to load
        page.click('div > div > div > button')

        await page.waitForTimeout(6000) // FB elements can take a while to load...

        const fbRequestDataAfterClick = await page.evaluate(() => {
            return {
                requests: document.getElementById('facebook_call_count').innerHTML
            }
        })

        expect(Number(fbRequestDataAfterClick.requests)).toBeGreaterThan(Number(fbRequestDataBeforeClick.requests))
    })
})
