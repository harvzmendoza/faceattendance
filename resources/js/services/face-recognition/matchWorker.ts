import type {
    MatchResult,
    RosterEntry,
} from '@/services/face-recognition/types';
import { findMatch } from '@/services/face-recognition/matcher';

type WorkerResponse = {
    type: 'matchResult';
    requestId: number;
    match: MatchResult | null;
};

let worker: Worker | null = null;
let roster: RosterEntry[] = [];
let threshold = 0.5;
let requestId = 0;
const pending = new Map<number, (match: MatchResult | null) => void>();

function getWorker(): Worker | null {
    if (typeof Worker === 'undefined') {
        return null;
    }

    if (worker === null) {
        worker = new Worker(new URL('./match.worker.ts', import.meta.url), {
            type: 'module',
        });

        worker.onmessage = (event: MessageEvent<WorkerResponse>): void => {
            const resolve = pending.get(event.data.requestId);

            if (resolve === undefined) {
                return;
            }

            pending.delete(event.data.requestId);
            resolve(event.data.match);
        };
    }

    return worker;
}

export function setMatchRoster(
    nextRoster: RosterEntry[],
    nextThreshold: number,
): void {
    roster = nextRoster;
    threshold = nextThreshold;
    getWorker()?.postMessage({
        type: 'setRoster',
        roster: nextRoster,
        threshold: nextThreshold,
    });
}

export function matchDescriptor(
    descriptor: number[],
): Promise<MatchResult | null> {
    const activeWorker = getWorker();

    if (activeWorker === null) {
        return Promise.resolve(findMatch(descriptor, roster, threshold));
    }

    requestId += 1;
    const id = requestId;

    return new Promise((resolve) => {
        pending.set(id, resolve);
        activeWorker.postMessage({
            type: 'match',
            requestId: id,
            descriptor,
        });
    });
}
