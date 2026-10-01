import { useState, useEffect } from "react";
import { useMessenger } from "../../context/MessengerContext";
import { greenApi } from "../../api/greenApi";
import { useMessagePolling } from "../../hooks/useMessagePolling";
import styles from "./ChatInterface.module.css";

export const ChatInterface = () => {
    useMessagePolling();

    const {
        currentChatId,
        messages,
        setCurrentChat,
        addMessage,
        loadChatHistory,
    } = useMessenger();

    const [phoneInput, setPhoneInput] = useState("");
    const [messageText, setMessageText] = useState("");
    const [isSending, setIsSending] = useState(false);

    // Загружаем историю при открытии чата
    useEffect(() => {
        if (currentChatId) {
            loadChatHistory(currentChatId);
        }
    }, [currentChatId, loadChatHistory]);

    const handleStartChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneInput.trim()) return;
        const cleanNumber = phoneInput.replace(/\D/g, "");
        setCurrentChat(`${cleanNumber}@c.us`);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim() || !currentChatId || isSending) return;

        setIsSending(true);
        try {
            const response = await greenApi.sendMessage(
                currentChatId,
                messageText,
            );

            const newMessage = {
                idMessage: response.idMessage,
                timestamp: Math.floor(Date.now() / 1000),
                typeMessage: "outgoingAPIMessageReceived",
                chatId: currentChatId,
                senderId: "me",
                senderName: "Я",
                textMessage: messageText,
                isOutgoing: true,
            };

            addMessage(currentChatId, newMessage);
            setMessageText("");
        } catch (error) {
            console.error("Ошибка отправки:", error);
            alert("Не удалось отправить сообщение.");
        } finally {
            setIsSending(false);
        }
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className={styles.chatContainer}>
            <div className={styles.chatSidebar}>
                <div className={styles.chatSidebar__header}>MAX Messenger</div>
                <form
                    className={styles.chatSidebar__newChat}
                    onSubmit={handleStartChat}
                >
                    <input
                        type="text"
                        className={`${styles.chatSidebar__phoneInput} input-primary`}
                        placeholder="Введите номер (79991234567)"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                    />
                    <button
                        type="submit"
                        className={`${styles.chatSidebar__btnStartChat} btn-primary`}
                    >
                        Начать чат
                    </button>
                </form>
                {currentChatId && (
                    <div className={styles.chatSidebar__activeChat}>
                        Чат:{" "}
                        <strong>{currentChatId.replace("@c.us", "")}</strong>
                    </div>
                )}
            </div>

            <div className={styles.chatWindow}>
                {!currentChatId ? (
                    <div className={styles.emptyState}>
                        Выберите или начните новый чат слева
                    </div>
                ) : (
                    <>
                        <div className={styles.messagesList}>
                            {(messages[currentChatId] || []).map((msg) => (
                                <div
                                    key={msg.idMessage}
                                    className={`${styles.messageBubble} ${
                                        msg.isOutgoing
                                            ? styles.messageOutgoing
                                            : styles.messageIncoming
                                    }`}
                                >
                                    <div>{msg.textMessage}</div>
                                    <div className={styles.messageTime}>
                                        {formatTime(msg.timestamp)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <form
                            className={styles.chatWindow__inputForm}
                            onSubmit={handleSendMessage}
                        >
                            <input
                                type="text"
                                className={styles.chatWindow__inputArea}
                                placeholder="Сообщение..."
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                disabled={isSending}
                            />
                            <button
                                type="submit"
                                className={styles.chatWindow__btnSend}
                                disabled={isSending || !messageText.trim()}
                                aria-label="Отправить сообщение"
                            >
                                {isSending ? (
                                    <span className={styles.spinner}>...</span>
                                ) : (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        width="24"
                                        height="24"
                                    >
                                        <rect
                                            width="24"
                                            height="24"
                                            rx="4"
                                            fill="#007BFF"
                                        />
                                        <path
                                            d="M12 5v14M12 5l-5 5M12 5l5 5"
                                            stroke="#FFFFFF"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            fill="none"
                                        />
                                    </svg>
                                )}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};
