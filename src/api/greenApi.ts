import axios, { type AxiosError } from "axios";

const ID_INSTANCE = import.meta.env.VITE_ID_INSTANCE || "310022749561";
const API_TOKEN_INSTANCE = import.meta.env.VITE_API_TOKEN_INSTANCE || ""; // Токен из https://green-api.com/max
const API_URL = "https://3100.api.green-api.com";

const BASE_URL = `${API_URL}/waInstance${ID_INSTANCE}`;

// --- ТИПЫ ДАННЫХ ---
export interface Message {
    idMessage: string;
    timestamp: number;
    typeMessage: string;
    chatId: string;
    senderId: string;
    senderName: string;
    textMessage?: string;
    isOutgoing: boolean;
}

export interface Notification {
    receiptId: number;
    body: {
        typeWebhook: string;
        timestamp: number;
        idMessage: string;
        senderData: {
            chatId: string;
            sender: string;
            senderName: string;
        };
        messageData: {
            typeMessage: string;
            textMessageData?: {
                textMessage: string;
            };
            fileMessageData?: any;
        };
    };
}

// Типы ответов от Green API
interface SendMessageResponse {
    idMessage: string;
}

interface GetStateResponse {
    stateInstance: string;
}

// --- МЕТОДЫ API ---
export const greenApi = {
    sendMessage: async (
        chatId: string,
        message: string,
        typingTime?: number, // Опциональный параметр для эффекта "печатает..."
    ): Promise<SendMessageResponse> => {
        // 1. Валидация: проверяем длину сообщения (максимум 4000 символов по документации)
        if (message.length > 4000) {
            throw new Error("Сообщение не должно превышать 4000 символов");
        }

        const formattedChatId = chatId.includes("@")
            ? chatId
            : `${chatId}@c.us`;

        // 2. Формируем тело запроса
        const requestBody: {
            chatId: string;
            message: string;
            typingTime?: number;
        } = {
            chatId: formattedChatId,
            message,
        };

        // Добавляем typingTime только если он передан и находится в допустимом диапазоне (1000-20000 мс)
        if (typingTime && typingTime >= 1000 && typingTime <= 20000) {
            requestBody.typingTime = typingTime;
        }

        try {
            const response = await axios.post<SendMessageResponse>(
                `${BASE_URL}/sendMessage/${API_TOKEN_INSTANCE}`,
                requestBody,
                { headers: { "Content-Type": "application/json" } },
            );
            return response.data;
        } catch (error: unknown) {
            // 3. Обработка специфичных ошибок API
            const err = error as AxiosError<{ reason?: string }>;
            const status = err.response?.status;

            if (status === 400) {
                throw new Error(
                    "Ошибка валидации: проверьте параметры сообщения",
                );
            }
            if (status === 403) {
                throw new Error(
                    "Аккаунт временно заблокирован или есть ограничения на отправку",
                );
            }
            if (status === 500) {
                throw new Error("Ошибка сервера: слишком большой запрос");
            }

            // Пробрасываем остальные ошибки (например, проблемы с сетью)
            throw err;
        }
    },

    // Чтобы молча игнорировал 408
    receiveNotification: async (): Promise<Notification | null> => {
        try {
            const response = await axios.get(
                `${BASE_URL}/receiveNotification/${API_TOKEN_INSTANCE}`,
                { params: { receiveTimeout: 5 } },
            );
            return response.data;
        } catch (error: unknown) {
            const err = error as AxiosError;
            // 408 - это нормальное поведение, когда очередь пуста. Не спамим в консоль.
            if (err.response?.status === 408) {
                return null;
            }
            console.error("Ошибка получения уведомления:", err.message);
            return null;
        }
    },

    deleteNotification: async (receiptId: number): Promise<void> => {
        try {
            // Используем axios.delete и передаем receiptId прямо в URL
            await axios.delete(
                `${BASE_URL}/deleteNotification/${API_TOKEN_INSTANCE}/${receiptId}`,
            );
        } catch (error: unknown) {
            const err = error as AxiosError;
            // Логируем только если это не 404 (иногда сервер может вернуть 404, если сообщение уже удалено, это не критично)
            if (err.response?.status !== 404) {
                console.error("Ошибка удаления уведомления:", err.message);
            }
        }
    },

    getStateInstance: async (): Promise<string> => {
        try {
            const response = await axios.get<GetStateResponse>(
                `${BASE_URL}/getStateInstance/${API_TOKEN_INSTANCE}`,
            );
            return response.data.stateInstance;
        } catch {
            return "notAuthorized";
        }
    },

    getQrCode: async (): Promise<string | null> => {
        try {
            const response = await axios.get(
                `${BASE_URL}/qr/${API_TOKEN_INSTANCE}`,
            );

            // Добавляем префикс, чтобы браузер распознал base64 как картинку
            const qrBase64 = response.data.message;
            return qrBase64 ? `data:image/png;base64,${qrBase64}` : null;
        } catch (error: unknown) {
            const err = error as AxiosError;
            console.error("Ошибка получения QR:", err.message);
            return null;
        }
    },

    // Метод для загрузки истории
    getChatHistory: async (chatId: string, count: number = 100): Promise<any[]> => {
        try {
            const response = await axios.post(
                `${BASE_URL}/getChatHistory/${API_TOKEN_INSTANCE}`,
                { chatId, count }
            );
            return response.data || [];
        } catch (error: unknown) {
            const err = error as AxiosError;
            console.error("Ошибка загрузки истории чата:", err.message);
            return [];
        }
    },
};
