// ==================== GAME CONFIGURATION ====================
// Edit this file to configure your game.

const GAME = {
    title: 'SPACE FIGHTER',
    subtitle: 'GUARD THE GALAXY',
    version: 'v14',
    bgColor: '#02040d',

    // Firebase - see README.md for setup instructions
    // Leave as-is to use local-only high scores
    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: "",
        appId: ""
    },
    firebasePath: 'highscores',
    localStoragePrefix: 'spaceFighter',

    // Canvas resolution (384x216 = SNES-style, recommended)
    width: 384,
    height: 216,

    // Touch controls - each becomes a button on mobile
    // id: used as Engine.input[id]
    // label: button text
    // keys: keyboard codes that map to this control
    controls: [
        { id: 'up',    label: 'UP',    keys: ['ArrowUp',    'KeyW'] },
        { id: 'down',  label: 'DOWN',  keys: ['ArrowDown',  'KeyS'] },
        { id: 'left',  label: 'LEFT',  keys: ['ArrowLeft',  'KeyA'] },
        { id: 'right', label: 'RIGHT', keys: ['ArrowRight', 'KeyD'] },
        { id: 'fire',  label: 'FIRE',  keys: ['Space'] },
        { id: 'bomb',  label: 'BOMB',  keys: ['ShiftLeft', 'ShiftRight'] }
    ],

    // Desktop instructions (hidden on touch devices)
    instructions: [
        { label: 'MOVE', keys: 'Arrow Keys or WASD' },
        { label: 'FIRE', keys: 'Space' },
        { label: 'BOMB', keys: 'Shift' },
        { label: 'CRT',  keys: 'C' }
    ]
};
