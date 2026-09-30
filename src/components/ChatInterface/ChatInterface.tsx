import { useState } from "react";
import { useMessenger } from "../../context/MessengerContext";
import { greenApi } from "../../api/greenApi";
import { useMessagePolling } from "../../hooks/useMessagePolling";
import styles from "./ChatInterface.module.css";

export const ChatInterface = () => {
    // Запускаем опрос входящих сообщений
    useMessagePolling();

    const { currentChatId, messages, setCurrentChat, addMessage } =
        useMessenger();
    const [phoneInput, setPhoneInput] = useState("");
    const [messageText, setMessageText] = useState("");
    const [isSending, setIsSending] = useState(false);

    // Начало нового чата по номеру телефона
    const handleStartChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneInput.trim()) return;

        // Форматируем номер: убираем плюсы, пробелы, добавляем @c.us
        const cleanNumber = phoneInput.replace(/\D/g, "");
        const chatId = `${cleanNumber}@c.us`;
        setCurrentChat(chatId);
    };

    // Отправка сообщения
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim() || !currentChatId || isSending) return;

        setIsSending(true);
        try {
            // 1. Отправляем через API
            const response = await greenApi.sendMessage(
                currentChatId,
                messageText,
            );

            // 2. Сразу добавляем в наш локальный стейт как исходящее
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
            setMessageText(""); // Очищаем поле ввода
        } catch (error) {
            console.error("Ошибка отправки:", error);
            alert("Не удалось отправить сообщение. Проверьте подключение.");
        } finally {
            setIsSending(false);
        }
    };

    // Форматирование времени из timestamp
    const formatTime = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className={styles.chatContainer}>
            {/* Левая панель */}
            <div className={styles.chatSidebar}>
                <div className={styles.chatSidebar__header}>MAX Messenger</div>

                <form
                    className={styles.chatSidebar__newChat}
                    onSubmit={handleStartChat}
                >
                    <input
                        type="text"
                        className={`${styles.chatSidebar__phoneInput} input-primary`}
                        placeholder="Введите номер (например, 79991234567)"
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
                        Активный чат:{" "}
                        <strong>{currentChatId.replace("@c.us", "")}</strong>
                    </div>
                )}
            </div>

            {/* Правая панель (Окно переписки) */}
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
                            className={`${styles.chatWindow__inputForm} input-primary`}
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
                                disabled={isSending || !messageText.trim()}
                                aria-label="Отправить сообщение"
                            >
                                {isSending ? (
                                    <span className={styles.spinner}>...</span>
                                ) : (
                                    <svg
                                        aria-hidden="true"
                                        width="24"
                                        height="24"
                                    >
                                        <use href="#icon_send"></use>
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
