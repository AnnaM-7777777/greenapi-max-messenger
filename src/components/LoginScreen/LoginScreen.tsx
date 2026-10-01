import { useState } from "react";
import { validateCredentials, setApiCredentials } from "../../api/greenApi";
import styles from "./LoginScreen.module.css";

interface LoginScreenProps {
    onLogin: () => void;
}

export const LoginScreen = ({ onLogin }: LoginScreenProps) => {
    const [idInstance, setIdInstance] = useState("");
    const [apiToken, setApiToken] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        const cleanId = idInstance.trim();
        const cleanToken = apiToken.trim();

        // 1. ПРОВЕРКА: обращаемся к серверу GREEN-API
        const isValid = await validateCredentials(cleanId, cleanToken);

        if (isValid) {
            // 2. Если сервер подтвердил ключи, сохраняем их и пускаем в чат
            localStorage.setItem("maxMessengerId", cleanId);
            localStorage.setItem("maxMessengerToken", cleanToken);
            onLogin();
        } else {
            // 3. Если ключи неверные, показываем ошибку и НЕ пускаем в чат
            setError(
                "Неверный ID инстанса или API токен. Проверьте данные в личном кабинете GREEN-API.",
            );
            setApiCredentials("", ""); // Сбрасываем временные данные
        }

        setIsLoading(false);
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginCard}>
                <h2 className={styles.loginCard__title}>MAX Messenger</h2>
                <p className={styles.loginCard__subtitle}>
                    Введите учетные данные инстанса GREEN-API
                </p>

                <form onSubmit={handleSubmit} className={styles.loginForm}>
                    <div className={styles.loginForm__inputGroup}>
                        <label className={styles.loginForm__label}>ID Instance:</label>
                        <input
                            type="text"
                            className={`${styles.loginForm__input} input-primary`}
                            placeholder="Например: 123456654321"
                            value={idInstance}
                            onChange={(e) => setIdInstance(e.target.value)}
                            required
                            autoComplete="off"
                        />
                    </div>

                    <div className={styles.loginForm__inputGroup}>
                        <label className={styles.loginForm__label}>API Token Instance:</label>
                        <input
                            type="password"
                            className={`${styles.loginForm__input} input-primary`}
                            placeholder="Ваш токен из личного кабинета"
                            value={apiToken}
                            onChange={(e) => setApiToken(e.target.value)}
                            required
                            autoComplete="off"
                        />
                    </div>

                    {error && (
                        <div className={styles.loginForm__errorMessage}>{error}</div>
                    )}

                    <button
                        type="submit"
                        className={`${styles.loginForm__btnSubmit} btn-primary`}
                        disabled={isLoading}
                    >
                        {isLoading ? "Проверка данных..." : "Войти в чат"}
                    </button>
                </form>
            </div>
        </div>
    );
};
