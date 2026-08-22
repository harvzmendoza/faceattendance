export type UserRole = 'admin' | 'attendance_operator';

export type User = {
    id: number;
    name: string;
    email: string;
    role: UserRole;
};

export type Auth = {
    user: User | null;
};
