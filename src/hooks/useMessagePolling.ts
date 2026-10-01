import { useEffect, useRef } from "react";
import { greenApi } from "../api/greenApi";
import { useMessenger } from "../context/MessengerContext";

export const useMessagePolling = () => {
    const { addMessage, currentChatId, isAuthorized } = useMessenger();
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    
    // Храним Set уже обработанных idMessage, чтобы не добавлять дубликаты
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

                    const isIncoming = body?.typeWebhook === "incomingMessageReceived";
                    const isText = body?.messageData?.typeMessage === "textMessage";
                    const text = body?.messageData?.textMessageData?.textMessage;

                    if (isIncoming && isText && text) {
                        const messageId = body.idMessage;
                        
                        // ПРОВЕРКА: Если это сообщение уже обработано, пропускаем добавление в стейт
                        if (processedMessagesRef.current.has(messageId)) {
                            console.log("⏭️ Дубликат от сервера, пропускаем добавление:", messageId);
                        } else {
                            // Добавляем ID в Set, чтобы запомнить, что мы его уже видели
                            processedMessagesRef.current.add(messageId);
                            
                            const newMessage = {
                                idMessage: messageId,
                                timestamp: body.timestamp,
                                typeMessage: "textMessage",
                                chatId: currentChatId,
                                senderId: body.senderData.sender,
                                senderName: body.senderData.senderName || "Неизвестный",
                                textMessage: text,
                                isOutgoing: false,
                            };
                            
                            console.log("💾 Сохраняем сообщение в чат:", currentChatId, newMessage.textMessage);
                            addMessage(currentChatId, newMessage);
                        }
                    }

                    // ВАЖНО: Удаляем из очереди ВСЕГДА, даже если это дубликат!
                    // Иначе сервер будет отдавать его снова и снова.
                    await greenApi.deleteNotification(receiptId);
                }
            } catch (error) {
                console.error("❌ Ошибка polling:", error);
            }
        };

        intervalRef.current = setInterval(poll, 2000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isAuthorized, currentChatId, addMessage]);
};
