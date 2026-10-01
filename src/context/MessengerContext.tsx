import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from "react";
import { type Message, type ChatHistoryItem, greenApi } from "../api/greenApi";

interface MessengerContextType {
    isAuthorized: boolean;
    qrCode: string | null;
    currentChatId: string | null;
    messages: Record<string, Message[]>;
    setAuthorization: (isAuth: boolean, qr: string | null) => void;
    setCurrentChat: (chatId: string) => void;
    addMessage: (chatId: string, message: Message) => void;
    loadChatHistory: (chatId: string) => Promise<void>;
}

const MessengerContext = createContext<MessengerContextType | undefined>(
    undefined,
);

export const MessengerProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [qrCode, setQrCode] = useState<string | null>(null);

    const [currentChatId, setCurrentChatId] = useState<string | null>(() => {
        return localStorage.getItem("currentChatId") || null;
    });

    const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
        const saved = localStorage.getItem("messages");
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        if (currentChatId) {
            localStorage.setItem("currentChatId", currentChatId);
        } else {
            localStorage.removeItem("currentChatId");
        }
    }, [currentChatId]);

    useEffect(() => {
        localStorage.setItem("messages", JSON.stringify(messages));
    }, [messages]);

    const setAuthorization = useCallback(
        (isAuth: boolean, qr: string | null) => {
            setIsAuthorized(isAuth);
            setQrCode(qr);
        },
        [],
    );

    const setCurrentChat = useCallback((chatId: string) => {
        setCurrentChatId(chatId);
    }, []);

    const addMessage = useCallback((chatId: string, message: Message) => {
        setMessages((prevMessages) => {
            const chatMessages = prevMessages[chatId] || [];
            const isDuplicate = chatMessages.some(
                (msg) => msg.idMessage === message.idMessage,
            );
            if (isDuplicate) {
                return prevMessages;
            }
            return {
                ...prevMessages,
                [chatId]: [...chatMessages, message],
            };
        });
    }, []);

    const loadChatHistory = useCallback(async (chatId: string) => {
        try {
            const history = await greenApi.getChatHistory(chatId, 100);

            const historyMessages: Message[] = history
                .filter(
                    (msg: ChatHistoryItem) =>
                        msg.typeMessage === "textMessage" && msg.textMessage,
                )
                .map((msg: ChatHistoryItem) => ({
                    idMessage: msg.idMessage,
                    timestamp: msg.timestamp,
                    typeMessage: msg.typeMessage || "textMessage",
                    chatId: msg.chatId,
                    senderId: msg.senderId || "unknown",
                    senderName: msg.senderName || "Неизвестный",
                    textMessage: msg.textMessage || "",
                    isOutgoing: msg.type === "outgoing",
                }));

            setMessages((prev) => ({
                ...prev,
                [chatId]: historyMessages,
            }));
        } catch (error: unknown) {
            const err = error as Error;
            console.error("Ошибка загрузки истории:", err.message);
        }
    }, []);

    return (
        <MessengerContext.Provider
            value={{
                isAuthorized,
                qrCode,
                currentChatId,
                messages,
                setAuthorization,
                setCurrentChat,
                addMessage,
                loadChatHistory,
            }}
        >
            {children}
        </MessengerContext.Provider>
    );
};

export const useMessenger = () => {
    const context = useContext(MessengerContext);
    if (!context) {
        throw new Error("useMessenger must be used within a MessengerProvider");
    }
    return context;
};
