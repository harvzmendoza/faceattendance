import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ScanOverlayBox = {
    key: string;
    left: number;
    top: number;
    width: number;
    height: number;
    active: boolean;
    name: string | null;
};

export function FaceScanOverlay({ faces }: { faces: ScanOverlayBox[] }) {
    return (
        <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
            {faces.map((face) => {
                const labelAbove = face.top > 64;

                return (
                    <div
                        key={face.key}
                        className={cn(
                            'absolute rounded-md border-2',
                            face.active
                                ? 'border-emerald-400'
                                : 'border-zinc-400/80',
                        )}
                        style={{
                            left: face.left,
                            top: face.top,
                            width: face.width,
                            height: face.height,
                        }}
                    >
                        {face.active && face.name && (
                            <div
                                className={cn(
                                    'absolute left-0 max-w-56 min-w-full',
                                    labelAbove
                                        ? 'bottom-full mb-1'
                                        : 'top-full mt-1',
                                )}
                            >
                                <p className="truncate text-sm font-semibold tracking-wide text-white drop-shadow-md">
                                    {face.name}
                                </p>
                                <p className="flex items-center gap-1 text-xs font-medium text-emerald-300 drop-shadow-md">
                                    <Check className="size-3.5" />
                                    Recognized
                                </p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
