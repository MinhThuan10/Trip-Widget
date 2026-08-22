import { appendMessage } from './ui.js';

export function initApiHandler({ backendUrl, userId, dom }) {
    let historyLoaded = false;

    // Helper to render flight table message element
    function createFlightTableElement(msg, sender, isLast) {
        const msgDiv = document.createElement('div');
        const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        msgDiv.id = msgId;
        msgDiv.className = `chat-msg ${sender}`;

        let metadata = msg.metadata || msg.flight_table || {};
        if (typeof metadata === 'string') {
            try {
                metadata = JSON.parse(metadata);
            } catch (e) {
                metadata = {};
            }
        }

        let allFlights = [];
        const toolDataList = metadata.data || (msg.data ? msg.data : null);

        if (Array.isArray(toolDataList)) {
            toolDataList.forEach(item => {
                if (item.tool === 'tool_search_flights' && item.content && item.content.success) {
                    const fareData = item.content.data?.fare_data;
                    if (Array.isArray(fareData)) {
                        fareData.forEach(fare => {
                            if (fare.flights) {
                                fare.flights.forEach(flight => {
                                    const airline = flight.airline || 'OTHER';
                                    const segments = flight.segments || [];
                                    segments.forEach(seg => {
                                        allFlights.push({
                                            airline: airline,
                                            cabinClass: seg.cabin_class || 'STANDARD',
                                            flightNumber: seg.flight_number || flight.flight_number,
                                            startPoint: seg.start_point || flight.start_point,
                                            endPoint: seg.end_point || flight.end_point,
                                            startTime: seg.start_time || flight.start_date,
                                            endTime: seg.end_time || flight.end_date,
                                            totalAmount: fare.total_amount || 0,
                                            currency: fare.currency || 'VND'
                                        });
                                    });
                                });
                            }
                        });
                    }
                }
            });
        }

        allFlights.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

        if (allFlights.length > 0) {
            const containerDiv = document.createElement('div');
            containerDiv.style.cssText = 'font-size: 13px; display: flex; flex-direction: column; gap: 8px;';

            const title = document.createElement('div');
            title.innerHTML = `<strong>${msg.content || msg.reply || 'Danh sách chuyến bay'}</strong>`;
            containerDiv.appendChild(title);

            const airlines = [...new Set(allFlights.map(f => f.airline))];
            let selectedAirline = airlines[0];

            function getCabinsForAirline(airline) {
                return [...new Set(allFlights.filter(f => f.airline === airline).map(f => f.cabinClass))];
            }

            function getLowestPriceCabin(airline) {
                const airlineFlights = allFlights.filter(f => f.airline === airline);
                if (airlineFlights.length === 0) return null;
                airlineFlights.sort((a, b) => a.totalAmount - b.totalAmount);
                return airlineFlights[0].cabinClass;
            }

            let selectedCabin = getLowestPriceCabin(selectedAirline);

            const filterContainer = document.createElement('div');
            filterContainer.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';
            containerDiv.appendChild(filterContainer);

            const viewContainer = document.createElement('div');
            containerDiv.appendChild(viewContainer);

            function renderFilters() {
                filterContainer.innerHTML = '';

                // Row 1: Airline filter
                const row1 = document.createElement('div');
                row1.style.cssText = 'display: flex; align-items: center; gap: 4px; flex-wrap: wrap;';
                const label1 = document.createElement('span');
                label1.style.fontWeight = 'bold';
                label1.textContent = 'Hãng: ';
                row1.appendChild(label1);

                airlines.forEach(airline => {
                    const btn = document.createElement('button');
                    btn.textContent = airline;
                    const isActive = selectedAirline === airline;
                    btn.style.cssText = `padding: 4px 8px; background: ${isActive ? '#007bff' : '#e4e6eb'}; color: ${isActive ? 'white' : '#333'}; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;`;
                    btn.onclick = () => {
                        selectedAirline = airline;
                        selectedCabin = getLowestPriceCabin(selectedAirline);
                        renderFilters();
                        renderTable();
                    };
                    row1.appendChild(btn);
                });
                filterContainer.appendChild(row1);

                // Row 2: Cabin filter
                const availableCabins = getCabinsForAirline(selectedAirline);
                if (availableCabins.length > 0) {
                    const row2 = document.createElement('div');
                    row2.style.cssText = 'display: flex; align-items: center; gap: 4px; flex-wrap: wrap;';
                    const label2 = document.createElement('span');
                    label2.style.fontWeight = 'bold';
                    label2.textContent = 'Hạng: ';
                    row2.appendChild(label2);

                    availableCabins.forEach(cabin => {
                        const btn = document.createElement('button');
                        btn.textContent = cabin;
                        const isActive = selectedCabin === cabin;
                        btn.style.cssText = `padding: 4px 8px; background: ${isActive ? '#17a2b8' : '#e4e6eb'}; color: ${isActive ? 'white' : '#333'}; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;`;
                        btn.onclick = () => {
                            selectedCabin = cabin;
                            renderFilters();
                            renderTable();
                        };
                        row2.appendChild(btn);
                    });
                    filterContainer.appendChild(row2);
                }
            }

            function renderTable() {
                viewContainer.innerHTML = '';
                const filteredFlights = allFlights.filter(f => f.airline === selectedAirline && f.cabinClass === selectedCabin);

                const table = document.createElement('table');
                table.style.cssText = 'width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 12px; background: white; color: #333;';
                table.innerHTML = `
                    <thead>
                        <tr style="background: #f1f1f1; border-bottom: 1px solid #ddd;">
                            <th style="padding: 6px; text-align: left;">Chuyến bay</th>
                            <th style="padding: 6px; text-align: left;">Hành trình & Giờ</th>
                            <th style="padding: 6px; text-align: right;">Giá vé</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredFlights.map(f => `
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 6px;"><strong>${f.airline}</strong><br/>${f.flightNumber}</td>
                                <td style="padding: 6px;">${f.startPoint} ➔ ${f.endPoint}<br/><small>${new Date(f.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></td>
                                <td style="padding: 6px; text-align: right; font-weight: bold; color: #007bff;">${f.totalAmount ? f.totalAmount.toLocaleString() + ' ' + f.currency : 'Liên hệ'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                `;
                viewContainer.appendChild(table);
            }

            renderFilters();
            renderTable();
            msgDiv.appendChild(containerDiv);
        } else {
            const textContent = msg.content || msg.reply || '';
            if (typeof marked !== 'undefined') {
                msgDiv.innerHTML = marked.parse(String(textContent));
            } else {
                msgDiv.textContent = String(textContent);
            }
        }

        dom.messages.appendChild(msgDiv);
        if (isLast) {
            dom.messages.scrollTop = dom.messages.scrollHeight;
        }
    }

    async function loadHistory() {
        if (historyLoaded) {
            return;
        }

        try {
            const res = await fetch(
                `${backendUrl}/api/history?userId=${encodeURIComponent(userId)}`
            );

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            const data = await res.json();

            dom.messages.innerHTML = '';

            if (data.messages && data.messages.length > 0) {
                data.messages.forEach((msg, index) => {
                    const sender = msg.role === 'user' ? 'user' : 'bot';
                    const isLast = index === data.messages.length - 1;

                    let metadata = msg.metadata || {};
                    if (typeof metadata === 'string') {
                        try { metadata = JSON.parse(metadata); } catch (e) { metadata = {}; }
                    }

                    if (msg.message_type === 'flight_table') {
                        createFlightTableElement(msg, sender, isLast);
                    } else {
                        appendMessage(msg.content || '', sender, isLast, dom.messages);
                    }
                });
            } else {
                appendMessage(
                    'Xin chào! Tôi có thể giúp gì cho bạn hôm nay?',
                    'bot',
                    true,
                    dom.messages
                );
            }

            historyLoaded = true;
        } catch (err) {
            console.error('Lỗi load history:', err);
            dom.messages.innerHTML = '';
            appendMessage(
                'Xin chào! Tôi có thể giúp gì cho bạn hôm nay?',
                'bot',
                true,
                dom.messages
            );
            historyLoaded = false;
        }
    }

    async function sendMessage() {
        const text = dom.input.value.trim();

        if (!text) {
            return;
        }

        appendMessage(text, 'user', true, dom.messages);
        dom.input.value = '';

        const loadingId = appendMessage(
            'Đang trả lời...',
            'bot',
            true,
            dom.messages
        );

        dom.sendBtn.disabled = true;

        try {
            const res = await fetch(`${backendUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: text,
                    userId: userId
                })
            });
            const data = await res.json();

            const loadingElement = document.getElementById(loadingId);
            if (loadingElement) {
                loadingElement.remove();
            }

            if (!res.ok) {
                throw new Error(data.error || `HTTP ${res.status}`);
            }
            // Nếu trả về mảng messages (như server port 8000)
            if (data.messages && Array.isArray(data.messages)) {
                data.messages.forEach((msg, index) => {
                    const sender = msg.role === 'user' ? 'user' : 'bot';
                    // Chỉ render các message assistant mới nhất hoặc tất cả message trả về
                    if (msg.role === 'assistant') {
                        const isLast = index === data.messages.length - 1;
                        if (msg.message_type === 'flight_table') {
                            createFlightTableElement(msg, sender, isLast);
                        } else {
                            appendMessage(msg.content || '', sender, isLast, dom.messages);
                        }
                    }
                });
            } else if (data.message_type === 'flight_table' || data.metadata || data.flight_table) {
                createFlightTableElement({
                    content: data.reply || data.content,
                    message_type: 'flight_table',
                    metadata: data.metadata || data.flight_table
                }, 'bot', true);
            } else {
                appendMessage(
                    data.reply || data.error || JSON.stringify(data),
                    'bot',
                    true,
                    dom.messages
                );
            }
        } catch (err) {
            console.error('Lỗi gửi message:', err);

            const loadingElement = document.getElementById(loadingId);
            if (loadingElement) {
                loadingElement.remove();
            }

            appendMessage(
                'Không thể kết nối đến máy chủ.',
                'bot',
                true,
                dom.messages
            );
        } finally {
            dom.sendBtn.disabled = false;
            dom.input.focus();
        }
    }

    return {
        loadHistory,
        sendMessage
    };
}
