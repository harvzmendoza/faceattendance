<?php

namespace App\Support;

class FaceMatcher
{
    /**
     * @param  list<float|int>  $a
     * @param  list<float|int>  $b
     */
    public static function calculateDistance(array $a, array $b): float
    {
        if ($a === [] || count($a) !== count($b)) {
            return INF;
        }

        $sum = 0.0;

        foreach ($a as $index => $value) {
            $delta = (float) $value - (float) $b[$index];
            $sum += $delta * $delta;
        }

        return sqrt($sum);
    }

    /**
     * @param  list<float|int>  $descriptor
     * @param  list<array{id: int, descriptor: list<float|int>}>  $roster
     * @return array{id: int, distance: float}|null
     */
    public static function findMatch(array $descriptor, array $roster, float $threshold): ?array
    {
        $closestId = null;
        $closestDistance = null;

        foreach ($roster as $entry) {
            $distance = self::calculateDistance($descriptor, $entry['descriptor']);

            if ($closestDistance === null || $distance < $closestDistance) {
                $closestId = $entry['id'];
                $closestDistance = $distance;
            }
        }

        if ($closestId === null || $closestDistance === null || $closestDistance > $threshold) {
            return null;
        }

        return [
            'id' => $closestId,
            'distance' => $closestDistance,
        ];
    }
}
