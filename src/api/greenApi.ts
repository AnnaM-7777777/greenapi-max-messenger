import axios from "axios";

let CURRENT_ID_INSTANCE = "";
let CURRENT_API_TOKEN_INSTANCE = "";
const API_URL = "https://3100.api.green-api.com";

export const setApiCredentials = (
    idInstance: string,
    apiTokenInstance: string,
) => {
    CURRENT_ID_INSTANCE = idInstance;
    CURRENT_API_TOKEN_INSTANCE = apiTokenInstance;
};

const getBaseUrl = () => `${API_URL}/waInstance${CURRENT_ID_INSTANCE}`;

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
        senderData: { chatId: string; sender: string; senderName: string };
        messageData: {
            typeMessage: string;
            textMessageData?: { textMessage: string };
        };
    };
}

export interface ChatHistoryItem {
    idMessage: string;
    timestamp: number;
    typeMessage: string;
    chatId: string;
    senderId?: string;
    senderName?: string;
    textMessage?: string;
    type: "outgoing" | "incoming";
    statusMessage?: string;
}

export const greenApi = {
    sendMessage: async (chatId: string, message: string) => {
        const formattedChatId = chatId.includes("@")
            ? chatId
            : `${chatId}@c.us`;
        const response = await axios.post(
            `${getBaseUrl()}/sendMessage/${CURRENT_API_TOKEN_INSTANCE}`,
            { chatId: formattedChatId, message },
            { headers: { "Content-Type": "application/json" } },
        );
        return response.data;
    },

    receiveNotification: async () => {
        try {
            const response = await axios.get(
                `${getBaseUrl()}/ReceiveNotification/${CURRENT_API_TOKEN_INSTANCE}`,
                { params: { receiveTimeout: 5 } },
            );
            return response.data || null;
        } catch (error: any) {
            if (error.response?.status === 408) return null;
            return null;
        }
    },

    deleteNotification: async (receiptId: number) => {
        try {
            await axios.delete(
                `${getBaseUrl()}/deleteNotification/${CURRENT_API_TOKEN_INSTANCE}/${receiptId}`,
            );
        } catch (error) {
            // Игнорируем ошибки удаления
        }
    },

    getStateInstance: async () => {
        const response = await axios.get(
            `${getBaseUrl()}/getStateInstance/${CURRENT_API_TOKEN_INSTANCE}`,
        );
        return response.data.stateInstance;
    },

    getChatHistory: async (chatId: string, count: number = 100) => {
        try {
            const formattedChatId = chatId.includes("@")
                ? chatId
                : `${chatId}@c.us`;
            const response = await axios.get(
                `${getBaseUrl()}/getChatHistory/${CURRENT_API_TOKEN_INSTANCE}`,
                { params: { chatId: formattedChatId, count } },
            );
            return response.data || [];
        } catch (error) {
            return [];
        }
    },
};

export const validateCredentials = async (
    idInstance: string,
    apiTokenInstance: string,
) => {
    try {
        setApiCredentials(idInstance, apiTokenInstance);
        const state = await greenApi.getStateInstance();
        return typeof state === "string";
    } catch (error) {
        return false;
    }
};
