import { useState, useEffect } from "react";
import { LoginScreen } from "./components/LoginScreen/LoginScreen";
import { ChatInterface } from "./components/ChatInterface/ChatInterface";
import { setApiCredentials } from "./api/greenApi";

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const savedId = localStorage.getItem("maxMessengerId");
        const savedToken = localStorage.getItem("maxMessengerToken");

        if (savedId && savedToken) {
            setApiCredentials(savedId, savedToken);
            setIsLoggedIn(true);
        }
    }, []);

    // Функция выхода: очищаем хранилище и сбрасываем состояние
    const handleLogout = () => {
        localStorage.removeItem("maxMessengerId");
        localStorage.removeItem("maxMessengerToken");
        setIsLoggedIn(false);
    };

    if (!isLoggedIn) {
        return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
    }

    // Передаем функцию выхода в компонент чата
    return <ChatInterface onLogout={handleLogout} />;
}

export default App;
