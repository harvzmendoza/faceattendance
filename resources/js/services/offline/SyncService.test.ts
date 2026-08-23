import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/services/offline/db';
import { SyncService } from '@/services/offline/SyncService';
import type { SyncResponse } from '@/services/offline/http';

describe('offline queue and sync', () => {
    beforeEach(async () => {
        await db.delete();
        await db.open();
    });

    it('queues attendance locally and skips duplicates for the same session', async () => {
        const service = new SyncService();

        const first = await service.queueAttendance({
            event_id: 1,
            participant_id: 10,
            attendance_session_id: 5,
            session_type: 'check_in',
        });
        const duplicate = await service.queueAttendance({
            event_id: 1,
            participant_id: 10,
            attendance_session_id: 5,
            session_type: 'check_in',
        });

        expect(duplicate.local_id).toBe(first.local_id);
        expect(await service.getPendingCount(1)).toBe(1);
    });

    it('re-queues a synced row for the same person and session so it can sync again', async () => {
        const service = new SyncService();

        const first = await service.queueAttendance({
            event_id: 1,
            participant_id: 10,
            attendance_session_id: 5,
            session_type: 'check_in',
        });

        await db.attendance.put({
            ...first,
            sync_status: 'synced',
        });

        const again = await service.queueAttendance({
            event_id: 1,
            participant_id: 10,
            attendance_session_id: 5,
            session_type: 'check_in',
        });

        expect(again.local_id).toBe(first.local_id);
        expect(again.sync_status).toBe('pending');
        expect(await service.getPendingCount(1)).toBe(1);
    });

    it('queues a second row when the same person uses another session', async () => {
        const service = new SyncService();

        const checkIn = await service.queueAttendance({
            event_id: 1,
            participant_id: 10,
            attendance_session_id: 5,
            session_type: 'check_in',
        });
        const checkOut = await service.queueAttendance({
            event_id: 1,
            participant_id: 10,
            attendance_session_id: 6,
            session_type: 'check_out',
        });

        expect(checkOut.local_id).not.toBe(checkIn.local_id);
        expect(checkOut.attendance_type).toBe('check_out');
        expect(await service.getPendingCount(1)).toBe(2);
    });

    it('flushes the sync queue and marks accepted local ids as synced', async () => {
        const queued: string[] = [];
        const service = new SyncService({
            postJson: async (_url, body) => {
                const payload = body as { records: { local_id: string }[] };
                queued.push(
                    ...payload.records.map((record) => record.local_id),
                );

                return {
                    success: true,
                    synced: payload.records.length,
                    failed: 0,
                    duplicates: 0,
                    synced_local_ids: payload.records.map(
                        (record) => record.local_id,
                    ),
                    failed_local_ids: [],
                } satisfies SyncResponse;
            },
        });

        const row = await service.queueAttendance({
            event_id: 1,
            participant_id: 20,
            attendance_session_id: 5,
        });

        const result = await service.sync();

        expect(queued).toEqual([row.local_id]);
        expect(result?.synced).toBe(1);
        expect(await service.getPendingCount(1)).toBe(0);
        expect((await db.attendance.get(row.local_id))?.sync_status).toBe(
            'synced',
        );
    });
});
