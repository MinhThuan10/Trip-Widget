export function injectStyles() {
    const style = document.createElement('style');

    style.innerHTML = `
        #chat-widget-container {
            position: fixed !important;
            bottom: 20px !important;
            right: 20px !important;
            font-family: Arial, sans-serif !important;
            z-index: 999999 !important;
        }

        #chat-widget-btn {
            height: 50px !important;
            padding: 0 16px 0 8px !important;
            border-radius: 25px !important;
            background-color: #007bff !important;
            color: white !important;
            border: none !important;
            cursor: pointer !important;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3) !important;
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            transition: transform 0.2s !important;
        }

        #chat-widget-btn:hover {
            transform: scale(1.05) !important;
        }

        #chat-widget-btn img {
            width: 36px !important;
            height: 36px !important;
            border-radius: 50% !important;
            object-fit: cover !important;
        }

        #chat-widget-btn span {
            font-size: 15px !important;
            font-weight: bold !important;
            white-space: nowrap !important;
        }

        #chat-widget-window {
            display: none;
            position: absolute !important;
            bottom: 70px !important;
            right: 0 !important;
            width: 420px !important;
            height: 600px !important;
            background: white !important;
            border-radius: 12px !important;
            box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2) !important;
            flex-direction: column !important;
            overflow: hidden !important;
            border: 1px solid #ddd !important;
        }

        #chat-widget-header {
            background: #007bff !important;
            color: white !important;
            padding: 15px !important;
            font-weight: bold !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
        }

        #chat-widget-close {
            background: none !important;
            border: none !important;
            color: white !important;
            font-size: 18px !important;
            cursor: pointer !important;
        }

        #chat-widget-messages {
            flex: 1 !important;
            padding: 15px !important;
            overflow-y: auto !important;
            background: #f9f9f9 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 10px !important;
        }

        .chat-msg {
            max-width: 80% !important;
            padding: 10px 14px !important;
            border-radius: 8px !important;
            font-size: 14px !important;
            line-height: 1.4 !important;
            word-break: break-word !important;
        }

        .chat-msg.user {
            background: #007bff !important;
            color: white !important;
            align-self: flex-end !important;
            border-bottom-right-radius: 2px !important;
        }

        .chat-msg.bot,
        .chat-msg.assistant {
            background: #e4e6eb !important;
            color: #333 !important;
            align-self: flex-start !important;
            border-bottom-left-radius: 2px !important;
        }

        #chat-widget-input-area {
            display: flex !important;
            padding: 10px !important;
            background: white !important;
            border-top: 1px solid #ddd !important;
        }

        #chat-widget-input {
            flex: 1 !important;
            padding: 10px !important;
            border: 1px solid #ddd !important;
            border-radius: 4px !important;
            outline: none !important;
            font-size: 14px !important;
        }

        #chat-widget-send {
            background: #007bff !important;
            color: white !important;
            border: none !important;
            padding: 0 12px !important;
            margin-left: 8px !important;
            border-radius: 4px !important;
            cursor: pointer !important;
            font-size: 16px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }

        #chat-widget-send:hover {
            background: #0056b3 !important;
        }

        @media (max-width: 500px) {
            #chat-widget-container {
                bottom: 10px !important;
                right: 10px !important;
            }

            #chat-widget-window {
                width: calc(100vw - 20px) !important;
                height: calc(100vh - 100px) !important;
                max-height: 600px !important;
                right: 0 !important;
                bottom: 60px !important;
            }
        }
    `;

    document.head.appendChild(style);
}
