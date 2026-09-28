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
        typeMessage: string;
        timestamp: number;
        idMessage: string;
        chatId: string;
        senderId: string;
        senderName: string;
        textMessage?: string;
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
    ): Promise<SendMessageResponse> => {
        const formattedChatId = chatId.includes("@")
            ? chatId
            : `${chatId}@c.us`;

        const response = await axios.post<SendMessageResponse>(
            `${BASE_URL}/sendMessage/${API_TOKEN_INSTANCE}`,
            { chatId: formattedChatId, message },
            { headers: { "Content-Type": "application/json" } },
        );
        return response.data;
    },

    receiveNotification: async (): Promise<Notification | null> => {
        try {
            const response = await axios.get<Notification | null>(
                `${BASE_URL}/ReceiveNotification/${API_TOKEN_INSTANCE}`,
            );
            return response.data || null;
        } catch {
            return null;
        }
    },

    deleteNotification: async (receiptId: number): Promise<void> => {
        try {
            await axios.get(
                `${BASE_URL}/DeleteNotification/${API_TOKEN_INSTANCE}`,
                {
                    params: { receiptId },
                },
            );
        } catch (error: unknown) {
            const err = error as AxiosError;
            console.error("Ошибка удаления уведомления:", err.message);
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
};
