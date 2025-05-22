//maybeJQ语法好用些（？
const https = require("https");
const fs = require("fs");
const puppeteer = require("puppeteer");
const axios = require("axios");
axios.withCredentials = true;
const { JSDOM } = require('jsdom');
const { text } = require("stream/consumers");
const express = require("express");
// const cors = require('cors');

const MAX_ID = 1000000;

function downLoadPage(url) {// 下载网页(包括script标签)
    https.get(url, (page) => {
        let data = "";// 你说得对但是let省空间
        page.setEncoding("utf8"); // 据说utf-16可以处理emoji(
    
        page.on("data", (chunk) => {
            data += chunk;
        });
    
        page.on("end", () => {
            console.log("加载完成，html预览:\n " + data);
            const titleMatch = data.match(/<title>(.*?)<\/title>/i);
            let fileName = "爬取的HTML文件.html";
    
            if (titleMatch && titleMatch[1]) {
                fileName = titleMatch[1]
                    .replace(`/[\\/:*?"<>|]/g`, '')
                    .trim() + ".html";
            }
    
            fs.writeFile(fileName, data, (error) => {
                if (error) {
                    console.error(`写入文件时出错: ${error}`);
                }
                else {
                    console.log(`数据已成功保存到 ${fileName} 文件中`);
                }
            });
        });
    
    }).on("error", (error) => {
        console.error(`请求出错: ${error}`);
    });
}

async function inputOfXMWuserWordBank(sender = {senderUser, senderPaw}, id = [], inputText, sendMod, data = {showUser: false, showDate: false}, showBrowser = false) {
    console.log("初始化...\n");
    
    // 发送者账号
    const senderUser = sender.senderUser;
    const senderPaw = sender.senderPaw;

    let lastString;
    const len = (sendMod === "all"?MAX_ID:id.length);

    const inputSpeed = 0;// 输入时额外间隔时间
    const stopTime = 0;// 每一次操作间隔时间
    
    const browser = await puppeteer.launch({
        headless: !showBrowser,
        slowMo: stopTime,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-gpu"
        ]
    });
    const page = await browser.newPage();

    let url = "https://world.xiaomawang.com/w/index";
    await page.goto(url);

    // 登录
    console.log("登录中...");

    const loginButton = "a[data-type='login']";
    await page.waitForSelector(loginButton);
    await page.click(loginButton);
    const userInput = "input[type='tel']";
    const codeInput = "input[type='password']";
    const checkBox = "input[class='xmloginant-checkbox-input']";
    const loginTo = "#login";
    await page.waitForSelector(userInput);
    await page.waitForSelector(codeInput);
    await page.waitForSelector(loginTo);
    await page.type(userInput, senderUser, {delay: inputSpeed});
    await page.type(codeInput, senderPaw, {delay: inputSpeed});
    await page.click(checkBox);
    await page.click(loginTo);

    console.log("已登录\n")

    /*等待页面重载*/
    await page.waitForNavigation({waitUntil: "networkidle0"});
    
    /* 发送消息 */
    let userNickName, date;
    for(let i = 0; i < len; i++) {
        let oldTime = Date.now();
        let nowId = (sendMod === "all"?i + 1:id[i]);

        url = `https://world.xiaomawang.com/w/person/project/all/${nowId}`;
        console.log(`正在跳转至 ${url}`);
        
        await page.goto(url);

        const noId = await page.$eval("p", (p, targetText) => {
            return p.textContent.includes(targetText);
        }, "对不起，您要找的页面去火星了~~");

        if(noId) {
            console.log(`id ${nowId} 不存在(${i+1}/${len})\n`);
        }
        else {
            console.log("跳转完毕\n输入评论...")

            const today = new Date();
            let user = "div[class^='topheader__NickName-sc-']";
            await page.waitForSelector(user);
            let element = await page.$(user);
            userNickName =  await element.evaluate(el => el.textContent);
            date = `\n——${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;
            let text = `${(data.showUser?("@" + userNickName):"")}${inputText}${(data.showDate?date:"")}`;// 每一次的消息
            text = (text === lastString?`${text}​`:text);// 隐藏字符绕过不能重复提交评论限制
            lastString = text;
        
            const input = "textarea[class^='input-comment-inner__']";
            const button = "button[class^='able-btn__']";
            await page.waitForSelector(input);
            await page.waitForSelector(button);
            
            await page.type(input, text, {delay: inputSpeed});
            await page.click(button);
            
            await new Promise(resolve => setTimeout(resolve, 250));
            console.log(`对 @${userNickName} (id: ${nowId}) 操作完成, 用时${Date.now() - oldTime}ms\n(${i+1}/${len})\n`);
        }
    }

    console.log(`全部用户已操作完成(${len}/${len})`);

    await browser.close();
}

/* main */

// downLoadPage("https://world.xiaomawang.com/w/person/project/all/3972443");

// inputOfXMWuserWordBank(
//     {
//         senderUser: "13798126751",
//         senderPaw: "126751"
//     }, [
//         "3972443",
//     ], "💥", {showUser: true, showDate: true}, true);
const app = express();
const PORT = 8080;

// 中间件

app.use(express.json());
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
});
app.use(express.urlencoded({extended: true}));

// 处理POST请求
app.post("/api", (req, res) => {
    let data = req.body;
    console.log(`服务端已接受\n数据: ${data}\n正在执行...`);
    res.json({
        data: `服务端接受成功，数据：${data}`,
        originalData: data
    });
    inputOfXMWuserWordBank(
        {
            senderUser: data.senderUser,
            senderPaw: data.senderPaw,
        }, data.id, data.text, data.sendMod, {showUser: data.showUser, showDate: data.showDate}, true
    );
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`\n服务器启动成功！服务器地址：http://localhost:${PORT}\n请新建命令行并运行说明文档中提供的Bash脚本，此命令行将返回服务器响应，请勿关闭（若要关闭，请先按Ctrl+C关闭服务器）\n`);
});


process.on("SIGINT", function() {
    console.log(`\n服务器已关闭，你将无法访问: http://localhost:${PORT}\n`);
    process.exit(); // 确保退出程序
});