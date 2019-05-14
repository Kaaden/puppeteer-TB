const express = require('express'), app = express(),
    bodyParser = require('body-parser'), service = require('./service'),
    urlencodedParser = bodyParser.urlencoded({ extended: true });
let browser;
let page;
(async () => {
    const puppeteer = require('puppeteer');
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    page = await browser.newPage();
})()

app.use(bodyParser.json());
//设置允许跨域 以及样式加载ContentType属性指定响应的 HTTP内容类型
app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS');
    next();
});
app.get("/", function (req, res) {
    res.send('Hello World!')
})
app.post("/fetchtb", urlencodedParser, function (req, res) {
    const pageUrl = req.body.url;
    if (pageUrl) {

        (async () => {
            const url = service.changeUrl(pageUrl)
            try {
                await page.setJavaScriptEnabled(true);
                await page.goto(url);
            } catch (error) {
                service.resJosn({
                    error: true,
                    data: ""
                }, res)

                return
            }

            let objItem = ""
            let error = false
            const content = await page.content()
            if (url.includes("detail.m.tmall.com")) {
                try {
                    objItem = await service.findTianMao(content,pageUrl)
                    error = false
                } catch (error) {
                    error = true
                }
            } else {
                try {
                    objItem = await service.findTaobao(page, content, pageUrl)
                    error = false
                } catch (err) {
                    error = true
                }
            }
            const data = {
                error,
                data: objItem
            }

            service.resJosn(data, res)
        })();
    }
});

const server = app.listen(8009, function () {
    const host = server.address().address;
    const port = server.address().port;
    console.log(host)
    console.log('success', host, port);
});
