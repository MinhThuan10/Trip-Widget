export function initConfig() {
    let userId = localStorage.getItem('chat_widget_user_id');

    if (!userId) {
        userId =
            'user_' +
            Math.random().toString(36).substring(2, 15) +
            Date.now().toString(36);

        localStorage.setItem('chat_widget_user_id', userId);
    }

    const scripts = document.getElementsByTagName('script');
    let backendUrl = window.CHAT_WIDGET_BACKEND_URL || 'http://localhost:3000';

    for (const script of scripts) {
        if (script.src && script.src.includes('widget.js')) {
            const urlAttr = script.getAttribute('data-backend-url');
            if (urlAttr) {
                backendUrl = urlAttr;
            }
            break;
        }
    }

    backendUrl = backendUrl.replace(/\/+$/, '');

    return { userId, backendUrl };
}
