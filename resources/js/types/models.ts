export type Paginated<T> = {
    data: T[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

export type StatusOption = {
    value: string;
    label: string;
};

export type EventSummary = {
    id: number;
    name: string;
    event_code: string;
    description: string | null;
    venue: string | null;
    starts_at: string;
    ends_at: string;
    status: 'draft' | 'active' | 'completed' | 'archived';
    participants_count?: number;
    attendance_records_count?: number;
};

export type ParticipantSummary = {
    id: number;
    registration_number: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    email: string | null;
    phone: string | null;
    organization: string | null;
    photo_path: string | null;
    photo_url: string | null;
    full_name: string;
    status: 'active' | 'inactive';
    events_count?: number;
};

export type AttendanceRecordSummary = {
    id: number;
    recorded_at: string;
    attendance_type: 'check_in' | 'check_out';
    participant: ParticipantSummary;
};
