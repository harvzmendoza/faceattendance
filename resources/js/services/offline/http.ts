export type SyncPayloadRecord = {
    local_id: string;
    event_id: number;
    participant_id: number;
    attendance_session_id?: number;
    attendance_type: 'check_in' | 'check_out';
    recorded_at: string;
};

export type SyncResponse = {
    success: boolean;
    synced: number;
    failed: number;
    duplicates: number;
    synced_local_ids?: string[];
    failed_local_ids?: string[];
};

function csrfToken(): string {
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);

    return match ? decodeURIComponent(match[1]) : '';
}

export async function getJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': csrfToken(),
        },
    });

    const data = (await response.json().catch(() => null)) as T | null;

    if (!response.ok || data === null) {
        throw new Error('Unable to download the offline package.');
    }

    return data;
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': csrfToken(),
        },
        body: JSON.stringify(body),
    });

    const data = (await response.json().catch(() => null)) as T | null;

    if (!response.ok) {
        throw new Error('Synchronization failed.');
    }

    if (data === null) {
        throw new Error('Synchronization failed.');
    }

    return data;
}
