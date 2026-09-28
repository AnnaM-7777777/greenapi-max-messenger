import { createContext, useContext, useState, type ReactNode } from "react";
import { type Message } from "../api/greenApi";

// Описываем, что будет хранить и уметь наш контекст
interface MessengerContextType {
    currentChatId: string | null;
    messages: Record<string, Message[]>;
    isAuthorized: boolean;
    qrCode: string | null;
    setCurrentChat: (chatId: string) => void;
    addMessage: (chatId: string, message: Message) => void;
    setAuthorization: (isAuth: boolean, qr?: string | null) => void;
}

const MessengerContext = createContext<MessengerContextType | undefined>(
    undefined,
);

// Провайдер, который будет оборачивать всё приложение
export const MessengerProvider = ({ children }: { children: ReactNode }) => {
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Record<string, Message[]>>({});
    const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
    const [qrCode, setQrCode] = useState<string | null>(null);

    const setCurrentChat = (chatId: string) => setCurrentChatId(chatId);

    const addMessage = (chatId: string, message: Message) => {
        setMessages((prevMessages) => {
            const chatMessages = prevMessages[chatId] || [];

            // Проверка на дубликаты, чтобы не добавить одно сообщение дважды
            if (chatMessages.some((m) => m.idMessage === message.idMessage)) {
                return prevMessages;
            }

            return {
                ...prevMessages,
                [chatId]: [...chatMessages, message].sort(
                    (a, b) => a.timestamp - b.timestamp,
                ),
            };
        });
    };

    const setAuthorization = (isAuth: boolean, qr: string | null = null) => {
        setIsAuthorized(isAuth);
        setQrCode(qr);
    };

    return (
        <MessengerContext.Provider
            value={{
                currentChatId,
                messages,
                isAuthorized,
                qrCode,
                setCurrentChat,
                addMessage,
                setAuthorization,
            }}
        >
            {children}
        </MessengerContext.Provider>
    );
};

// Удобный хук для использования контекста в компонентах
export const useMessenger = () => {
    const context = useContext(MessengerContext);
    if (!context) {
        throw new Error("useMessenger must be used within a MessengerProvider");
    }
    return context;
};
