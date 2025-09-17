(function () {
    // 1. Load Deep Chat from CDN
    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://cdn.jsdelivr.net/npm/deep-chat@latest/dist/deepChat.min.js";
    document.head.appendChild(script);

    script.onload = async () => {
        const hostScript = document.querySelector("script[data-token]");
        const token = hostScript?.getAttribute("data-token");
        const primaryColor =
            hostScript?.getAttribute("data-primary-color") || "#007bff";
        const buttonTextColor =
            hostScript?.getAttribute("data-button-text-color") || "white";
        const apiBaseUrl =
            hostScript?.getAttribute("data-api-url")?.replace(/\/+$/, "") ||
            "https://app.voice-ai.co.nz/api/v1";

        if (!token) {
            console.error("Missing Bearer token in data-token attribute");
            return;
        }

        // Toggle button
        const toggleBtn = document.createElement("button");
        toggleBtn.id = "openChatBtn";
        toggleBtn.innerText = "\u{1F4AC}";
        toggleBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: none;
        background-color: #007bff;
        color: white;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.3s ease, transform 0.15s ease;
        `;
        document.body.appendChild(toggleBtn);

        // Chat container (hidden initially)
        const container = document.createElement("div");
        container.id = "chatWidgetContainer";
        container.style = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        width: 400px;
        max-height: 500px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: sans-serif;
        overflow: hidden;
        height: 0;
        opacity: 0;
        transition: height 0.3s ease, opacity 0.3s ease;
        display: flex;
        flex-direction: column;
        `;
        document.body.appendChild(container);

        let sessionStarted = false;
        let sessionId = null;
        let chatOpen = false;

        toggleBtn.addEventListener("click", async () => {
            // 1. Shrink animation (scale down then back up)
            toggleBtn.style.transform = "scale(0.9)";
            setTimeout(() => {
                toggleBtn.style.transform = "scale(1)";
            }, 150);

            // 2. Toggle icon
            chatOpen = !chatOpen;
            toggleBtn.innerText = chatOpen ? "\u{25BE}" : "\u{1F4AC}"; 
            // ▼ down arrow (U+25BC) when open
            // 💬 chat bubble (U+1F4AC) when closed

            // 3. Toggle chat container animation
            if (chatOpen) {
                container.style.height = "500px";
                container.style.opacity = "1";
            } else {
                container.style.height = "0px";
                container.style.opacity = "0";
            }
            
            if (!sessionStarted) {
                try {
                // Start session (no metadata since we removed form)
                const startSessionRes = await fetch(
                    `${apiBaseUrl}/bots/sessions/start-text`,
                    {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ metadata: {} }),
                    }
                );

                const sessionData = await startSessionRes.json();
                sessionId = sessionData.session_id;

                if (!sessionId) {
                    console.error("Failed to retrieve session_id");
                    return;
                }

                // Create chat
                container.innerHTML = "";
                const chat = document.createElement("deep-chat");
                chat.style = "width:100%;height:100%;display:flex;";
                chat.history = [
                { text: "Hi there, you're speaking with AI Agent. How can I help you?", role: "ai" }
                ];
                chat.avatars = true;
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
                            method: "POST",
                            headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                            },
                        }
                        );

                        const data = await response.json();
                        signals.onResponse({
                        text: data.response || data.message || "[No response]",
                        });
                    } catch (error) {
                        console.error("Chat handler error:", error);
                        signals.onResponse({
                        error: "Something went wrong while fetching the response.",
                        });
                    }
                    },
                };

                sessionStarted = true;
                // Animate open
                requestAnimationFrame(() => {
                    container.style.height = "500px";
                    container.style.opacity = "1";
                });
                } catch (err) {
                console.error("Error starting chat session:", err);
                }
            } 
            
        
        });
    };
})();
