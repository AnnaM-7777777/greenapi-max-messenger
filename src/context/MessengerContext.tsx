import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from "react";
import { type Message, greenApi } from "../api/greenApi";

interface MessengerContextType {
    currentChatId: string | null;
    messages: Record<string, Message[]>;
    setCurrentChat: (chatId: string) => void;
    addMessage: (chatId: string, message: Message) => void;
    loadChatHistory: (chatId: string) => Promise<void>;
}

const MessengerContext = createContext<MessengerContextType | undefined>(
    undefined,
);

export const MessengerProvider = ({ children }: { children: ReactNode }) => {
    const [currentChatId, setCurrentChatId] = useState<string | null>(
        () => localStorage.getItem("currentChatId") || null,
    );
    const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
        const saved = localStorage.getItem("messages");
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        if (currentChatId) localStorage.setItem("currentChatId", currentChatId);
        else localStorage.removeItem("currentChatId");
    }, [currentChatId]);

    useEffect(() => {
        localStorage.setItem("messages", JSON.stringify(messages));
    }, [messages]);

    const setCurrentChat = useCallback(
        (chatId: string) => setCurrentChatId(chatId),
        [],
    );

    const addMessage = useCallback((chatId: string, message: Message) => {
        setMessages((prev) => {
            const chatMessages = prev[chatId] || [];
            if (chatMessages.some((msg) => msg.idMessage === message.idMessage))
                return prev;
            return { ...prev, [chatId]: [...chatMessages, message] };
        });
    }, []);

    const loadChatHistory = useCallback(async (chatId: string) => {
        try {
            const history = await greenApi.getChatHistory(chatId, 100);

            // ЗАЩИТА: Если сервер вернул пустой массив, НЕ стираем сохраненные сообщения!
            if (!history || history.length === 0) {
                return;
            }

            const historyMessages: Message[] = history
                .filter(
                    (msg: any) =>
                        msg.typeMessage === "textMessage" && msg.textMessage,
                )
                .map((msg: any) => ({
                    idMessage: msg.idMessage,
                    timestamp: msg.timestamp,
                    typeMessage: msg.typeMessage || "textMessage",
                    chatId: msg.chatId,
                    senderId: msg.senderId || "unknown",
                    senderName: msg.senderName || "Неизвестный",
                    textMessage: msg.textMessage || "",
                    isOutgoing: msg.type === "outgoing",
                }));

            setMessages((prev) => {
                // ЗАЩИТА: Если в стейте уже есть сообщения для этого чата, НЕ перезаписываем их!
                if (prev[chatId] && prev[chatId].length > 0) {
                    return prev;
                }
                return { ...prev, [chatId]: historyMessages };
            });
        } catch (error) {
            console.error("Ошибка загрузки истории:", error);
        }
    }, []);

    return (
        <MessengerContext.Provider
            value={{
                currentChatId,
                messages,
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
    if (!context)
        throw new Error("useMessenger must be used within a MessengerProvider");
    return context;
};
