import { useState, useEffect, useRef } from "react";
import { greenApi } from "../api/greenApi";
import { useMessenger } from "../context/MessengerContext";

export const useQrManager = () => {
    const { isAuthorized, setAuthorization } = useMessenger();

    const [isLoading, setIsLoading] = useState(false);
    const [isExpired, setIsExpired] = useState(false);

    const expireTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const authCheckTimerRef = useRef<ReturnType<typeof setInterval> | null>(
        null,
    );

    const fetchNewQr = async () => {
        setIsLoading(true);
        setIsExpired(false);

        try {
            const state = await greenApi.getStateInstance();
            if (state === "authorized") {
                setAuthorization(true, null);
                return;
            }

            const qr = await greenApi.getQrCode();

            if (qr) {
                setAuthorization(false, qr);

                expireTimerRef.current = setTimeout(() => {
                    setIsExpired(true);
                }, 60000);
            }
        } catch (error: unknown) {
            console.error("Ошибка при получении QR-кода:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthorized) {
            fetchNewQr();
        }

        return () => {
            if (expireTimerRef.current) clearTimeout(expireTimerRef.current);
            if (authCheckTimerRef.current) {
                clearInterval(authCheckTimerRef.current);
            }
        };
    }, [isAuthorized]);

    useEffect(() => {
        if (isAuthorized || isExpired) return;

        authCheckTimerRef.current = setInterval(async () => {
            try {
                const state = await greenApi.getStateInstance();
                if (state === "authorized") {
                    setAuthorization(true, null);
                }
            } catch (error: unknown) {
                // Игнорируем ошибки сети при фоновой проверке
            }
        }, 15000);

        return () => {
            if (authCheckTimerRef.current) {
                clearInterval(authCheckTimerRef.current);
            }
        };
    }, [isAuthorized, isExpired, setAuthorization]);

    return {
        isLoading,
        isExpired,
        refreshQr: fetchNewQr,
    };
};
