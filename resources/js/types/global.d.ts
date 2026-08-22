import type { AttendanceConfig } from '@/services/face-recognition/types';
import type { Auth } from '@/types/auth';

declare module 'react' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            attendance: AttendanceConfig;
            flash: {
                success: string | null;
                error: string | null;
                import_errors: string[] | null;
            };
            [key: string]: unknown;
        };
    }
}
