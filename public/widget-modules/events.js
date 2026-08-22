export function initEvents({ dom, api }) {
    dom.btn.onclick = async function () {
        const isOpen = dom.win.style.display === 'flex';

        dom.win.style.display = isOpen ? 'none' : 'flex';

        if (!isOpen) {
            await api.loadHistory();
            dom.input.focus();
        }
    };

    dom.closeBtn.onclick = function () {
        dom.win.style.display = 'none';
    };

    dom.sendBtn.onclick = api.sendMessage;

    dom.input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            api.sendMessage();
        }
    });
}
