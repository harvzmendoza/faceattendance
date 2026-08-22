import Dexie from 'dexie';
import type { Table } from 'dexie';

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export type CachedParticipant = {
    event_id: number;
    id: number;
    full_name: string;
    registration_number: string;
    photo_url: string | null;
    descriptor: number[];
};

export type CachedEvent = {
    id: number;
    name: string;
    event_code: string;
    status: string;
    registered_count: number;
};

export type LocalAttendance = {
    local_id: string;
    event_id: number;
    participant_id: number;
    attendance_type: 'check_in';
    recorded_at: string;
    sync_status: SyncStatus;
};

export type SettingRow = {
    key: string;
    value: string;
};

class FaceAttendanceDatabase extends Dexie {
    participants!: Table<CachedParticipant, [number, number]>;
    attendance!: Table<LocalAttendance, string>;
    settings!: Table<SettingRow, string>;
    events!: Table<CachedEvent, number>;

    public constructor() {
        super('face-attendance');

        this.version(1).stores({
            participants: '[event_id+id], event_id, id',
            attendance:
                'local_id, sync_status, event_id, [event_id+sync_status], [event_id+participant_id]',
            settings: 'key',
        });

        this.version(2).stores({
            events: 'id',
        });
    }
}

export const db = new FaceAttendanceDatabase();
