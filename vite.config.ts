import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import { copyFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function copyServiceWorkerToPublicRoot(): Plugin {
    return {
        name: 'copy-service-worker-to-public-root',
        apply: 'build',
        closeBundle: {
            sequential: true,
            order: 'post',
            handler(): void {
                const buildDir = resolve('public/build');
                const swSource = resolve(buildDir, 'sw.js');

                if (!existsSync(swSource)) {
                    return;
                }

                copyFileSync(swSource, resolve('public/sw.js'));

                for (const file of readdirSync(buildDir)) {
                    if (file.startsWith('workbox-') && file.endsWith('.js')) {
                        copyFileSync(
                            resolve(buildDir, file),
                            resolve('public', file),
                        );
                    }
                }
            },
        },
    };
}

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
            fonts: [
                bunny('Instrument Sans', {
                    weights: [400, 500, 600],
                }),
            ],
        }),
        inertia(),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: false,
            includeAssets: [
                'favicon.ico',
                'favicon.svg',
                'apple-touch-icon.png',
            ],
            manifest: {
                name: 'Face Attendance',
                short_name: 'Attendance',
                display: 'standalone',
                start_url: '/attendance',
                scope: '/',
                background_color: '#09090b',
                theme_color: '#18181b',
                icons: [
                    {
                        src: '/favicon.svg',
                        sizes: 'any',
                        type: 'image/svg+xml',
                        purpose: 'any',
                    },
                    {
                        src: '/apple-touch-icon.png',
                        sizes: '180x180',
                        type: 'image/png',
                    },
                ],
            },
            workbox: {
                navigateFallback: null,
                globPatterns: ['**/*.{js,css,ico,png,svg,webp,woff,woff2}'],
                modifyURLPrefix: {
                    '': '/build/',
                },
                runtimeCaching: [
                    {
                        urlPattern: /\/models\//i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'face-models',
                            expiration: {
                                maxEntries: 20,
                                maxAgeSeconds: 60 * 60 * 24 * 365,
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                    {
                        urlPattern: /\/storage\//i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'participant-photos',
                            expiration: {
                                maxEntries: 500,
                                maxAgeSeconds: 60 * 60 * 24 * 30,
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                ],
            },
            devOptions: {
                enabled: false,
            },
        }),
        copyServiceWorkerToPublicRoot(),
    ],
});
