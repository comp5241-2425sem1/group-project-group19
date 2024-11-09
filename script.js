function uploadFile() {
    document.getElementById('fileInput').click();
}

function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const chatBox = document.getElementById('chatBox');
    const messageText = chatInput.value;

    if (messageText.trim() !== "") {
        const userMessage = createUserMessage(messageText);
        chatBox.appendChild(userMessage);

        // Simulate AI response
        setTimeout(() => {
            const aiMessage = createAIMessage("This is an AI response.");
            chatBox.appendChild(aiMessage);
            chatBox.scrollTop = chatBox.scrollHeight;
        }, 1000);

        chatInput.value = "";
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

function createUserMessage(text) {
    const message = document.createElement('div');
    message.classList.add('message', 'user');

    const header = document.createElement('div');
    header.classList.add('message-header');

    const avatar = document.createElement('img');
    avatar.src = 'profile-icon.png'; // Replace with the actual path to the user's avatar
    header.appendChild(avatar);

    const username = document.createElement('span');
    username.classList.add('username');
    username.textContent = 'User'; // Replace with the actual username
    header.appendChild(username);

    const timestamp = document.createElement('span');
    timestamp.classList.add('timestamp');
    timestamp.textContent = new Date().toLocaleTimeString();
    header.appendChild(timestamp);

    message.appendChild(header);

    const content = document.createElement('div');
    content.textContent = text;
    message.appendChild(content);

    return message;
}

function createAIMessage(text) {
    const message = document.createElement('div');
    message.classList.add('message', 'ai');

    const header = document.createElement('div');
    header.classList.add('message-header');

    const username = document.createElement('span');
    username.classList.add('username');
    username.textContent = 'GPT';
    header.appendChild(username);

    const timestamp = document.createElement('span');
    timestamp.classList.add('timestamp');
    timestamp.textContent = new Date().toLocaleTimeString();
    header.appendChild(timestamp);

    message.appendChild(header);

    const content = document.createElement('div');
    content.textContent = text;
    message.appendChild(content);

    return message;
}

