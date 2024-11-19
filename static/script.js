
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
        const summaryInput = document.getElementById('summaryInput');
        summaryInput.value = result;

        await updateDiagram();
    } catch (error) {
        console.error('Error fetching result:', error);
    } finally {
        refresh.disabled = false;
    }
});



// document.getElementById('generateSummaryButton').addEventListener('click', async function () {
//     const mdText = textarea.value;
//     try {
//         const response = await fetch('/get_result', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({ markdown: mdText })
//         });
//         const result = await response.json();
//         const summaryInput = document.getElementById('summaryInput');
//         summaryInput.value = result.summary;
//     } catch (error) {
//         console.error('Error generating summary:', error);
//     }
// });

document.getElementById('toggleSummaryButton').addEventListener('click', function () {
    const summaryFloat = document.querySelector('.summary-float');
    const isMinimized = summaryFloat.classList.toggle('minimized');
    //this.textContent = isMinimized ? '展开' : '最小化';
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
var username = "Username";
var displayUsername = document.getElementById("displayUsername");
displayUsername.innerText = "Nickname:" + username;

// 点击其他地方关闭弹窗
window.onclick = function(event) {
    if (event.target == profileModal) {
        profileModal.style.display = "none";
    }
    if (event.target == editModal) {
        editModal.style.display = "none";
    }
};

const filepage = document.getElementsByClassName("file-content");
const filebutton = document.getElementById("file-button");
const mainpage = document.getElementsByClassName("main-content");
const mainbutton = document.getElementById("chat-button");
const welcome = document.getElementsByClassName("welcome");
const welcomebutton = document.getElementById("welcome-button");

filebutton.addEventListener('click', function () {
    filepage[0].style.display = "block";
    mainpage[0].style.display = "none";
    welcome[0].style.display = "none";
    filebutton.classList.add("active");
    mainbutton.classList.remove("active");
    welcomebutton.classList.remove("active");
});

mainbutton.addEventListener('click', function () {
    filepage[0].style.display = "none";
    mainpage[0].style.display = "flex";
    welcome[0].style.display = "none";
    filebutton.classList.remove("active");
    mainbutton.classList.add("active");
    welcomebutton.classList.add("active");
});

welcomebutton.addEventListener('click', function () {
    filepage[0].style.display = "none";
    mainpage[0].style.display = "none";
    welcome[0].style.display = "flex";
    filebutton.classList.remove("active");
    mainbutton.classList.remove("active");
});



function getFileIcon(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
        case 'txt':
            return 'static/asset/txt.png';
        case 'pdf':
            return 'static/asset/PDF.png';
        case 'doc':
        case 'docx':
            return 'static/asset/DOC.png';
        default:
            return 'static/asset/file.png';
    }
}

function renameFile(fileNameCell) {
    const newName = prompt('New Filename:', fileNameCell.textContent);
    if (newName) {
        fileNameCell.textContent = newName;
    }
}

function deleteFile(row) {
    if (confirm('Confirm Delete?')) {
        row.remove();
    }
}

function downloadFile(file) {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function startChat() {
    var topic = document.getElementById('topic').value;
    var jd = document.getElementById('jd').value;
    var level = document.querySelector('input[name="difficulty"]:checked').value;
    
    if (!topic.trim()) {
        alert('Please enter a learning topic');
        return;
    }
    
    // 发送数据到 Flask 后端
    fetch('/start_chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            topic: topic,
            jobDescription: jd,
            experienceLevel: level
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Chat started with:', data);
        // 这里可以添加处理后端返回数据的逻辑
    })
    .catch(error => {
        console.error('Error:', error);
    });
    mainbutton.click();

}

// 添加输入框动画效果
const inputs = document.querySelectorAll('input[type="text"], textarea');
inputs.forEach(input => {
    input.addEventListener('focus', function() {
        this.style.transform = 'scale(1.01)';
    });

    input.addEventListener('blur', function() {
        this.style.transform = 'scale(1)';
    });
});



//select file
document.addEventListener('DOMContentLoaded', () => {
    const attachButton = document.getElementById('attachButton');
    const filePopup = document.getElementById('filePopup');
    const uploadedFilesList = document.getElementById('uploadedFilesList');
    const confirmButton = document.getElementById('confirmButton');
    const fileTableBody = document.getElementById('fileTableBody');

    let uploadedFiles = [];

    // 处理文件上传
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            uploadedFiles.push(file);
            const newRow = document.createElement('tr');

            const fileIconCell = document.createElement('td');
            const fileIcon = document.createElement('img');
            fileIcon.className = 'file-icon';
            fileIcon.src = getFileIcon(file.name);
            fileIconCell.appendChild(fileIcon);

            const fileNameCell = document.createElement('td');
            fileNameCell.textContent = file.name;

            const uploadTimeCell = document.createElement('td');
            uploadTimeCell.textContent = new Date().toLocaleString();

            const editButtonsCell = document.createElement('td');
            editButtonsCell.className = 'edit-buttons';
            const renameButton = document.createElement('button');
            renameButton.textContent = 'Rename';
            renameButton.className = 'file-button';
            renameButton.onclick = () => renameFile(fileNameCell);
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'file-button';
            deleteButton.onclick = () => deleteFile(newRow);
            const downloadButton = document.createElement('button');
            downloadButton.textContent = 'Download';
            downloadButton.className = 'file-button';
            downloadButton.onclick = () => downloadFile(file);
            editButtonsCell.appendChild(renameButton);
            editButtonsCell.appendChild(deleteButton);
            editButtonsCell.appendChild(downloadButton);

            newRow.appendChild(fileIconCell);
            newRow.appendChild(fileNameCell);
            newRow.appendChild(uploadTimeCell);
            newRow.appendChild(editButtonsCell);

            fileTableBody.appendChild(newRow);
        }
    }

    document.getElementById('fileInput').addEventListener('change', handleFileUpload);

    attachButton.addEventListener('click', () => {
        // 显示小窗口
        filePopup.style.display = 'block';
        const rect = attachButton.getBoundingClientRect();
        filePopup.style.top = `${rect.top + window.scrollY - filePopup.offsetHeight}px`; // 在按钮上方弹出
        filePopup.style.left = `${rect.left + window.scrollX}px`;

        // 清空已上传文件列表
        uploadedFilesList.innerHTML = '';

        // 添加已上传文件到列表
        uploadedFiles.forEach(file => {
            const listItem = document.createElement('li');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = file.name;
            listItem.appendChild(checkbox);
            listItem.appendChild(document.createTextNode(file.name));
            uploadedFilesList.appendChild(listItem);
        });
    });

    confirmButton.addEventListener('click', () => {
        // 获取选中的文件
        const selectedFiles = [];
        const checkboxes = uploadedFilesList.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach(checkbox => {
            const file = uploadedFiles.find(f => f.name === checkbox.value);
            if (file) {
                selectedFiles.push(file);
            }
        });

        // 创建 FormData 对象
        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('files', file);
        });

        // 发送选中的文件到 Flask 后端
        fetch('/upload_selected_files', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log('Files uploaded:', data);
            // 处理后端返回的数据
        })
        .catch(error => {
            console.error('Error:', error);
        });

        // 隐藏小窗口
        filePopup.style.display = 'none';
    });

    // 点击窗口外部时隐藏小窗口
    window.addEventListener('click', (event) => {
        if (!filePopup.contains(event.target) && event.target !== attachButton) {
            filePopup.style.display = 'none';
        }
    });
});