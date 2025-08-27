(function () {
    // 1. Load Deep Chat from CDN
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://cdn.jsdelivr.net/npm/deep-chat@latest/dist/deepChat.min.js';
    document.head.appendChild(script);

  // 2. After load, show form to collect name/email
    script.onload = async () => {
        const hostScript = document.querySelector('script[data-token]');
        const token = hostScript?.getAttribute('data-token');
        const primaryColor = hostScript?.getAttribute('data-primary-color') || '#007bff'; // default blue
        const apiBaseUrl = hostScript?.getAttribute('data-api-url')?.replace(/\/+$/, '') 
                        || 'https://app.voice-ai.co.nz/api/v1'; // default

        if (!token) {
        console.error('Missing Bearer token in data-token attribute');
        return;
        }

        // Create shared container for form/chat
        const container = document.createElement('div');
        container.id = 'chatWidgetContainer';
        container.style = `
        position:fixed;
        bottom:20px;
        right:20px;
        width:400px;
        background:white;
        border-radius:10px;
        box-shadow:0 0 10px rgba(0,0,0,0.3);
        z-index:10000;
        font-family:sans-serif;
        `;
        document.body.appendChild(container);

        // Create and insert form into container
        container.innerHTML = `
        <div id="chatForm" style="height:100%;display:flex;flex-direction:column;">
            <div style="
            background:${primaryColor};
            color:white;
            padding:15px 20px;
            font-size:18px;
            font-weight:bold;
            border-top-left-radius:10px;
            border-top-right-radius:10px;
            ">
            Chat with Us
            </div>
            <div style="padding:20px;flex-grow:1;display:flex;flex-direction:column;">
            <input type="text" id="chatName" placeholder="Your name" style="padding:8px;margin-bottom:10px;" />
            <input type="email" id="chatEmail" placeholder="Your email" style="padding:8px;margin-bottom:10px;" />
            <button id="chatStartBtn" style="padding:10px;width:100%;background:${primaryColor};color:white;border:none;border-radius:5px;cursor:pointer;">Start Chat</button>
            </div>
        </div>
        `;

        // Handle form submission
        document.getElementById('chatStartBtn').addEventListener('click', async () => {
        const name = document.getElementById('chatName').value.trim();
        const email = document.getElementById('chatEmail').value.trim();

        if (!name || !email) {
            alert('Please enter both name and email.');
            return;
        }

        try {
            // Start session
            const startSessionRes = await fetch(`${apiBaseUrl}/bots/sessions/start-text`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ metadata: { name, email } })
            });

            const sessionData = await startSessionRes.json();
            const sessionId = sessionData.session_id;

            if (!sessionId) {
            console.error('Failed to retrieve session_id');
            return;
            }

            // Replace form with Deep Chat
            container.innerHTML = ''; // Clear container
            const chat = document.createElement('deep-chat');
            chat.style = 'width:100%;height:100%;display: flex;';
            container.appendChild(chat);

            // Connect chat
            chat.connect = {
            handler: async (body, signals) => {
                try {
                const message = body.messages[0].text;
                const encodedMsg = encodeURIComponent(message);
                const response = await fetch(
                    `${apiBaseUrl}/bots/sessions/${sessionId}/send-message?message=${encodedMsg}&use_rag=true`,
                    {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    }
                );

                const data = await response.json();
                signals.onResponse({
                    text: data.response || data.message || '[No response]',
                });
                } catch (error) {
                console.error('Chat handler error:', error);
                signals.onResponse({
                    error: 'Something went wrong while fetching the response.',
                });
                }
            }
            };

        } catch (err) {
            console.error('Error starting chat session:', err);
        }
        });
    };
})();
