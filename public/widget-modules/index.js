import { initConfig } from './config.js';
import { injectStyles } from './styles.js';
import { createWidgetDOM } from './ui.js';
import { initApiHandler } from './api.js';
import { initEvents } from './events.js';

(function () {
    const { userId, backendUrl } = initConfig();
    injectStyles();
    const dom = createWidgetDOM();
    const api = initApiHandler({ backendUrl, userId, dom });
    initEvents({ dom, api });
})();
