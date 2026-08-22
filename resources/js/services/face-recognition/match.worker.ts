import { findMatch } from '@/services/face-recognition/matcher';
import type { RosterEntry } from '@/services/face-recognition/types';

type WorkerRequest =
    | {
          type: 'setRoster';
          roster: RosterEntry[];
          threshold: number;
      }
    | {
          type: 'match';
          requestId: number;
          descriptor: number[];
      };

type WorkerResponse = {
    type: 'matchResult';
    requestId: number;
    match: ReturnType<typeof findMatch>;
};

type MatchWorkerScope = {
    onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
    postMessage: (message: WorkerResponse) => void;
};

const scope = globalThis as unknown as MatchWorkerScope;

let roster: RosterEntry[] = [];
let threshold = 0.5;

scope.onmessage = (event: MessageEvent<WorkerRequest>): void => {
    const message = event.data;

    if (message.type === 'setRoster') {
        roster = message.roster;
        threshold = message.threshold;

        return;
    }

    if (message.type === 'match') {
        scope.postMessage({
            type: 'matchResult',
            requestId: message.requestId,
            match: findMatch(message.descriptor, roster, threshold),
        });
    }
};
