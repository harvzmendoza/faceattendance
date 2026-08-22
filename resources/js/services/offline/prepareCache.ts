const PREPARE_CACHE = 'prepare-device';

const MODEL_FILES = [
    'ssd_mobilenetv1_model-weights_manifest.json',
    'ssd_mobilenetv1_model.bin',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model.bin',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model.bin',
];

export function modelUrls(modelsUrl: string): string[] {
    const base = modelsUrl.replace(/\/$/, '');

    return MODEL_FILES.map((file) => `${base}/${file}`);
}

export async function cacheUrls(
    urls: string[],
    { required }: { required: boolean },
): Promise<void> {
    const cache = await caches.open(PREPARE_CACHE);
    const unique = [...new Set(urls.filter((url) => url.length > 0))];

    await Promise.all(
        unique.map(async (url) => {
            try {
                const response = await fetch(url, {
                    credentials: 'same-origin',
                    cache: 'reload',
                });

                if (!response.ok) {
                    throw new Error(`Unable to cache ${url}.`);
                }

                await cache.put(url, response);
            } catch (error) {
                if (required) {
                    throw error;
                }
            }
        }),
    );
}

export async function cacheDocuments(urls: string[]): Promise<void> {
    const cache = await caches.open(PREPARE_CACHE);

    await Promise.all(
        urls.map(async (url) => {
            const response = await fetch(url, {
                credentials: 'same-origin',
                cache: 'reload',
                headers: {
                    Accept: 'text/html',
                },
            });

            if (!response.ok) {
                throw new Error('Unable to cache attendance pages.');
            }

            await cache.put(url, response);
        }),
    );
}
