import { sync } from '@/routes/attendance';
import type { RosterEntry } from '@/services/face-recognition/types';
import { db } from '@/services/offline/db';
import type {
    CachedEvent,
    CachedParticipant,
    LocalAttendance,
    SessionType,
    SyncStatus,
} from '@/services/offline/db';
import { postJson } from '@/services/offline/http';
import type { SyncPayloadRecord, SyncResponse } from '@/services/offline/http';

const BATCH_SIZE = 200;
const DEVICE_UUID_KEY = 'device_uuid';
const PREPARED_EVENT_ID_KEY = 'prepared_event_id';

export type QueueAttendanceInput = {
    event_id: number;
    participant_id: number;
    attendance_session_id: number;
    session_type?: SessionType;
    recorded_at?: string;
};

export function attendanceTypeForSession(
    type: SessionType | undefined,
): 'check_in' | 'check_out' {
    return type === 'check_out' ? 'check_out' : 'check_in';
}

export type SyncHttp = {
    postJson: typeof postJson;
};

export class SyncService {
    private flushing = false;
    private flushAgain = false;

    public constructor(private readonly http: SyncHttp = { postJson }) {}

    public isOnline(): boolean {
        return typeof navigator === 'undefined' || navigator.onLine !== false;
    }

    public async getOrCreateDeviceUuid(): Promise<string> {
        const existing = await db.settings.get(DEVICE_UUID_KEY);

        if (existing?.value) {
            return existing.value;
        }

        const value = crypto.randomUUID();
        await db.settings.put({ key: DEVICE_UUID_KEY, value });

        return value;
    }

    public async cacheRoster(
        eventId: number,
        entries: RosterEntry[],
    ): Promise<void> {
        await db.participants.bulkPut(
            entries.map((entry) => ({
                event_id: eventId,
                id: entry.id,
                full_name: entry.full_name,
                registration_number: entry.registration_number,
                photo_url: entry.photo_url,
                descriptor: entry.descriptor,
            })),
        );
    }

    public async getCachedRoster(eventId: number): Promise<RosterEntry[]> {
        const rows = await db.participants
            .where('event_id')
            .equals(eventId)
            .toArray();

        return rows.map((row: CachedParticipant) => ({
            id: row.id,
            full_name: row.full_name,
            registration_number: row.registration_number,
            photo_url: row.photo_url,
            descriptor: row.descriptor,
        }));
    }

    public async cacheEvent(event: CachedEvent): Promise<void> {
        await db.events.put(event);
        await db.settings.put({
            key: PREPARED_EVENT_ID_KEY,
            value: String(event.id),
        });
    }

    public async getCachedEvent(
        eventId: number,
    ): Promise<CachedEvent | undefined> {
        return db.events.get(eventId);
    }

    public async queueAttendance(
        input: QueueAttendanceInput,
    ): Promise<LocalAttendance> {
        const existing = await db.attendance
            .where('[event_id+participant_id+attendance_session_id]')
            .equals([
                input.event_id,
                input.participant_id,
                input.attendance_session_id,
            ])
            .first();

        if (existing) {
            if (existing.sync_status === 'synced') {
                const pending: LocalAttendance = {
                    ...existing,
                    sync_status: 'pending',
                };

                await db.attendance.put(pending);

                return pending;
            }

            return existing;
        }

        const row: LocalAttendance = {
            local_id: crypto.randomUUID(),
            event_id: input.event_id,
            participant_id: input.participant_id,
            attendance_session_id: input.attendance_session_id,
            attendance_type: attendanceTypeForSession(input.session_type),
            recorded_at: input.recorded_at ?? new Date().toISOString(),
            sync_status: 'pending',
        };

        await db.attendance.put(row);

        return row;
    }

    public async getPendingCount(eventId?: number): Promise<number> {
        if (eventId === undefined) {
            return db.attendance
                .where('sync_status')
                .anyOf(['pending', 'syncing', 'failed'])
                .count();
        }

        return db.attendance
            .where('[event_id+sync_status]')
            .anyOf([
                [eventId, 'pending'],
                [eventId, 'syncing'],
                [eventId, 'failed'],
            ])
            .count();
    }

    public async getPendingParticipantIds(eventId: number): Promise<number[]> {
        const rows = await db.attendance
            .where('[event_id+sync_status]')
            .anyOf([
                [eventId, 'pending'],
                [eventId, 'syncing'],
            ])
            .toArray();

        return [...new Set(rows.map((row) => row.participant_id))];
    }

    public async retryFailed(): Promise<SyncResponse | null> {
        await db.attendance
            .where('sync_status')
            .equals('failed')
            .modify({
                sync_status: 'pending' satisfies SyncStatus,
            });

        return this.sync();
    }

    public async sync(): Promise<SyncResponse | null> {
        if (!this.isOnline()) {
            return null;
        }

        if (this.flushing) {
            this.flushAgain = true;

            return null;
        }

        this.flushing = true;

        try {
            return await this.flushPending();
        } finally {
            this.flushing = false;

            if (this.flushAgain) {
                this.flushAgain = false;
                void this.sync();
            }
        }
    }

    private async flushPending(): Promise<SyncResponse> {
        const pending = await db.attendance
            .where('sync_status')
            .anyOf(['pending', 'failed'])
            .limit(BATCH_SIZE)
            .toArray();

        if (pending.length === 0) {
            return {
                success: true,
                synced: 0,
                failed: 0,
                duplicates: 0,
            };
        }

        const localIds = pending.map((row) => row.local_id);
        await db.attendance
            .where('local_id')
            .anyOf(localIds)
            .modify({
                sync_status: 'syncing' satisfies SyncStatus,
            });

        const deviceId = await this.getOrCreateDeviceUuid();
        const records: SyncPayloadRecord[] = pending.map((row) => ({
            local_id: row.local_id,
            event_id: row.event_id,
            participant_id: row.participant_id,
            attendance_session_id: row.attendance_session_id,
            attendance_type: row.attendance_type,
            recorded_at: row.recorded_at,
        }));

        try {
            const response = await this.http.postJson<SyncResponse>(
                sync.url(),
                {
                    device_id: deviceId,
                    records,
                },
            );

            const syncedIds = response.synced_local_ids ?? [];
            const failedIds = response.failed_local_ids ?? [];

            if (syncedIds.length > 0) {
                await db.attendance
                    .where('local_id')
                    .anyOf(syncedIds)
                    .modify({
                        sync_status: 'synced' satisfies SyncStatus,
                    });
            }

            if (failedIds.length > 0) {
                await db.attendance
                    .where('local_id')
                    .anyOf(failedIds)
                    .modify({
                        sync_status: 'failed' satisfies SyncStatus,
                    });
            }

            const accounted = new Set([...syncedIds, ...failedIds]);
            const leftover = localIds.filter((id) => !accounted.has(id));

            if (leftover.length > 0) {
                await db.attendance
                    .where('local_id')
                    .anyOf(leftover)
                    .modify({
                        sync_status: 'pending' satisfies SyncStatus,
                    });
            }

            return response;
        } catch {
            await db.attendance
                .where('local_id')
                .anyOf(localIds)
                .modify({
                    sync_status: 'pending' satisfies SyncStatus,
                });

            throw new Error('Synchronization failed.');
        }
    }
}

export const syncService = new SyncService();
