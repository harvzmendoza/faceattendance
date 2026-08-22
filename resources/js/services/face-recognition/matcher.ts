import type {
    MatchResult,
    RosterEntry,
} from '@/services/face-recognition/types';

export function calculateDistance(a: number[], b: number[]): number {
    if (a.length === 0 || a.length !== b.length) {
        return Number.POSITIVE_INFINITY;
    }

    let sum = 0;

    for (let index = 0; index < a.length; index++) {
        const delta = a[index] - b[index];
        sum += delta * delta;
    }

    return Math.sqrt(sum);
}

export function findMatch(
    descriptor: number[],
    roster: RosterEntry[],
    threshold: number,
): MatchResult | null {
    let closest: MatchResult | null = null;

    for (const participant of roster) {
        const distance = calculateDistance(descriptor, participant.descriptor);

        if (closest === null || distance < closest.distance) {
            closest = { participant, distance };
        }
    }

    if (closest === null || closest.distance > threshold) {
        return null;
    }

    return closest;
}
