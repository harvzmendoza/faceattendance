export function unlockSpeech(): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
        return;
    }

    window.speechSynthesis.cancel();
    const unlock = new SpeechSynthesisUtterance(' ');
    unlock.volume = 0;
    window.speechSynthesis.speak(unlock);
}

export function speakThankYou(): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
        return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance('Thank you');
    utterance.lang = 'en-US';
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
}
