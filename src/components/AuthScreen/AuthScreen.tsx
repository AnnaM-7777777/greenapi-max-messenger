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
                    <h1
                        className={`${styles.authCard__title} ${styles.successText}`}
                    >
                        Успешная авторизация!
                    </h1>
                    <p className={styles.authCard__subTitle}>
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
                    <div className={styles.authCard__spinner}></div>
                    <p className={styles.authCard__loadingText}>
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
                <h1 className={styles.authCard__title}>MAX Messenger</h1>
                <p className={styles.authCard__subTitle}>
                    Откройте приложение MAX на телефоне, перейдите в Настройки →
                    Связанные устройства → Привязка устройства и отсканируйте
                    этот код.
                </p>

                {qrCode && !isExpired && (
                    <div className={styles.authCard__qrWrapper}>
                        <img
                            src={qrCode}
                            alt="QR Code для авторизации"
                            className={styles.authCard__qrImage}
                        />
                    </div>
                )}

                {isExpired && (
                    <p className={styles.authCard__expiredText}>
                        Срок действия QR-кода истек
                    </p>
                )}

                <button
                    className={`${styles.authCard__refreshBtn} btn-primary`}
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
                        className={styles.authCard__loadingText}
                        style={{ fontSize: "12px" }}
                    >
                        Код действителен 60 секунд
                    </p>
                )}
            </div>
        </div>
    );
};
