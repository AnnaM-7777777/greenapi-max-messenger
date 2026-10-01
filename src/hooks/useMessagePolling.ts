import { useEffect, useRef } from "react";
import { greenApi } from "../api/greenApi";
import { useMessenger } from "../context/MessengerContext";

export const useMessagePolling = () => {
    const { addMessage, currentChatId, isAuthorized } = useMessenger();
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const processedMessagesRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!isAuthorized || !currentChatId) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        const poll = async () => {
            try {
                const notification = await greenApi.receiveNotification();

                if (notification) {
                    const { receiptId, body } = notification;

                    const isIncoming =
                        body?.typeWebhook === "incomingMessageReceived";
                    const isText =
                        body?.messageData?.typeMessage === "textMessage";
                    const text =
                        body?.messageData?.textMessageData?.textMessage;

                    if (isIncoming && isText && text) {
                        const messageId = body.idMessage;

                        if (processedMessagesRef.current.has(messageId)) {
                            console.log(
                                "⏭️ Дубликат от сервера, пропускаем добавление:",
                                messageId,
                            );
                        } else {
                            processedMessagesRef.current.add(messageId);

                            const newMessage = {
                                idMessage: messageId,
                                timestamp: body.timestamp,
                                typeMessage: "textMessage",
                                chatId: currentChatId,
                                senderId: body.senderData.sender,
                                senderName:
                                    body.senderData.senderName || "Неизвестный",
                                textMessage: text,
                                isOutgoing: false,
                            };

                            console.log(
                                "💾 Сохраняем сообщение в чат:",
                                currentChatId,
                                newMessage.textMessage,
                            );
                            addMessage(currentChatId, newMessage);
                        }
                    }

                    await greenApi.deleteNotification(receiptId);
                }
            } catch (error: unknown) {
                const err = error as Error;
                console.error("❌ Ошибка polling:", err.message);
            }
        };

        intervalRef.current = setInterval(poll, 2000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isAuthorized, currentChatId, addMessage]);
};
