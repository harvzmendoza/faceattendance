import { faceErrorMessages } from '@/services/face-recognition/types';

export async function requestCameraStream(): Promise<MediaStream> {
    if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(faceErrorMessages.camera_denied);
    }

    try {
        return await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 },
            },
        });
    } catch {
        throw new Error(faceErrorMessages.camera_denied);
    }
}

export function stopMediaStream(stream: MediaStream | null): void {
    stream?.getTracks().forEach((track) => {
        track.stop();
    });
}

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        const url = URL.createObjectURL(file);

        image.onload = () => {
            URL.revokeObjectURL(url);
            resolve(image);
        };
        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error(faceErrorMessages.too_blurry));
        };
        image.src = url;
    });
}
