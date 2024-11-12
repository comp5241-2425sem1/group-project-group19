
function initDiagram() {
    const $ = go.GraphObject.make;
    const diagram = $(go.Diagram, "myDiagram", {
        "undoManager.isEnabled": true,
        layout: $(go.TreeLayout, {
            angle: 0,
            nodeSpacing: 20,
            layerSpacing: 50
        }),
        initialContentAlignment: go.Spot.Center,
        "animationManager.isEnabled": false,

        "ViewportBoundsChanged": function (e) {
            const zoomSlider = document.getElementById("zoomSlider");
            if (zoomSlider) {
                const zoomPercentage = Math.round(diagram.scale * 100);
                zoomSlider.value = zoomPercentage;
                zoomValue.textContent = zoomPercentage + "%";
            }
        }
    });

    diagram.nodeTemplate =
        $(go.Node, "Auto",
            $(go.Shape, "RoundedRectangle", {
                fill: "white",
                stroke: "#00A9C9",
                strokeWidth: 2
            }),
            $(go.TextBlock, {
                margin: 8,
                font: "bold 14px sans-serif"
            }, new go.Binding("text", "text"))
        );

    diagram.linkTemplate =
        $(go.Link, {
            routing: go.Link.Orthogonal,
            corner: 5
        },
            $(go.Shape, {
                stroke: "#00A9C9",
                strokeWidth: 2
            })
        );

    return diagram;
}

function parseMarkdownToTree(mdText) {
    const tokens = marked.lexer(mdText);
    const nodeDataArray = [];
    const linkDataArray = [];
    let currentKey = 0;
    let parentStack = [{ key: -1, level: 0 }];

    tokens.forEach(token => {
        if (token.type === 'heading') {
            const level = token.depth;
            while (parentStack[parentStack.length - 1].level >= level) {
                parentStack.pop();
            }

            const nodeData = {
                key: currentKey,
                text: token.text,
                level: level
            };
            nodeDataArray.push(nodeData);

            if (parentStack[parentStack.length - 1].key !== -1) {
                linkDataArray.push({
                    from: parentStack[parentStack.length - 1].key,
                    to: currentKey
                });
            }

            parentStack.push({ key: currentKey, level: level });
            currentKey++;
        }
    });

    return {
        nodeDataArray: nodeDataArray,
        linkDataArray: linkDataArray
    };
}

const diagram = initDiagram();
var textarea = '# Title\n## Subtitle1\n### Content1\n#### Subcontent1\n##### Subsubcontent1\n### Content2\n#### Subcontent2\n##### Subsubcontent2\n## Subtitle2\n### Content3\n### Content4\n            '
const zoomSlider = document.getElementById('zoomSlider');
const zoomValue = document.getElementById('zoomValue');
const saveButton = document.getElementById('saveButton');
const refresh = document.getElementById('refresh');

function updateDiagram() {
    const mdText = textarea;
    const treeData = parseMarkdownToTree(mdText);
    diagram.model = new go.GraphLinksModel(
        treeData.nodeDataArray,
        treeData.linkDataArray
    );
}

zoomSlider.addEventListener('input', function (e) {
    const zoomPercentage = parseInt(e.target.value);
    diagram.scale = zoomPercentage / 100;
    zoomValue.textContent = zoomPercentage + '%';
});

saveButton.addEventListener('click', async function () {
    const currentScale = diagram.scale;
    const currentPosition = diagram.position.copy();

    try {
        diagram.zoomToFit();
        await diagram.commitTransaction();

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        diagram.nodes.each(node => {
            const bounds = node.actualBounds;
            minX = Math.min(minX, bounds.x);
            minY = Math.min(minY, bounds.y);
            maxX = Math.max(maxX, bounds.x + bounds.width);
            maxY = Math.max(maxY, bounds.y + bounds.height);
        });

        const padding = 5;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;

        const width = maxX - minX;
        const height = maxY - minY;
        const scale = 2;

        diagram.scale = 1;
        const imageData = diagram.makeImageData({
            scale: scale,
            background: "white",
            type: "image/png",
            position: new go.Point(minX, minY),
            size: new go.Size(width * 2, height * 2),
            maxSize: new go.Size(width * scale, height * scale)
        });

        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `mindmap_${timestamp}.png`;

        const blob = dataURItoBlob(imageData);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => {
            window.URL.revokeObjectURL(url);
        }, 100);

    } catch (e) {
        console.error('Error saving image:', e);
    } finally {
        diagram.scale = currentScale;
        diagram.position = currentPosition;
        diagram.commitTransaction();
    }
});

function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeString });
}

updateDiagram();

refresh.addEventListener('click', async function () {
    refresh.disabled = true;
    try {
        const response = await fetch('/get_result');
        const result = await response.text();
        textarea = result;

        await updateDiagram();
    } catch (error) {
        console.error('Error fetching result:', error);
    } finally {
        refresh.disabled = false;
    }
});

document.getElementById('addSummaryButton').addEventListener('click', function () {
    const summaryInput = document.getElementById('summaryInput').value;
    const summaryDisplay = document.getElementById('summaryDisplay');
    summaryDisplay.textContent = summaryInput;
});

