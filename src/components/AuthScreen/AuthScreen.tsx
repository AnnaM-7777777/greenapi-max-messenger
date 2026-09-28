import { useMessenger } from "../../context/MessengerContext";
import { useQrManager } from "../../hooks/useQrManager";
import styles from "./AuthScreen.module.css";

export const AuthScreen = () => {
    const { isAuthorized, qrCode } = useMessenger();
    const { isLoading, isExpired, refreshQr } = useQrManager();

    // 1. Если уже авторизован
    if (isAuthorized) {
        return (
            <div className={styles.authContainer}>
                <div className={styles.authCard}>
                    <h1 className={`${styles.authTitle} ${styles.successText}`}>
                        Успешная авторизация!
                    </h1>
                    <p className={styles.authSubtitle}>
                        Инстанс подключен. Загрузка интерфейса...
                    </p>
                </div>
            </div>
        );
    }

    // 2. Пока загружаем самый первый QR-код
    if (isLoading && !qrCode) {
        return (
            <div className={styles.authContainer}>
                <div className={styles.authCard}>
                    <div className={styles.spinner}></div>
                    <p className={styles.loadingText}>
                        Инициализация соединения...
                    </p>
                </div>
            </div>
        );
    }

    // 3. Основной экран с QR-кодом
    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <h1 className={styles.authTitle}>MAX Messenger</h1>
                <p className={styles.authSubtitle}>
                    Откройте приложение MAX на телефоне, перейдите в Настройки →
                    Связанные устройства → Привязка устройства и отсканируйте
                    этот код.
                </p>

                {qrCode && !isExpired && (
                    <div className={styles.qrWrapper}>
                        <img
                            src={qrCode}
                            alt="QR Code для авторизации"
                            className={styles.qrImage}
                        />
                    </div>
                )}

                {isExpired && (
                    <p className={styles.expiredText}>
                        ⚠️ Срок действия QR-кода истек
                    </p>
                )}

                <button
                    className={styles.refreshBtn}
                    onClick={refreshQr}
                    disabled={isLoading || !isExpired}
                >
                    {isLoading
                        ? "Обновление..."
                        : isExpired
                          ? "Обновить QR-код"
                          : "Обновить QR-код"}
                </button>

                {!isExpired && !isLoading && (
                    <p
                        className={styles.loadingText}
                        style={{ marginTop: "12px", fontSize: "12px" }}
                    >
                        Код действителен 60 секунд
                    </p>
                )}
            </div>
        </div>
    );
};
