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
                                    const stopNumber = flight.stop_number !== undefined ? flight.stop_number : 0;
                                    const segments = flight.segments || [];
                                    if (segments.length > 0) {
                                        segments.forEach(seg => {
                                            allFlights.push({
                                                airline: airline,
                                                cabinClass: seg.cabin_class || 'STANDARD',
                                                flightNumber: seg.flight_number || flight.flight_number,
                                                startPoint: seg.start_point || flight.start_point,
                                                endPoint: seg.end_point || flight.end_point,
                                                startTime: seg.start_time || flight.start_date,
                                                endTime: seg.end_time || flight.end_date,
                                                duration: seg.duration || flight.duration || '',
                                                stopNumber: stopNumber,
                                                plane: seg.plane || '',
                                                handBaggage: seg.hand_baggage || '',
                                                allowanceBaggage: seg.allowance_baggage || '',
                                                seat: seg.seat !== undefined ? seg.seat : 'N/A',
                                                totalAmount: fare.total_amount || 0,
                                                currency: fare.currency || 'VND'
                                            });
                                        });
                                    } else {
                                        allFlights.push({
                                            airline: airline,
                                            cabinClass: 'STANDARD',
                                            flightNumber: flight.flight_number || 'N/A',
                                            startPoint: flight.start_point || '',
                                            endPoint: flight.end_point || '',
                                            startTime: flight.start_date || '',
                                            endTime: flight.end_date || '',
                                            duration: flight.duration || '',
                                            stopNumber: stopNumber,
                                            plane: '',
                                            handBaggage: '',
                                            allowanceBaggage: '',
                                            seat: 'N/A',
                                            totalAmount: fare.total_amount || 0,
                                            currency: fare.currency || 'VND'
                                        });
                                    }
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
            containerDiv.style.cssText = 'font-size: 13px; display: flex; flex-direction: column; gap: 8px; position: relative;';
            
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

            // Detail popup / tooltip element
            const detailPopup = document.createElement('div');
            detailPopup.style.cssText = 'display: none; position: absolute; bottom: 0; left: 0; right: 0; background: #fff; border: 1px solid #ccc; border-radius: 8px; padding: 12px; z-index: 999; box-shadow: 0 4px 15px rgba(0,0,0,0.2); font-size: 12px; color: #333; max-height: 400px; overflow-y: auto;';
            containerDiv.appendChild(detailPopup);

            detailPopup.onmouseleave = () => {
                detailPopup.style.display = 'none';
            };

            function showDetails(f) {
                const stopText = f.stopNumber === 0 ? 'Bay thẳng' : `${f.stopNumber} điểm dừng`;
                detailPopup.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px;">
                        <strong>Chi tiết hạng ghế & chuyến bay</strong>
                        <button id="close-popup" style="background: none; border: none; font-size: 16px; cursor: pointer;">&times;</button>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <div><strong>Hãng bay:</strong> ${f.airline}</div>
                        <div><strong>Mã chuyến bay:</strong> ${f.flightNumber}</div>
                        <div><strong>Loại ghế bay (Cabin):</strong> ${f.cabinClass}</div>
                        <div><strong>Hành trình:</strong> ${f.startPoint} ➔ ${f.endPoint}</div>
                        <div><strong>Giờ khởi hành:</strong> ${f.startTime ? new Date(f.startTime).toLocaleString() : ''}</div>
                        <div><strong>Giờ đến:</strong> ${f.endTime ? new Date(f.endTime).toLocaleString() : ''}</div>
                        <div><strong>Thời gian bay:</strong> ${f.duration} phút</div>
                        <div><strong>Hành trình bay:</strong> ${stopText}</div>
                        <div><strong>Mã máy bay:</strong> ${f.plane || 'N/A'}</div>
                        <div><strong>Hành lý xách tay:</strong> ${f.handBaggage || 'N/A'}</div>
                        <div><strong>Hành lý kí gửi:</strong> ${f.allowanceBaggage || 'N/A'}</div>
                        <div><strong>Số lượng ghế còn:</strong> ${f.seat}</div>
                        <div><strong>Tổng tiền (đã gồm thuế phí):</strong> <span style="color: #007bff; font-weight: bold;">${f.totalAmount ? f.totalAmount.toLocaleString() + ' ' + f.currency : 'Liên hệ'}</span></div>
                    </div>
                    <button disabled style="margin-top: 10px; width: 100%; padding: 6px; background: #ccc; color: #666; border: none; border-radius: 4px; cursor: not-allowed; font-weight: bold;">Chọn (Tạm khóa)</button>
                `;
                detailPopup.style.display = 'block';
                document.getElementById('close-popup').onclick = () => {
                    detailPopup.style.display = 'none';
                };
            }

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
                            <th style="padding: 6px; text-align: left; white-space: nowrap;">Chuyến bay</th>
                            <th style="padding: 6px; text-align: left; white-space: nowrap;">Hành trình & Giờ</th>
                            <th style="padding: 6px; text-align: right; white-space: nowrap;">Giá vé</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredFlights.map((f, idx) => {
                            const startTimeStr = f.startTime ? new Date(f.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
                            const endTimeStr = f.endTime ? new Date(f.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
                            const stopText = f.stopNumber === 0 ? 'Bay thẳng' : `${f.stopNumber} điểm dừng`;

                            return `
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 6px;">
                                        <strong>${f.flightNumber}</strong>
                                        <br/><small style="color: #666;">${stopText}</small>
                                    </td>
                                    <td style="padding: 6px; white-space: nowrap;">
                                        ${f.startPoint} ➔ ${f.endPoint}
                                        <br/><small style="color: #007bff; font-weight: bold; white-space: nowrap;">${startTimeStr} ➔ ${endTimeStr}</small>
                                    </td>
                                    <td style="padding: 6px; text-align: right;">
                                        <span class="price-link" data-index="${idx}" style="font-weight: bold; color: #007bff; cursor: pointer; text-decoration: underline; white-space: nowrap;">
                                            ${f.totalAmount ? f.totalAmount.toLocaleString() + ' ' + f.currency : 'Liên hệ'}
                                        </span>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                `;

                viewContainer.appendChild(table);

                const priceLinks = viewContainer.querySelectorAll('.price-link');
                priceLinks.forEach(link => {
                    const idx = link.getAttribute('data-index');
                    const flightObj = filteredFlights[idx];
                    link.onmouseenter = () => showDetails(flightObj);
                    link.onmouseleave = (e) => {
                        setTimeout(() => {
                            if (!detailPopup.matches(':hover') && !link.matches(':hover')) {
                                detailPopup.style.display = 'none';
                            }
                        }, 100);
                    };
                    link.onclick = () => showDetails(flightObj);
                });
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

            if (data.messages && Array.isArray(data.messages)) {
                data.messages.forEach((msg, index) => {
                    const sender = msg.role === 'user' ? 'user' : 'bot';
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
