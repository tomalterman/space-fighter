// ==================== GAME SOUNDS ====================
// Define sounds as functions that receive the Sound engine (S).
// Use S.playTone(startFreq, endFreq, duration, waveType, volume)
// and S.playNoise(duration, startFreq, endFreq)

const SOUNDS = {
    start: (S) => {
        S.playTone(440, 660, 0.08, 'square', 0.25);
        setTimeout(() => S.playTone(660, 880, 0.08, 'square', 0.25), 80);
        setTimeout(() => S.playTone(880, 1320, 0.14, 'square', 0.25), 160);
    },

    gameOver: (S) => {
        S.playTone(520, 260, 0.25, 'square', 0.3);
        setTimeout(() => S.playTone(360, 180, 0.25, 'square', 0.3), 140);
        setTimeout(() => S.playTone(220, 90,  0.45, 'square', 0.3), 280);
        setTimeout(() => S.playNoise(0.5, 400, 60), 280);
    },

    shoot: (S) => {
        S.playTone(1400, 900, 0.05, 'square', 0.12);
    },

    laser: (S) => {
        S.playTone(1800, 1200, 0.06, 'sine', 0.18);
    },

    enemyShoot: (S) => {
        S.playTone(380, 220, 0.07, 'sawtooth', 0.12);
    },

    hit: (S) => {
        S.playNoise(0.05, 1200, 400);
    },

    explode: (S) => {
        S.playNoise(0.18, 900, 80);
        S.playTone(220, 60, 0.2, 'sawtooth', 0.3);
    },

    bigExplode: (S) => {
        S.playNoise(0.4, 1400, 40);
        S.playTone(180, 40, 0.4, 'sawtooth', 0.4);
        setTimeout(() => S.playNoise(0.25, 800, 60), 60);
    },

    powerup: (S) => {
        S.playTone(600, 900, 0.06, 'square', 0.25);
        setTimeout(() => S.playTone(900, 1200, 0.06, 'square', 0.25), 60);
        setTimeout(() => S.playTone(1200, 1600, 0.1, 'square', 0.25), 120);
    },

    bomb: (S) => {
        S.playNoise(0.6, 2000, 40);
        S.playTone(500, 60, 0.6, 'sawtooth', 0.45);
        setTimeout(() => S.playNoise(0.4, 1200, 30), 100);
    },

    menuBlip: (S) => {
        S.playTone(800, 1000, 0.05, 'square', 0.2);
    },

    extend: (S) => {
        S.playTone(700, 900, 0.08, 'square', 0.28);
        setTimeout(() => S.playTone(900, 1100, 0.08, 'square', 0.28), 80);
        setTimeout(() => S.playTone(1100, 1400, 0.08, 'square', 0.28), 160);
        setTimeout(() => S.playTone(1400, 1800, 0.14, 'square', 0.28), 240);
    }
};
