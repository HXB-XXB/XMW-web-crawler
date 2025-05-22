let lastPaw;
let sendMod;

// 服务器端口
const PORT = 8080;

function forever() {
    let ipt = document.getElementById("senderPaw");
    if(ipt.value !== lastPaw) {
        ipt.value = ipt.value.replace(/[^a-zA-Z0-9 !@#$%^&*()_+\-=\[$\{};':"\\|,.<>\/?]/g, '');
        ipt.value = ipt.value.slice(0, 16);
        lastPaw = ipt.value;
        check();
    }
    setTimeout(forever, 100);
}

function check() {
    let error = document.getElementById("error");
    let run = document.getElementById("runButDiv");
    let flag = false;
    let pawLen = document.getElementById("senderPaw").value.length;
    if(document.getElementById("senderUser").value.length !== 11) {
        flag = true;
        error.textContent = "请输入11位手机号";
    }
    else if(pawLen < 6) {
        flag = true;
        error.textContent = "请输入6~16位的密码";
    }
    else if(document.getElementById("inputBox").value.length === 0) {
        flag = true;
        error.textContent = "请输入至少一个字符的待发送消息内容";
    }
    run.style.pointerEvents = (flag?"none":"");
    run.style.opacity = (flag?"0":"1");
    error.style.opacity = (flag?"1":"0");

    let counter = document.getElementById("textareaLen");
    let textarea = document.getElementById("inputBox");
    let len = textarea.value.length;
    counter.style.opacity = (len === 0?"0":"1");
    counter.textContent = (textarea.value.length) + "/200";
}

window.addEventListener("load", function() {
    document.body.classList.add("loaded");
});

document.getElementById("senderPaw").addEventListener("select", function(e) {
    e.preventDefault();
});

document.getElementById("inputBox").addEventListener("input", function() {
    check();
});

document.getElementById("senderUser").addEventListener("input", function(e) {
    this.value = this.value.replace(`/[-]/g`, '');
    this.value = this.value.slice(0, 11);
    check();
});
document.getElementById("senderUser").addEventListener("paste", function(e) {
    e.preventDefault();
    
    let pastedData = e.clipboardData.getData("text/plain");
    let filteredData = pastedData.replace(`/[-]/g`, '');
    this.textContent = filteredData;
});

function show() {
    console.log("已成功连接服务器");
}

async function run() {
    try {
        let user = document.getElementById("senderUser").value;
        let paw = document.getElementById("senderPaw").value;
        let showText = document.getElementById("inputBox").value;
        let showUser = document.getElementById("showUser").checked;
        let showDate = document.getElementById("showDate").checked;
        sendMod = document.getElementById("sendMod").value;

        let idList = [];
        if(sendMod === "dev") idList = [
            "3972443",
        ];

        const response = await axios.post(
            `http://localhost:${PORT}/api`, 
            JSON.stringify({  // 显式转换为JSON字符串
                senderUser: user,
                senderPaw: paw,
                text: showText,
                id: idList,
                sendMod: sendMod,
                showUser: showUser,
                showDate: showDate,
            }),
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
        console.log(response.data);
    } catch (error) {
        console.error("请求失败: ", error);
    }
}
show();
check();
forever();