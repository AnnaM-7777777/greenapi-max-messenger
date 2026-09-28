import { useEffect, useRef } from "react";
import { greenApi, type Message } from "../api/greenApi";
import { useMessenger } from "../context/MessengerContext";

export const useMessagePolling = () => {
    const { isAuthorized, addMessage } = useMessenger();
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!isAuthorized) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        const poll = async () => {
            // 1. Пытаемся получить уведомление из очереди
            const notification = await greenApi.receiveNotification();

            if (
                notification &&
                notification.body.typeMessage === "textMessage"
            ) {
                const { body, receiptId } = notification;

                // 2. Формируем объект сообщения для нашего стейта
                const newMessage: Message = {
                    idMessage: body.idMessage,
                    timestamp: body.timestamp,
                    typeMessage: body.typeMessage,
                    chatId: body.chatId,
                    senderId: body.senderId,
                    senderName: body.senderName || "Неизвестный",
                    textMessage: body.textMessage,
                    isOutgoing: false, // Раз пришло через ReceiveNotification, значит входящее
                };

                // 3. Добавляем в глобальный стейт
                addMessage(body.chatId, newMessage);

                // 4. Обязательно удаляем из очереди Green API, чтобы не получить его снова!
                await greenApi.deleteNotification(receiptId);
            }
        };

        // Опрос каждые 2 секунды
        intervalRef.current = setInterval(poll, 2000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isAuthorized, addMessage]);
};
