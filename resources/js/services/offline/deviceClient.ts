import { heartbeat, register } from '@/routes/devices';
import { syncService } from '@/services/offline';
import { postJson } from '@/services/offline/http';

export type DevicePayload = {
    id: number;
    device_uuid: string;
    name: string;
    location: string | null;
    event_id: number | null;
    event_name: string | null;
    status: string;
    presence: string;
    last_seen_at: string | null;
    last_sync_at: string | null;
    pending_count: number;
};

export async function registerDevice(eventId?: number): Promise<DevicePayload> {
    const deviceUuid = await syncService.getOrCreateDeviceUuid();

    return postJson<DevicePayload>(register.url(), {
        device_uuid: deviceUuid,
        name: `REG-${deviceUuid.slice(0, 8).toUpperCase()}`,
        event_id: eventId ?? null,
    });
}

export async function sendDeviceHeartbeat(
    eventId?: number,
    pendingCount = 0,
): Promise<DevicePayload> {
    const deviceUuid = await syncService.getOrCreateDeviceUuid();

    return postJson<DevicePayload>(heartbeat.url(), {
        device_uuid: deviceUuid,
        event_id: eventId ?? null,
        pending_count: pendingCount,
    });
}
