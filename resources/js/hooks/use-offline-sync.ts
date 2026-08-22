import { useCallback, useEffect, useState } from 'react';
import { syncService } from '@/services/offline';
import type { SyncResponse } from '@/services/offline';

export type ConnectionStatus = 'online' | 'offline' | 'syncing';

export function useOfflineSync(eventId?: number): {
    status: ConnectionStatus;
    pendingCount: number;
    lastResult: SyncResponse | null;
    flush: () => Promise<void>;
} {
    const [status, setStatus] = useState<ConnectionStatus>(
        typeof navigator === 'undefined' || navigator.onLine
            ? 'online'
            : 'offline',
    );
    const [pendingCount, setPendingCount] = useState(0);
    const [lastResult, setLastResult] = useState<SyncResponse | null>(null);

    const refreshPending = useCallback(async () => {
        setPendingCount(await syncService.getPendingCount(eventId));
    }, [eventId]);

    const flush = useCallback(async () => {
        if (!syncService.isOnline()) {
            setStatus('offline');
            await refreshPending();

            return;
        }

        setStatus('syncing');

        try {
            const result = await syncService.sync();
            setLastResult(result);
            setStatus('online');
        } catch {
            setStatus(syncService.isOnline() ? 'online' : 'offline');
        } finally {
            await refreshPending();
        }
    }, [refreshPending]);

    useEffect(() => {
        void refreshPending();
        void flush();

        const onOnline = () => {
            setStatus('online');
            void flush();
        };
        const onOffline = () => {
            setStatus('offline');
        };

        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);

        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
        };
    }, [flush, refreshPending]);

    return { status, pendingCount, lastResult, flush };
}
