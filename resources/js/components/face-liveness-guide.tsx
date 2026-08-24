import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { Ref } from 'react';
import { cn } from '@/lib/utils';
import { guideGeometry } from '@/services/face-recognition/liveness';

export function FaceLivenessGuide({
    ref,
    progress,
    instruction,
    verified = false,
    className,
}: {
    ref?: Ref<HTMLDivElement>;
    progress: number;
    instruction: string;
    verified?: boolean;
    className?: string;
}) {
    const maskId = useId();
    const rootRef = useRef<HTMLDivElement | null>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });
    const clamped = Math.min(1, Math.max(0, progress));
    const geometry = guideGeometry(size.width, size.height);
    const circumference = 2 * Math.PI * geometry.circleRadius;

    useLayoutEffect(() => {
        const node = rootRef.current;

        if (node === null) {
            return;
        }

        const update = (): void => {
            setSize({
                width: node.clientWidth,
                height: node.clientHeight,
            });
        };

        update();

        const observer = new ResizeObserver(update);
        observer.observe(node);

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <div
            ref={(node) => {
                rootRef.current = node;

                if (typeof ref === 'function') {
                    ref(node);
                } else if (ref) {
                    ref.current = node;
                }
            }}
            className={cn('pointer-events-none absolute inset-0', className)}
        >
            {size.width > 0 && size.height > 0 && (
                <svg
                    className="h-full w-full"
                    viewBox={`0 0 ${size.width} ${size.height}`}
                    preserveAspectRatio="none"
                    aria-hidden="true"
                >
                    <defs>
                        <mask id={maskId}>
                            <rect
                                width={size.width}
                                height={size.height}
                                fill="white"
                            />
                            <circle
                                cx={geometry.circleCx}
                                cy={geometry.circleCy}
                                r={geometry.circleRadius}
                                fill="black"
                            />
                        </mask>
                    </defs>
                    <rect
                        width={size.width}
                        height={size.height}
                        className="fill-black/70"
                        mask={`url(#${maskId})`}
                    />
                    <circle
                        cx={geometry.circleCx}
                        cy={geometry.circleCy}
                        r={geometry.circleRadius}
                        fill="none"
                        className="stroke-white/25"
                        strokeWidth={6}
                    />
                    <circle
                        cx={geometry.circleCx}
                        cy={geometry.circleCy}
                        r={geometry.circleRadius}
                        fill="none"
                        className={
                            verified ? 'stroke-emerald-400' : 'stroke-white'
                        }
                        strokeWidth={6}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference * (1 - clamped)}
                        transform={`rotate(-90 ${geometry.circleCx} ${geometry.circleCy})`}
                        style={{
                            transition: 'stroke-dashoffset 200ms ease-out',
                        }}
                    />
                </svg>
            )}
            <p
                className={cn(
                    'absolute inset-x-4 bottom-4 text-center text-2xl font-semibold tracking-tight text-white drop-shadow-md md:text-3xl',
                    verified && 'text-emerald-300',
                )}
            >
                {instruction}
            </p>
        </div>
    );
}
