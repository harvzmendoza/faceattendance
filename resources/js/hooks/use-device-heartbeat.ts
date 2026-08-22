import { useEffect } from 'react';
import { syncService } from '@/services/offline';
import {
    registerDevice,
    sendDeviceHeartbeat,
} from '@/services/offline/deviceClient';

const HEARTBEAT_MS = 30_000;

export function useDeviceHeartbeat(eventId?: number): void {
    useEffect(() => {
        let cancelled = false;
        let intervalId: number | undefined;

        async function pulse(): Promise<void> {
            if (!syncService.isOnline() || cancelled) {
                return;
            }

            const pendingCount = await syncService.getPendingCount(eventId);

            try {
                await sendDeviceHeartbeat(eventId, pendingCount);
            } catch {
                try {
                    await registerDevice(eventId);
                } catch {
                    // Device may be revoked; attendance still queues locally.
                }
            }
        }

        async function start(): Promise<void> {
            if (!syncService.isOnline()) {
                return;
            }

            const pendingCount = await syncService.getPendingCount(eventId);

            try {
                await registerDevice(eventId);
                await sendDeviceHeartbeat(eventId, pendingCount);
            } catch {
                return;
            }

            if (cancelled) {
                return;
            }

            intervalId = window.setInterval(() => {
                void pulse();
            }, HEARTBEAT_MS);
        }

        void start();

        return () => {
            cancelled = true;

            if (intervalId !== undefined) {
                window.clearInterval(intervalId);
            }
        };
    }, [eventId]);
}
