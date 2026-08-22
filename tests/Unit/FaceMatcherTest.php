<?php

use App\Support\FaceMatcher;

test('euclidean distance is zero for identical descriptors', function () {
    $descriptor = sampleFaceDescriptor();

    expect(FaceMatcher::calculateDistance($descriptor, $descriptor))->toBe(0.0);
});

test('findMatch returns the closest descriptor within the threshold', function () {
    $probe = sampleFaceDescriptor();
    $close = sampleFaceDescriptor(0.01);
    $far = sampleFaceDescriptor(0.8);

    $match = FaceMatcher::findMatch($probe, [
        ['id' => 2, 'descriptor' => $far],
        ['id' => 1, 'descriptor' => $close],
    ], 0.5);

    expect($match)->not->toBeNull()
        ->and($match['id'])->toBe(1)
        ->and($match['distance'])->toBeLessThan(0.5);
});

test('findMatch returns null when every candidate is above the threshold', function () {
    $match = FaceMatcher::findMatch(sampleFaceDescriptor(), [
        ['id' => 1, 'descriptor' => sampleFaceDescriptor(0.9)],
    ], 0.5);

    expect($match)->toBeNull();
});
