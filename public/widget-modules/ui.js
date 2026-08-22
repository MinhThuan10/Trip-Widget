export function createWidgetDOM() {
    const container = document.createElement('div');
    container.id = 'chat-widget-container';

    container.innerHTML = `
        <div id="chat-widget-window">
            <div id="chat-widget-header">
                <span>AI Support Chat</span>
                <button id="chat-widget-close" type="button">&times;</button>
            </div>

            <div id="chat-widget-messages"></div>

            <div id="chat-widget-input-area">
                <input
                    type="text"
                    id="chat-widget-input"
                    placeholder="Nhập tin nhắn..."
                    autocomplete="off"
                />

                <button id="chat-widget-send" type="button">
                    Gửi
                </button>
            </div>
        </div>

        <button id="chat-widget-btn" type="button">
            &#128172;
        </button>
    `;

    document.body.appendChild(container);

    return {
        container,
        btn: document.getElementById('chat-widget-btn'),
        win: document.getElementById('chat-widget-window'),
        closeBtn: document.getElementById('chat-widget-close'),
        sendBtn: document.getElementById('chat-widget-send'),
        input: document.getElementById('chat-widget-input'),
        messages: document.getElementById('chat-widget-messages')
    };
}

export function appendMessage(text, sender, scroll = true, messagesContainer) {
    const msgDiv = document.createElement('div');

    const msgId =
        'msg_' +
        Date.now() +
        '_' +
        Math.random()
            .toString(36)
            .substring(2, 7);

    msgDiv.id = msgId;
    msgDiv.className = `chat-msg ${sender}`;

    if (
        sender === 'bot' &&
        typeof marked !== 'undefined'
    ) {
        msgDiv.innerHTML = marked.parse(String(text));
    } else {
        msgDiv.textContent = String(text);
    }

    messagesContainer.appendChild(msgDiv);

    if (scroll) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    return msgId;
}
