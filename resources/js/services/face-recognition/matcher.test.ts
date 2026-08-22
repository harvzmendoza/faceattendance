import { describe, expect, it } from 'vitest';
import {
    calculateDistance,
    findMatch,
} from '@/services/face-recognition/matcher';
import type { RosterEntry } from '@/services/face-recognition/types';

function descriptor(offset = 0): number[] {
    return Array.from({ length: 128 }, (_, index) => index * 0.001 + offset);
}

function entry(id: number, offset = 0): RosterEntry {
    return {
        id,
        full_name: `Participant ${id}`,
        registration_number: `REG-${id}`,
        photo_url: null,
        descriptor: descriptor(offset),
    };
}

describe('recognition matching', () => {
    it('returns a zero distance for identical descriptors', () => {
        const values = descriptor();

        expect(calculateDistance(values, values)).toBe(0);
    });

    it('returns the closest roster entry within the threshold', () => {
        const match = findMatch(
            descriptor(),
            [entry(2, 0.8), entry(1, 0.01)],
            0.5,
        );

        expect(match?.participant.id).toBe(1);
        expect(match?.distance).toBeLessThan(0.5);
    });

    it('returns null when every candidate is above the threshold', () => {
        expect(findMatch(descriptor(), [entry(1, 0.9)], 0.5)).toBeNull();
    });
});