document.getElementById('generateSummaryButton').addEventListener('click', async function () {
    const mdText = textarea.value;
    try {
        const response = await fetch('/generate_summary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ markdown: mdText })
        });
        const result = await response.json();
        const summaryInput = document.getElementById('summaryInput');
        summaryInput.value = result.summary;
    } catch (error) {
        console.error('Error generating summary:', error);
    }
});

document.getElementById('toggleSummaryButton').addEventListener('click', function () {
    const summaryFloat = document.querySelector('.summary-float');
    const isMinimized = summaryFloat.classList.toggle('minimized');
    this.textContent = isMinimized ? '展开' : '最小化';
});

// 添加拖动功能
const summaryHeader = document.querySelector('.summary-header');
summaryHeader.addEventListener('mousedown', function (e) {
    const summaryFloat = document.querySelector('.summary-float');
    let offsetX = e.clientX - summaryFloat.getBoundingClientRect().left;
    let offsetY = e.clientY - summaryFloat.getBoundingClientRect().top;

    function onMouseMove(e) {
        summaryFloat.style.left = `${e.clientX - offsetX}px`;
        summaryFloat.style.top = `${e.clientY - offsetY}px`;
    }

    document.addEventListener('mousemove', onMouseMove);

    document.addEventListener('mouseup', function () {
        document.removeEventListener('mousemove', onMouseMove);
    }, { once: true });
});



const chatContainer = document.getElementById('chatContainer');
const inputBox = document.getElementById('inputBox');
const sendButton = document.getElementById('sendButton');
const attachButton = document.getElementById('attachButton');

function getCurrentTime() {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' +
        now.getMinutes().toString().padStart(2, '0');
}

function addMessage(content, isUser = true) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `message-wrapper ${isUser ? 'user-message' : 'gpt-message'}`;

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    const avatarImg = document.createElement('img');
    avatarImg.src = isUser
        ? document.getElementById("sidebarAvatar").src
        : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%234A90E2'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='35' fill='white' text-anchor='middle' alignment-baseline='middle'%3EAI%3C/text%3E%3C/svg%3E";
    avatar.appendChild(avatarImg);

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    const senderInfo = document.createElement('div');
    senderInfo.className = 'sender-info';
    senderInfo.textContent = `${isUser ? 'You' : 'GPT Assistant'} • ${getCurrentTime()}`;

    const messageBubble = document.createElement('div');
    messageBubble.className = 'message-bubble';

    if (isUser) {
        messageBubble.textContent = content;
    } else {
        // 对GPT返回的内容进行Markdown渲染
        messageBubble.className += ' markdown-content markdown-body';
        messageBubble.innerHTML = marked.parse(content);
    }

    messageContent.appendChild(senderInfo);
    messageContent.appendChild(messageBubble);

    messageWrapper.appendChild(avatar);
    messageWrapper.appendChild(messageContent);
    chatContainer.appendChild(messageWrapper);

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function sendMessage() {
    const content = inputBox.textContent.trim();
    if (content) {
        addMessage(content, true);
        inputBox.textContent = '';

        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question: content })
        })
            .then(response => response.json())
            .then(data => {
                addMessage(data.response, false);
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }
}

sendButton.addEventListener('click', sendMessage);

inputBox.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

attachButton.addEventListener('click', () => {
    alert('附件功能待实现');
});

inputBox.addEventListener('input', () => {
    sendButton.disabled = !inputBox.textContent.trim();
});



// 获取弹窗元素
var profileModal = document.getElementById("profileModal");
var editModal = document.getElementById("editModal");

// 获取 <span> 元素，用于关闭弹窗
var closeButtons = document.getElementsByClassName("close");

// 获取保存按钮
var saveProfileButton = document.getElementById("saveProfile");

// 打开个人信息弹窗的函数
function openProfileModal() {
    profileModal.style.display = "flex";
}

// 打开编辑弹窗的函数
function openEditModal() {
    editModal.style.display = "flex";
    profileModal.style.display = "none";
}

// 关闭弹窗的函数
function closeModal() {
    profileModal.style.display = "none";
    editModal.style.display = "none";
}

// 点击保存按钮时更新信息
saveProfileButton.onclick = function() {
    var username = document.getElementById("username").value;
    var avatarInput = document.getElementById("avatar");
    var avatarFile = avatarInput.files[0];

    if (avatarFile) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var avatarUrl = e.target.result;
            document.getElementById("displayAvatar").src = avatarUrl;
            document.getElementById("sidebarAvatar").src = avatarUrl;
        }
        reader.readAsDataURL(avatarFile);
    }

    // 更新展示的用户名
    document.getElementById("displayUsername").innerText = "Nickname：" + username;
    document.getElementById("sidebarUsername").innerText = username;

    // 关闭弹窗
    editModal.style.display = "none";
}

// 点击其他地方关闭弹窗
window.onclick = function(event) {
    if (event.target == profileModal) {
        profileModal.style.display = "none";
    }
    if (event.target == editModal) {
        editModal.style.display = "none";
    }
}