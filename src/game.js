// ==================== GAME LOGIC: SPACE FIGHTER ====================
// Vertical-scrolling top-down shoot-'em-up in the late-90s arcade tradition.
// Pure procedural Canvas + Web Audio. All game code lives in this file.
// Engine API used: Engine.input, Engine.state, Engine.spawnParticle,
// Engine.showScorePopup, Engine.Sound, HighScores.scores.
// First ship version: bump GAME.version and start commit message with "vN:".

// =====================================================================
// CONSTANTS / PALETTE
// =====================================================================

const COLOR = {
    SPACE_BG:     '#02040d',
    SPACE_DUST:   '#0c1230',
    STAR_DIM:     '#3a4570',
    STAR_MID:     '#9eaedc',
    STAR_HI:      '#ffffff',

    NEBULA_DEEP:  '#170433',
    NEBULA_MID:   '#311152',
    NEBULA_HI:    '#5a2280',
    NEBULA_PINK:  '#a23cb8',
    NEBULA_CYAN:  '#3f5fb4',

    ASTEROID_DARK:'#1e1a26',
    ASTEROID_MID: '#39323f',
    ASTEROID_HI:  '#5e545f',
    ASTEROID_LIT: '#a2939a',
    ASTEROID_DEEP:'#0e0b14',

    STATION_DARK: '#0a1426',
    STATION_MID:  '#1a2a4a',
    STATION_HI:   '#2f4675',
    STATION_NEON: '#5dffea',
    STATION_NEON2:'#ff5de4',

    PLAYER_BODY:  '#3a78ff',
    PLAYER_LIGHT: '#7ba8ff',
    PLAYER_NOSE:  '#cfe1ff',
    PLAYER_WING:  '#7d8597',
    PLAYER_WING_HI:'#b5bccd',
    PLAYER_COCKPIT:'#ff3b6e',
    PLAYER_COCKPIT_HI:'#ffc4d4',
    JET_CORE:     '#ffffff',
    JET_OUTER:    '#5fd2ff',

    BULLET_VULCAN:'#ff66dd',
    BULLET_VULCAN_HI:'#ffffff',
    BULLET_LASER: '#7df9ff',
    BULLET_LASER_HI:'#ffffff',

    EBULLET_PINK: '#ff3aa0',
    EBULLET_PINK_GLOW:'#ff95cf',
    EBULLET_BLUE: '#3a9bff',
    EBULLET_BLUE_GLOW:'#88c8ff',

    EXPLODE_GREEN:'#5dff7a',
    EXPLODE_YELLOW:'#fff37a',
    EXPLODE_RED:  '#ff5b3a',
    EXPLODE_WHITE:'#ffffff',
    MUZZLE:       '#ffffff',

    POWER_RED:    '#ff4444',
    POWER_BLUE:   '#3a9bff',
    POWER_GOLD:   '#ffd23a',
    POWER_GREEN:  '#7df97a',
    POWER_BOMB:   '#ff8a2a',

    HUD_TEXT:     '#ffffff',
    HUD_HI:       '#ffd23a',
    HUD_LABEL:    '#9faec5',

    POPCORN_BODY: '#ff3b3b',
    POPCORN_HI:   '#ffb0a0',
    POPCORN_DARK: '#7a0d0d',
    POPCORN_HALO: '#ffd2a0',
    TURRET_BASE:  '#9da9bf',
    TURRET_DARK:  '#1c2230',
    TURRET_GUN:   '#e8f0ff',
    TURRET_LIGHT: '#ffeb3a',
    TURRET_HALO:  '#5dffea',
    BOMBER_BODY:  '#c460e0',
    BOMBER_HI:    '#ffb3ff',
    BOMBER_DARK:  '#2a0d3a',
    BOMBER_COCK:  '#ffeb3a',
    BOMBER_HALO:  '#ff5de4'
};

const TILE = 16;

const PLAYER_SPEED          = 2.4;
const PLAYER_FIRE_COOLDOWN  = 6;
const LASER_FIRE_COOLDOWN   = 5;
const PLAYER_HITBOX_OFFSET  = -2;
const RESPAWN_INVULN        = 90;
const RESPAWN_X_FRAC        = 0.5;
const RESPAWN_Y             = 178;
const STARTING_LIVES        = 3;
const MAX_LIVES             = 5;
const STARTING_BOMBS        = 2;
const MAX_BOMBS             = 6;
const STARTING_POWER        = 1;
const MAX_POWER             = 5;

const VULCAN_BULLET_SPEED   = 6;
const LASER_BULLET_SPEED    = 9;

const ENEMY_BULLET_BASE_SPEED = 1.25;

// Warmup ramps difficulty from "very easy" to "normal" over the first
// chunk of a run so the player has time to settle in.
const WARMUP_DISTANCE       = 1600;
const WARMUP_START          = 0.55;

const POWERUP_SPEED         = 0.9;

const SCROLL_SPEED          = 0.8;

const BOMB_FRAMES           = 38;
const BOMB_FLASH_CUTOFF     = 22;

const SHAKE_FRAMES          = 22;
const SHAKE_MAGNITUDE       = 5;

const EXTEND_FIRST          = 30000;
const EXTEND_INTERVAL       = 80000;

const ENEMY_STATS = {
    popcorn: { w: 14, h: 14, hp: 1,  score: 50,   fireCdMin: 140, fireCdMax: 240, dropChance: 0.06 },
    turret:  { w: 22, h: 20, hp: 3,  score: 200,  fireCdMin: 80,  fireCdMax: 150, dropChance: 0.30 },
    bomber:  { w: 30, h: 28, hp: 5,  score: 1000, fireCdMin: 90,  fireCdMax: 150, dropChance: 1.00 }
};

// Wave timeline. `at` is "scroll units since the last loop reset"; the
// schedule replays endlessly with bumped difficulty each loop.
const WAVE_SCHEDULE = [
    { at: 140,  kind: 'vFormation',    count: 3 },
    { at: 340,  kind: 'vFormation',    count: 4 },
    { at: 540,  kind: 'sineSweep',     count: 4, amp: 60 },
    { at: 720,  kind: 'sineSweep',     count: 5, amp: 70 },
    { at: 900,  kind: 'turretOnTerrain', offsets: [80, 304] },
    { at: 1080, kind: 'vFormation',    count: 6 },
    { at: 1260, kind: 'sineSweep',     count: 6, amp: 90 },
    { at: 1440, kind: 'bomber' },
    { at: 1620, kind: 'sineSweep',     count: 7, amp: 90 },
    { at: 1800, kind: 'turretOnTerrain', offsets: [60, 192, 324] },
    { at: 1980, kind: 'vFormation',    count: 8 },
    { at: 2160, kind: 'sineSweep',     count: 7, amp: 100 },
    { at: 2340, kind: 'bomber' },
    { at: 2520, kind: 'turretOnTerrain', offsets: [40, 130, 254, 344] }
];

const POWERUP_KINDS = ['P', 'P', 'P', 'red', 'blue', 'gold', 'B'];

// =====================================================================
// MODULE STATE
// =====================================================================

let player = null;
let playerBullets = [];
let enemies = [];
let enemyBullets = [];
let powerups = [];
let explosions = [];

let scrollY = 0;
let waveBaseY = 0;
let nextWaveIndex = 0;
let difficultyLoop = 0;

let bombFlash = 0;
let bombCount = STARTING_BOMBS;

let shakeFrames = 0;
let shakeOffsetX = 0;
let shakeOffsetY = 0;

let crtOn = false;
let crtListenerAttached = false;

let nextExtendScore = EXTEND_FIRST;

// Attract-mode demo state — fully separate from real gameplay state.
let demoState = null;
let demoLastTime = 0;

// =====================================================================
// LIFECYCLE
// =====================================================================

function gameInit() {
    Engine.state.health = STARTING_LIVES;
    Engine.state.maxHealth = MAX_LIVES;
    Engine.state.score = 0;

    player = makePlayer();
    playerBullets = [];
    enemies = [];
    enemyBullets = [];
    powerups = [];
    explosions = [];

    scrollY = 0;
    waveBaseY = 0;
    nextWaveIndex = 0;
    difficultyLoop = 0;

    bombFlash = 0;
    bombCount = STARTING_BOMBS;

    shakeFrames = 0;
    shakeOffsetX = 0;
    shakeOffsetY = 0;

    nextExtendScore = EXTEND_FIRST;

    // Attach the CRT toggle listener once. gameInit runs on every restart;
    // the guard prevents duplicate listeners stacking up.
    if (!crtListenerAttached) {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyC') crtOn = !crtOn;
        });
        crtListenerAttached = true;
    }

    // Drop the attract demo so it does not bleed into a real run.
    demoState = null;
}

function gameUpdate(dt) {
    scrollY += SCROLL_SPEED * dt;

    updatePlayer(dt);
    updatePlayerBullets(dt);
    updateEnemies(dt);
    updateEnemyBullets(dt);
    updatePowerups(dt);
    updateExplosions(dt);
    updateBombFlash(dt);
    updateWaves(dt);
    updateShake(dt);

    collidePlayerBulletsVsEnemies();
    collideEnemyBulletsVsPlayer();
    collidePlayerVsEnemyBodies();
    collidePlayerVsPowerups();

    checkExtendLife();
}

function gameRender(ctx, w, h) {
    ctx.save();
    if (shakeFrames > 0) {
        ctx.translate(shakeOffsetX, shakeOffsetY);
    }

    renderTerrain(ctx, w, h);
    renderPowerups(ctx);
    renderEnemies(ctx);
    renderPlayer(ctx);
    renderPlayerBullets(ctx);
    renderEnemyBullets(ctx);
    renderExplosions(ctx);

    ctx.restore();

    drawExtraHUD(ctx, w, h);
    drawBombFlash(ctx, w, h);
    if (crtOn) drawCRT(ctx, w, h);
}

// =====================================================================
// PLAYER
// =====================================================================

function makePlayer() {
    return {
        x: GAME.width * RESPAWN_X_FRAC,
        y: RESPAWN_Y,
        hitboxX: GAME.width * RESPAWN_X_FRAC,
        hitboxY: RESPAWN_Y + PLAYER_HITBOX_OFFSET,
        weapon: 'vulcan',
        power: STARTING_POWER,
        invuln: 60,
        fireCooldown: 0,
        bombHeldLast: false,
        thrustPhase: 0
    };
}

function updatePlayer(dt) {
    if (!player) return;

    if (Engine.input.left)  player.x -= PLAYER_SPEED * dt;
    if (Engine.input.right) player.x += PLAYER_SPEED * dt;
    player.x = clamp(player.x, 10, GAME.width - 10);

    player.hitboxX = player.x;
    player.hitboxY = player.y + PLAYER_HITBOX_OFFSET;

    if (player.invuln > 0) player.invuln -= dt;
    if (player.fireCooldown > 0) player.fireCooldown -= dt;

    if (Engine.input.fire && player.fireCooldown <= 0) {
        firePlayerWeapon();
        player.fireCooldown = (player.weapon === 'laser')
            ? LASER_FIRE_COOLDOWN
            : PLAYER_FIRE_COOLDOWN;
    }

    // Bomb on rising edge of input only.
    const bombHeld = !!Engine.input.bomb;
    if (bombHeld && !player.bombHeldLast && bombCount > 0 && bombFlash <= 0) {
        triggerBomb();
    }
    player.bombHeldLast = bombHeld;

    player.thrustPhase += dt;
}

function firePlayerWeapon() {
    const px = player.x;
    const py = player.y - 10;

    if (player.weapon === 'vulcan') {
        const power = player.power;
        // Pattern: 1, 2, 3, 5, 5+angled
        if (power === 1) {
            spawnVulcan(px, py, 0, -VULCAN_BULLET_SPEED);
        } else if (power === 2) {
            spawnVulcan(px - 3, py, 0, -VULCAN_BULLET_SPEED);
            spawnVulcan(px + 3, py, 0, -VULCAN_BULLET_SPEED);
        } else if (power === 3) {
            spawnVulcan(px, py, 0, -VULCAN_BULLET_SPEED);
            spawnVulcan(px - 4, py + 2, -0.4, -VULCAN_BULLET_SPEED);
            spawnVulcan(px + 4, py + 2,  0.4, -VULCAN_BULLET_SPEED);
        } else if (power === 4) {
            spawnVulcan(px - 2, py, 0, -VULCAN_BULLET_SPEED);
            spawnVulcan(px + 2, py, 0, -VULCAN_BULLET_SPEED);
            spawnVulcan(px - 6, py + 2, -0.6, -VULCAN_BULLET_SPEED);
            spawnVulcan(px + 6, py + 2,  0.6, -VULCAN_BULLET_SPEED);
            spawnVulcan(px,     py - 1, 0,    -VULCAN_BULLET_SPEED);
        } else {
            spawnVulcan(px - 2, py, 0, -VULCAN_BULLET_SPEED);
            spawnVulcan(px + 2, py, 0, -VULCAN_BULLET_SPEED);
            spawnVulcan(px - 6, py + 2, -0.8, -VULCAN_BULLET_SPEED);
            spawnVulcan(px + 6, py + 2,  0.8, -VULCAN_BULLET_SPEED);
            spawnVulcan(px - 9, py + 4, -1.4, -VULCAN_BULLET_SPEED * 0.95);
            spawnVulcan(px + 9, py + 4,  1.4, -VULCAN_BULLET_SPEED * 0.95);
            spawnVulcan(px,     py - 2, 0,    -VULCAN_BULLET_SPEED * 1.1);
        }
        Engine.Sound.play('shoot');
    } else {
        // Laser: parallel thin beams scaling with power.
        const beamCount = Math.min(player.power, MAX_POWER);
        for (let i = 0; i < beamCount; i++) {
            const offset = (i - (beamCount - 1) / 2) * 5;
            spawnLaser(px + offset, py, 0, -LASER_BULLET_SPEED);
        }
        Engine.Sound.play('laser');
    }

    // Muzzle flash sparks.
    Engine.spawnParticle(px,     py - 2, 0, -2, 2, COLOR.MUZZLE, 6);
    Engine.spawnParticle(px - 2, py,    -1, -1.5, 1, COLOR.MUZZLE, 5);
    Engine.spawnParticle(px + 2, py,     1, -1.5, 1, COLOR.MUZZLE, 5);
}

function spawnVulcan(x, y, vx, vy) {
    playerBullets.push({
        kind: 'vulcan',
        x, y, vx, vy,
        w: 4, h: 6,
        damage: 1 + Math.floor((player.power - 1) / 2) * 0.5
    });
}

function spawnLaser(x, y, vx, vy) {
    playerBullets.push({
        kind: 'laser',
        x, y, vx, vy,
        w: 2, h: 14,
        damage: 1.5 + Math.floor((player.power - 1) / 2)
    });
}

function renderPlayer(ctx) {
    if (!player) return;
    if (player.invuln > 0 && Math.floor(player.invuln / 4) % 2 === 0) return;
    drawPlayerSprite(ctx, player.x, player.y, player.thrustPhase);
}

function drawPlayerSprite(ctx, x, y, thrustPhase) {
    // Jet exhaust (animated).
    const flick = Math.floor(thrustPhase * 0.6) % 2 === 0 ? 0 : 1;
    ctx.fillStyle = COLOR.JET_OUTER;
    ctx.fillRect(x - 4, y + 8, 2, 4 + flick);
    ctx.fillRect(x + 2, y + 8, 2, 4 + flick);
    ctx.fillStyle = COLOR.JET_CORE;
    ctx.fillRect(x - 4, y + 8, 2, 2);
    ctx.fillRect(x + 2, y + 8, 2, 2);

    // Wings (outer).
    ctx.fillStyle = COLOR.PLAYER_WING;
    ctx.fillRect(x - 11, y - 1, 5, 6);
    ctx.fillRect(x + 6,  y - 1, 5, 6);
    ctx.fillStyle = COLOR.PLAYER_WING_HI;
    ctx.fillRect(x - 11, y - 1, 5, 1);
    ctx.fillRect(x + 6,  y - 1, 5, 1);

    // Inner wing root.
    ctx.fillStyle = COLOR.PLAYER_BODY;
    ctx.fillRect(x - 6, y - 2, 12, 8);

    // Body.
    ctx.fillStyle = COLOR.PLAYER_BODY;
    ctx.fillRect(x - 4, y - 9, 8, 16);
    ctx.fillStyle = COLOR.PLAYER_LIGHT;
    ctx.fillRect(x - 3, y - 9, 6, 14);

    // Nose.
    ctx.fillStyle = COLOR.PLAYER_NOSE;
    ctx.fillRect(x - 1, y - 11, 2, 3);

    // Cockpit.
    ctx.fillStyle = COLOR.PLAYER_COCKPIT;
    ctx.fillRect(x - 1, y - 4, 2, 3);
    ctx.fillStyle = COLOR.PLAYER_COCKPIT_HI;
    ctx.fillRect(x - 1, y - 4, 2, 1);

    // Wingtip lights.
    ctx.fillStyle = COLOR.PLAYER_COCKPIT;
    ctx.fillRect(x - 11, y + 4, 2, 1);
    ctx.fillStyle = COLOR.JET_OUTER;
    ctx.fillRect(x + 9,  y + 4, 2, 1);
}

// =====================================================================
// PLAYER BULLETS
// =====================================================================

function updatePlayerBullets(dt) {
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const b = playerBullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.y < -20 || b.x < -20 || b.x > GAME.width + 20) {
            playerBullets.splice(i, 1);
        }
    }
}

function renderPlayerBullets(ctx) {
    for (const b of playerBullets) {
        if (b.kind === 'vulcan') {
            ctx.fillStyle = COLOR.BULLET_VULCAN;
            ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
            ctx.fillStyle = COLOR.BULLET_VULCAN_HI;
            ctx.fillRect(b.x - 1, b.y - b.h / 2, 2, 2);
        } else {
            ctx.fillStyle = COLOR.BULLET_LASER;
            ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
            ctx.fillStyle = COLOR.BULLET_LASER_HI;
            ctx.fillRect(b.x - 0.5, b.y - b.h / 2, 1, b.h);
        }
    }
}

// =====================================================================
// ENEMIES
// =====================================================================

function makeEnemy(type, x, y) {
    const stats = ENEMY_STATS[type];
    const cd = stats.fireCdMin + Math.random() * (stats.fireCdMax - stats.fireCdMin);
    const hpScale = 1 + difficultyLoop * 0.12;
    return {
        type,
        x, y,
        w: stats.w, h: stats.h,
        hp: Math.ceil(stats.hp * hpScale),
        score: stats.score,
        fireCooldown: cd + 30,
        age: 0,
        pattern: 'down',
        vx: 0, vy: 1,
        anchorX: x,
        amp: 0,
        phase: 0
    };
}

function updateEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.age += dt;

        if (e.pattern === 'sine') {
            e.x = e.anchorX + Math.sin(e.age * 0.06 + e.phase) * e.amp;
            e.y += e.vy * dt;
        } else if (e.pattern === 'terrain') {
            // Bolted to scrolling deck.
            e.y += SCROLL_SPEED * dt;
        } else {
            e.x += e.vx * dt;
            e.y += e.vy * dt;
        }

        if (e.fireCooldown > 0) e.fireCooldown -= dt;
        const onScreen = e.y > 4 && e.y < GAME.height - 30;
        if (e.fireCooldown <= 0 && onScreen) {
            enemyFire(e);
            const stats = ENEMY_STATS[e.type];
            const baseCd = stats.fireCdMin + Math.random() * (stats.fireCdMax - stats.fireCdMin);
            e.fireCooldown = baseCd / (1 + difficultyLoop * 0.1);
        }

        if (e.y > GAME.height + 50 || e.x < -60 || e.x > GAME.width + 60) {
            enemies.splice(i, 1);
        }
    }
}

function enemyFire(e) {
    if (!player) return;
    const speed = ENEMY_BULLET_BASE_SPEED * (1 + difficultyLoop * 0.06) * warmupFactor();

    if (e.type === 'popcorn') {
        spawnAimedShot(e.x, e.y + 4, COLOR.EBULLET_PINK, COLOR.EBULLET_PINK_GLOW, speed * 1.05, 2.5);
    } else if (e.type === 'turret') {
        spawnAimedShot(e.x, e.y, COLOR.EBULLET_PINK, COLOR.EBULLET_PINK_GLOW, speed * 1.2, 3);
        if (difficultyLoop >= 1) {
            spawnAimedShot(e.x - 4, e.y, COLOR.EBULLET_PINK, COLOR.EBULLET_PINK_GLOW, speed * 1.0, 2.5);
            spawnAimedShot(e.x + 4, e.y, COLOR.EBULLET_PINK, COLOR.EBULLET_PINK_GLOW, speed * 1.0, 2.5);
        }
    } else if (e.type === 'bomber') {
        spawnSpread(e.x, e.y + 6, 5, speed * 1.0, 0.55,
            COLOR.EBULLET_BLUE, COLOR.EBULLET_BLUE_GLOW, 3.5);
        Engine.Sound.play('enemyShoot');
    }
}

function renderEnemies(ctx) {
    for (const e of enemies) {
        if (e.type === 'popcorn') drawPopcorn(ctx, e);
        else if (e.type === 'turret') drawTurret(ctx, e);
        else if (e.type === 'bomber') drawBomber(ctx, e);
    }
}

function drawPopcorn(ctx, e) {
    const x = e.x, y = e.y;
    // Bright halo / outline silhouette so the ship reads against any biome.
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = COLOR.POPCORN_HALO;
    ctx.fillRect(x - 9, y - 8, 18, 17);
    ctx.globalAlpha = 1;
    // Crisp 1px outline immediately around the silhouette.
    ctx.fillStyle = COLOR.STAR_HI;
    ctx.fillRect(x - 8, y - 7, 16, 15);
    // Wings
    ctx.fillStyle = COLOR.POPCORN_DARK;
    ctx.fillRect(x - 7, y - 1, 4, 5);
    ctx.fillRect(x + 3, y - 1, 4, 5);
    // Body
    ctx.fillStyle = COLOR.POPCORN_BODY;
    ctx.fillRect(x - 4, y - 6, 8, 11);
    ctx.fillStyle = COLOR.POPCORN_HI;
    ctx.fillRect(x - 3, y - 6, 6, 2);
    // Nose-down (pointing at player)
    ctx.fillStyle = COLOR.POPCORN_DARK;
    ctx.fillRect(x - 2, y + 5, 4, 2);
    // Cockpit
    ctx.fillStyle = COLOR.HUD_HI;
    ctx.fillRect(x - 1, y - 2, 2, 2);
}

function drawTurret(ctx, e) {
    const x = e.x, y = e.y;
    // Cyan halo
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = COLOR.TURRET_HALO;
    ctx.fillRect(x - 13, y - 10, 26, 22);
    ctx.globalAlpha = 1;
    // Crisp outline
    ctx.fillStyle = COLOR.STAR_HI;
    ctx.fillRect(x - 12, y - 9, 24, 18);
    // Base ring
    ctx.fillStyle = COLOR.TURRET_DARK;
    ctx.fillRect(x - 11, y - 8, 22, 16);
    ctx.fillStyle = COLOR.TURRET_BASE;
    ctx.fillRect(x - 10, y - 7, 20, 14);
    // Inner dome
    ctx.fillStyle = COLOR.TURRET_DARK;
    ctx.fillRect(x - 6, y - 5, 12, 10);
    ctx.fillStyle = COLOR.TURRET_BASE;
    ctx.fillRect(x - 5, y - 5, 10, 9);
    ctx.fillStyle = COLOR.TURRET_GUN;
    ctx.fillRect(x - 5, y - 5, 10, 1);
    // Twin barrels (point down toward bottom of screen)
    ctx.fillStyle = COLOR.TURRET_GUN;
    ctx.fillRect(x - 3, y + 3, 2, 6);
    ctx.fillRect(x + 1, y + 3, 2, 6);
    // Warning light
    ctx.fillStyle = COLOR.TURRET_LIGHT;
    ctx.fillRect(x - 1, y - 2, 2, 2);
}

function drawBomber(ctx, e) {
    const x = e.x, y = e.y;
    // Magenta halo
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = COLOR.BOMBER_HALO;
    ctx.fillRect(x - 17, y - 14, 34, 28);
    ctx.globalAlpha = 1;
    // Crisp outline
    ctx.fillStyle = COLOR.STAR_HI;
    ctx.fillRect(x - 16, y - 13, 32, 26);
    // Wings
    ctx.fillStyle = COLOR.BOMBER_DARK;
    ctx.fillRect(x - 15, y - 4, 7, 9);
    ctx.fillRect(x + 8,  y - 4, 7, 9);
    ctx.fillStyle = COLOR.BOMBER_BODY;
    ctx.fillRect(x - 14, y - 4, 6, 6);
    ctx.fillRect(x + 8,  y - 4, 6, 6);
    // Wing engines
    ctx.fillStyle = COLOR.BOMBER_HI;
    ctx.fillRect(x - 13, y, 4, 2);
    ctx.fillRect(x + 9,  y, 4, 2);
    // Body
    ctx.fillStyle = COLOR.BOMBER_DARK;
    ctx.fillRect(x - 8, y - 12, 16, 22);
    ctx.fillStyle = COLOR.BOMBER_BODY;
    ctx.fillRect(x - 7, y - 12, 14, 20);
    ctx.fillStyle = COLOR.BOMBER_HI;
    ctx.fillRect(x - 6, y - 12, 12, 3);
    // Cockpit
    ctx.fillStyle = COLOR.BOMBER_COCK;
    ctx.fillRect(x - 2, y - 8, 4, 3);
    // Bomb bay
    ctx.fillStyle = COLOR.BOMBER_DARK;
    ctx.fillRect(x - 4, y + 4, 8, 4);
    ctx.fillStyle = COLOR.EBULLET_BLUE;
    ctx.fillRect(x - 3, y + 5, 6, 2);
}

// =====================================================================
// WAVE SPAWNING
// =====================================================================

function warmupFactor() {
    const t = Math.min(1, scrollY / WARMUP_DISTANCE);
    return WARMUP_START + (1 - WARMUP_START) * t;
}

function updateWaves(dt) {
    while (nextWaveIndex < WAVE_SCHEDULE.length &&
           (scrollY - waveBaseY) >= WAVE_SCHEDULE[nextWaveIndex].at) {
        spawnWave(WAVE_SCHEDULE[nextWaveIndex]);
        nextWaveIndex++;
    }
    if (nextWaveIndex >= WAVE_SCHEDULE.length) {
        nextWaveIndex = 0;
        waveBaseY = scrollY;
        difficultyLoop++;
    }
}

function spawnWave(wave) {
    const speedMul = (1 + difficultyLoop * 0.07) * warmupFactor();
    switch (wave.kind) {
        case 'vFormation': {
            const count = wave.count;
            const cx = GAME.width / 2;
            const half = (count - 1) / 2;
            for (let i = 0; i < count; i++) {
                const offset = i - half;
                const e = makeEnemy(
                    'popcorn',
                    cx + offset * 22,
                    -10 - Math.abs(offset) * 18
                );
                e.pattern = 'down';
                e.vx = 0;
                e.vy = (1.0 + Math.random() * 0.2) * speedMul;
                enemies.push(e);
            }
            break;
        }
        case 'sineSweep': {
            const count = wave.count;
            const amp = wave.amp || 60;
            for (let i = 0; i < count; i++) {
                const e = makeEnemy('popcorn', GAME.width / 2, -10 - i * 24);
                e.pattern = 'sine';
                e.amp = amp;
                e.phase = i * 0.7;
                e.anchorX = GAME.width / 2;
                e.vy = (0.9 + Math.random() * 0.2) * speedMul;
                enemies.push(e);
            }
            break;
        }
        case 'turretOnTerrain': {
            const offsets = wave.offsets || [GAME.width / 2];
            for (const ox of offsets) {
                const e = makeEnemy('turret', ox, -16);
                e.pattern = 'terrain';
                enemies.push(e);
            }
            break;
        }
        case 'bomber': {
            const e = makeEnemy('bomber', GAME.width / 2, -36);
            e.pattern = 'down';
            e.vx = 0;
            e.vy = 0.4 * speedMul;
            enemies.push(e);
            break;
        }
    }
}

// =====================================================================
// ENEMY BULLETS
// =====================================================================

function spawnAimedShot(x, y, color, glow, speed, radius) {
    if (!player) return;
    const dx = player.hitboxX - x;
    const dy = player.hitboxY - y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    enemyBullets.push({
        x, y,
        vx: (dx / len) * speed,
        vy: (dy / len) * speed,
        r: radius,
        color, glowColor: glow
    });
}

function spawnSpread(x, y, count, speed, spread, color, glow, radius) {
    if (!player) return;
    const dx = player.hitboxX - x;
    const dy = player.hitboxY - y;
    const baseAngle = Math.atan2(dy, dx);
    for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0 : (i / (count - 1)) - 0.5;
        const a = baseAngle + t * spread;
        enemyBullets.push({
            x, y,
            vx: Math.cos(a) * speed,
            vy: Math.sin(a) * speed,
            r: radius,
            color, glowColor: glow
        });
    }
}

function updateEnemyBullets(dt) {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.y > GAME.height + 20 || b.y < -20 ||
            b.x > GAME.width + 20 || b.x < -20) {
            enemyBullets.splice(i, 1);
        }
    }
}

function renderEnemyBullets(ctx) {
    for (const b of enemyBullets) {
        // Outer glow
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = b.glowColor;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r + 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        // Core
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        // Highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(b.x - 0.5, b.y - 0.5, Math.max(0.8, b.r * 0.45), 0, Math.PI * 2);
        ctx.fill();
    }
}

// =====================================================================
// COLLISIONS
// =====================================================================

function collidePlayerBulletsVsEnemies() {
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const b = playerBullets[i];
        const bx = b.x - b.w / 2;
        const by = b.y - b.h / 2;
        let consumed = false;
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            const ex = e.x - e.w / 2;
            const ey = e.y - e.h / 2;
            if (rectOverlap(bx, by, b.w, b.h, ex, ey, e.w, e.h)) {
                e.hp -= b.damage;
                Engine.spawnParticle(b.x, b.y, (Math.random() - 0.5) * 2, -1, 1, COLOR.MUZZLE, 6);
                if (b.kind === 'vulcan') {
                    consumed = true;
                }
                if (e.hp <= 0) {
                    killEnemy(j);
                }
                if (consumed) break;
            }
        }
        if (consumed) {
            playerBullets.splice(i, 1);
        }
    }
}

function collideEnemyBulletsVsPlayer() {
    if (!player || player.invuln > 0 || bombFlash > 0) return;
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        if (pointInCircle(player.hitboxX, player.hitboxY, b.x, b.y, b.r + 1)) {
            enemyBullets.splice(i, 1);
            killPlayer();
            return;
        }
    }
}

function collidePlayerVsEnemyBodies() {
    if (!player || player.invuln > 0) return;
    for (const e of enemies) {
        const ex = e.x - e.w / 2;
        const ey = e.y - e.h / 2;
        if (pointInRect(player.hitboxX, player.hitboxY, ex, ey, e.w, e.h)) {
            // Body collision: player dies, enemy takes a chunk too.
            e.hp -= 2;
            killPlayer();
            return;
        }
    }
}

function collidePlayerVsPowerups() {
    if (!player) return;
    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        const dx = player.x - p.x;
        const dy = player.y - p.y;
        if (dx * dx + dy * dy < 14 * 14) {
            applyPowerup(p);
            powerups.splice(i, 1);
        }
    }
}

// =====================================================================
// SCORING / KILLS
// =====================================================================

function killEnemy(index) {
    const e = enemies[index];
    enemies.splice(index, 1);

    // Score with difficulty multiplier.
    const value = Math.round(e.score * (1 + difficultyLoop * 0.25));
    Engine.state.score += value;
    Engine.showScorePopup(e.x, e.y, '+' + value, COLOR.HUD_HI);

    // Explosion + sound.
    if (e.type === 'bomber') {
        spawnExplosion(e.x, e.y, true);
        Engine.Sound.play('bigExplode');
        // Death spread for the bomber — bullets in a flower pattern.
        const speed = ENEMY_BULLET_BASE_SPEED * 1.1 * (1 + difficultyLoop * 0.06);
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            enemyBullets.push({
                x: e.x, y: e.y,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                r: 3,
                color: COLOR.EBULLET_BLUE,
                glowColor: COLOR.EBULLET_BLUE_GLOW
            });
        }
    } else if (e.type === 'turret') {
        spawnExplosion(e.x, e.y, true);
        Engine.Sound.play('explode');
    } else {
        spawnExplosion(e.x, e.y, false);
        Engine.Sound.play('explode');
    }

    // Drop powerup?
    const stats = ENEMY_STATS[e.type];
    if (Math.random() < stats.dropChance) {
        spawnPowerup(e.x, e.y);
    }
}

function checkExtendLife() {
    if (Engine.state.score >= nextExtendScore) {
        if (Engine.state.health < MAX_LIVES) {
            Engine.state.health++;
        } else {
            bombCount = Math.min(bombCount + 1, MAX_BOMBS);
        }
        Engine.Sound.play('extend');
        Engine.showScorePopup(GAME.width / 2, GAME.height / 2 - 16, 'EXTEND!', COLOR.HUD_HI);
        nextExtendScore += EXTEND_INTERVAL;
    }
}

// =====================================================================
// EXPLOSIONS
// =====================================================================

function spawnExplosion(x, y, big) {
    explosions.push({
        x, y,
        age: 0,
        maxAge: big ? 28 : 18,
        radius: big ? 18 : 10,
        big
    });
    const debrisCount = big ? 16 : 8;
    for (let i = 0; i < debrisCount; i++) {
        const a = Math.random() * Math.PI * 2;
        const speed = (big ? 2 : 1.4) * (0.5 + Math.random() * 0.8);
        const colors = [COLOR.EXPLODE_GREEN, COLOR.EXPLODE_YELLOW, COLOR.EXPLODE_RED, COLOR.EXPLODE_WHITE];
        Engine.spawnParticle(
            x, y,
            Math.cos(a) * speed,
            Math.sin(a) * speed,
            1 + Math.random() * 2,
            colors[Math.floor(Math.random() * colors.length)],
            16 + Math.random() * 14
        );
    }
}

function updateExplosions(dt) {
    for (let i = explosions.length - 1; i >= 0; i--) {
        const ex = explosions[i];
        ex.age += dt;
        if (ex.age >= ex.maxAge) explosions.splice(i, 1);
    }
}

function renderExplosions(ctx) {
    for (const ex of explosions) {
        const t = ex.age / ex.maxAge;
        const r = ex.radius * (0.4 + t * 1.0);
        const alpha = 1 - t;
        // Outer ring
        ctx.globalAlpha = alpha * 0.6;
        ctx.fillStyle = COLOR.EXPLODE_GREEN;
        ctx.beginPath();
        ctx.arc(ex.x, ex.y, r, 0, Math.PI * 2);
        ctx.fill();
        // Inner core
        ctx.globalAlpha = alpha;
        ctx.fillStyle = COLOR.EXPLODE_WHITE;
        ctx.beginPath();
        ctx.arc(ex.x, ex.y, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// =====================================================================
// POWER-UPS
// =====================================================================

function spawnPowerup(x, y) {
    const kind = POWERUP_KINDS[Math.floor(Math.random() * POWERUP_KINDS.length)];
    powerups.push({ x, y, kind, age: 0 });
}

function updatePowerups(dt) {
    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        p.age += dt;
        p.y += POWERUP_SPEED * dt;
        if (p.y > GAME.height + 20) powerups.splice(i, 1);
    }
}

function renderPowerups(ctx) {
    for (const p of powerups) {
        const bob = Math.sin(p.age * 0.12) * 1.5;
        const x = p.x;
        const y = p.y + bob;
        const color = powerupColor(p.kind);
        // Glow
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = color;
        ctx.fillRect(x - 9, y - 9, 18, 18);
        ctx.globalAlpha = 1;
        // Capsule
        ctx.fillStyle = '#000';
        ctx.fillRect(x - 7, y - 7, 14, 14);
        ctx.fillStyle = color;
        ctx.fillRect(x - 6, y - 6, 12, 12);
        ctx.fillStyle = '#fff';
        ctx.fillRect(x - 6, y - 6, 12, 2);
        // Letter
        ctx.fillStyle = '#000';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(powerupLabel(p.kind), x, y + 3);
        ctx.textAlign = 'left';
    }
}

function powerupColor(kind) {
    if (kind === 'red')  return COLOR.POWER_RED;
    if (kind === 'blue') return COLOR.POWER_BLUE;
    if (kind === 'gold') return COLOR.POWER_GOLD;
    if (kind === 'P')    return COLOR.POWER_GREEN;
    if (kind === 'B')    return COLOR.POWER_BOMB;
    return '#ffffff';
}

function powerupLabel(kind) {
    if (kind === 'red')  return 'V';
    if (kind === 'blue') return 'L';
    if (kind === 'gold') return 'G';
    if (kind === 'P')    return 'P';
    if (kind === 'B')    return 'B';
    return '?';
}

function applyPowerup(p) {
    Engine.Sound.play('powerup');
    if (p.kind === 'red') {
        if (player.weapon === 'vulcan') {
            player.power = Math.min(player.power + 1, MAX_POWER);
        } else {
            player.weapon = 'vulcan';
            player.power = Math.max(1, player.power);
        }
    } else if (p.kind === 'blue') {
        if (player.weapon === 'laser') {
            player.power = Math.min(player.power + 1, MAX_POWER);
        } else {
            player.weapon = 'laser';
            player.power = Math.max(1, player.power);
        }
    } else if (p.kind === 'gold') {
        Engine.state.score += 5000;
        Engine.showScorePopup(p.x, p.y, '+5000', COLOR.HUD_HI);
    } else if (p.kind === 'P') {
        player.power = Math.min(player.power + 1, MAX_POWER);
    } else if (p.kind === 'B') {
        bombCount = Math.min(bombCount + 1, MAX_BOMBS);
    }

    // Pickup sparkle
    for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2;
        Engine.spawnParticle(
            p.x, p.y,
            Math.cos(a) * 1.5, Math.sin(a) * 1.5,
            1, powerupColor(p.kind), 12
        );
    }
}

// =====================================================================
// BOMB
// =====================================================================

function triggerBomb() {
    bombCount--;
    bombFlash = BOMB_FRAMES;
    Engine.Sound.play('bomb');
    // Brief invuln during the bomb so it cannot kill the player to overlap.
    if (player.invuln < BOMB_FRAMES + 10) {
        player.invuln = BOMB_FRAMES + 10;
    }
}

function updateBombFlash(dt) {
    if (bombFlash > 0) {
        // Wipe enemy bullets and chunk damage every frame.
        enemyBullets.length = 0;
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            // Only damage on-screen targets.
            if (e.y > -20 && e.y < GAME.height + 20) {
                e.hp -= 0.4 * dt;
                if (e.hp <= 0) killEnemy(i);
            }
        }
        bombFlash -= dt;
        if (bombFlash < 0) bombFlash = 0;
    }
}

function drawBombFlash(ctx, w, h) {
    if (bombFlash <= 0) return;
    let alpha;
    if (bombFlash > BOMB_FLASH_CUTOFF) {
        alpha = (bombFlash - BOMB_FLASH_CUTOFF) / (BOMB_FRAMES - BOMB_FLASH_CUTOFF);
        alpha = Math.min(0.9, alpha);
    } else {
        alpha = (bombFlash / BOMB_FLASH_CUTOFF) * 0.3;
    }
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(0, 0, w, h);
}

// =====================================================================
// DEATH / SHAKE
// =====================================================================

function killPlayer() {
    if (!player) return;
    spawnExplosion(player.x, player.y, true);
    Engine.Sound.play('bigExplode');
    shakeFrames = SHAKE_FRAMES;

    Engine.state.health--;
    bombFlash = 0;

    if (Engine.state.health <= 0) {
        // Engine handles the rest from health === 0 next frame.
        Engine.state.health = 0;
        return;
    }

    // Respawn.
    player.x = GAME.width * RESPAWN_X_FRAC;
    player.y = RESPAWN_Y;
    player.hitboxX = player.x;
    player.hitboxY = player.y + PLAYER_HITBOX_OFFSET;
    player.invuln = RESPAWN_INVULN;
    player.power = Math.max(1, player.power - 1);
    player.fireCooldown = 12;

    // Wipe in-flight player bullets so the next life starts fresh.
    playerBullets = [];
}

function updateShake(dt) {
    if (shakeFrames > 0) {
        shakeFrames -= dt;
        if (shakeFrames < 0) shakeFrames = 0;
        const mag = (shakeFrames / SHAKE_FRAMES) * SHAKE_MAGNITUDE;
        shakeOffsetX = (Math.random() - 0.5) * 2 * mag;
        shakeOffsetY = (Math.random() - 0.5) * 2 * mag;
    } else {
        shakeOffsetX = 0;
        shakeOffsetY = 0;
    }
}

// =====================================================================
// TERRAIN
// =====================================================================

function biomeAt(worldY) {
    const period = 1800;
    let phase = worldY % period;
    if (phase < 0) phase += period;
    if (phase < 720)  return 'space';
    if (phase < 1000) return 'nebula';
    if (phase < 1200) return 'asteroids';
    if (phase < 1380) return 'station';
    if (phase < 1560) return 'asteroids';
    return 'nebula';
}

function renderTerrain(ctx, w, h) {
    // Layer 1: solid space-black ground.
    ctx.fillStyle = COLOR.SPACE_BG;
    ctx.fillRect(0, 0, w, h);

    // Layer 2: distant parallax stars (slow scroll, never tiled).
    renderFarStars(ctx, w, h);

    // Layer 3: per-tile biome render at normal scroll speed.
    //
    // Vertical-shmup convention: the player flies "forward" (north in world
    // space) and the world scrolls DOWN past them. So a fixed worldY tile
    // must move DOWN the screen as scrollY grows. Mapping:
    //   screenY = h + scrollY - worldY
    //   worldY  = h + scrollY - screenY
    //
    // Top of screen (screenY=0) shows the largest visible worldY (the
    // newest content the player is approaching); bottom (screenY=h) shows
    // the world directly under the player.
    const cols = Math.ceil(w / TILE) + 1;
    const numTiles = Math.ceil(h / TILE) + 2;
    const topWorldY = h + scrollY + TILE;
    const topTileY = Math.floor(topWorldY / TILE);
    for (let i = 0; i < numTiles; i++) {
        const tileY = topTileY - i;
        const worldY = tileY * TILE;
        const screenY = h + scrollY - worldY;
        const biome = biomeAt(worldY);
        for (let col = 0; col < cols; col++) {
            drawTerrainTile(ctx, col * TILE, screenY, col, tileY, biome);
        }
    }
}

function renderFarStars(ctx, w, h) {
    // Stable far-parallax field — slower scroll than tiles, lags behind to
    // create depth. Stars also move DOWN as scrollY grows.
    const FAR_SCROLL = scrollY * 0.25;
    const STAR_PERIOD = 480;
    const offset = ((FAR_SCROLL % STAR_PERIOD) + STAR_PERIOD) % STAR_PERIOD;
    // ~36 stars repeating; positions stable in world space.
    const starsA = [
        [12, 18], [42, 60], [78, 5], [110, 90], [150, 30], [188, 110],
        [220, 8], [256, 70], [292, 140], [322, 22], [356, 95], [38, 200],
        [70, 250], [120, 180], [165, 320], [205, 230], [248, 290], [284, 200],
        [320, 360], [350, 260], [16, 410], [54, 330], [98, 460], [140, 380],
        [180, 440], [225, 410], [262, 470], [300, 420], [336, 460], [10, 110],
        [62, 150], [200, 60], [310, 50], [25, 380], [365, 320], [180, 200]
    ];
    for (let i = 0; i < starsA.length; i++) {
        const sx = starsA[i][0];
        const baseY = starsA[i][1];
        let y = (baseY + offset) % STAR_PERIOD;
        if (y < 0) y += STAR_PERIOD;
        if (y > h + 2) continue;
        const bright = (i & 3) === 0;
        ctx.fillStyle = bright ? COLOR.STAR_MID : COLOR.STAR_DIM;
        ctx.fillRect(sx, y, 1, 1);
    }
}

function drawTerrainTile(ctx, sx, sy, col, tileY, biome) {
    const seed = ((col * 73856093) ^ (tileY * 19349663)) >>> 0;
    const r = seed & 0xff;
    const r2 = (seed >> 8) & 0xff;

    if (biome === 'space') {
        // Empty space — leave the SPACE_BG / parallax stars showing through,
        // and sprinkle a few mid-layer stars locked to the tile grid.
        if ((r & 31) === 0) {
            ctx.fillStyle = COLOR.STAR_HI;
            ctx.fillRect(sx + (r2 % TILE), sy + (r2 >> 4) % TILE, 1, 1);
        } else if ((r & 15) === 3) {
            ctx.fillStyle = COLOR.STAR_MID;
            ctx.fillRect(sx + (r2 % TILE), sy + (r % TILE), 1, 1);
        } else if ((r & 7) === 5) {
            ctx.fillStyle = COLOR.STAR_DIM;
            ctx.fillRect(sx + (r2 % TILE), sy + (r2 >> 3) % TILE, 1, 1);
        }
        return;
    }

    if (biome === 'nebula') {
        // Translucent purple wash — built from a few semi-transparent layers
        // so the underlying space + far stars still show through.
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = COLOR.NEBULA_DEEP;
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = (r & 1) ? COLOR.NEBULA_MID : COLOR.NEBULA_HI;
        ctx.fillRect(sx + 1, sy + (r & 7), TILE - 2, 4);
        if ((r & 7) === 0) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = COLOR.NEBULA_PINK;
            ctx.fillRect(sx + 2, sy + 4, TILE - 4, 6);
        } else if ((r & 7) === 3) {
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = COLOR.NEBULA_CYAN;
            ctx.fillRect(sx + 1, sy + 8, TILE - 2, 5);
        }
        ctx.globalAlpha = 1;
        // Brighter foreground stars in the nebula.
        if ((r & 7) === 1) {
            ctx.fillStyle = COLOR.STAR_HI;
            ctx.fillRect(sx + (r2 & 15), sy + ((r2 >> 4) & 15), 1, 1);
        }
        return;
    }

    if (biome === 'asteroids') {
        // Asteroid belt: dark void with chunks of rock at semi-random spots.
        // Leave gaps so stars peek through between rocks.
        if ((r & 1) === 0) {
            // Big rock
            const rx = sx + (r2 & 7);
            const ry = sy + ((r2 >> 3) & 7);
            const rw = 6 + (r & 4);
            const rh = 5 + (r2 & 3);
            ctx.fillStyle = COLOR.ASTEROID_DEEP;
            ctx.fillRect(rx - 1, ry - 1, rw + 2, rh + 2);
            ctx.fillStyle = COLOR.ASTEROID_DARK;
            ctx.fillRect(rx, ry, rw, rh);
            ctx.fillStyle = COLOR.ASTEROID_MID;
            ctx.fillRect(rx, ry, rw - 1, rh - 1);
            ctx.fillStyle = COLOR.ASTEROID_HI;
            ctx.fillRect(rx + 1, ry + 1, rw - 3, 1);
            ctx.fillStyle = COLOR.ASTEROID_LIT;
            ctx.fillRect(rx + 1, ry + 1, 1, 1);
        } else if ((r & 3) === 1) {
            // Pebble
            ctx.fillStyle = COLOR.ASTEROID_MID;
            ctx.fillRect(sx + (r2 & 7) + 4, sy + ((r2 >> 3) & 7) + 4, 3, 2);
            ctx.fillStyle = COLOR.ASTEROID_HI;
            ctx.fillRect(sx + (r2 & 7) + 4, sy + ((r2 >> 3) & 7) + 4, 1, 1);
        }
        // Stars between rocks
        if ((r & 15) === 7) {
            ctx.fillStyle = COLOR.STAR_DIM;
            ctx.fillRect(sx + ((r2 >> 1) & 15), sy + ((r2 >> 5) & 15), 1, 1);
        }
        return;
    }

    if (biome === 'station') {
        // Alien station hull: dark blue panels with neon stripes.
        ctx.fillStyle = COLOR.STATION_DARK;
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = COLOR.STATION_MID;
        ctx.fillRect(sx + 1, sy + 1, TILE - 2, TILE - 2);
        ctx.fillStyle = COLOR.STATION_HI;
        ctx.fillRect(sx + 1, sy + 1, TILE - 2, 1);
        // Panel seam
        ctx.fillStyle = COLOR.STATION_DARK;
        ctx.fillRect(sx, sy + 7, TILE, 1);
        // Rivets
        ctx.fillStyle = COLOR.STATION_HI;
        ctx.fillRect(sx + 3,  sy + 4,  1, 1);
        ctx.fillRect(sx + 12, sy + 4,  1, 1);
        ctx.fillRect(sx + 3,  sy + 11, 1, 1);
        ctx.fillRect(sx + 12, sy + 11, 1, 1);
        // Neon stripes down the center two columns of the canvas.
        const midCol = Math.floor(GAME.width / TILE / 2);
        if (col === midCol || col === midCol - 1) {
            const flick = ((tileY * 7 + col) & 3) !== 0;
            const neon = ((tileY + col) & 1) ? COLOR.STATION_NEON : COLOR.STATION_NEON2;
            if (flick) {
                ctx.fillStyle = neon;
                ctx.fillRect(sx + 5, sy + 2, TILE - 10, TILE - 4);
                ctx.fillStyle = COLOR.STAR_HI;
                ctx.fillRect(sx + 6, sy + 4, TILE - 12, 1);
            }
        }
        return;
    }
}

// =====================================================================
// HUD EXTRAS
// =====================================================================

function drawExtraHUD(ctx, w, h) {
    // High score (top center)
    const hi = (HighScores && HighScores.scores && HighScores.scores[0])
        ? HighScores.scores[0].score : 0;
    ctx.textAlign = 'center';
    ctx.fillStyle = COLOR.HUD_LABEL;
    ctx.font = 'bold 8px monospace';
    ctx.fillText('HI', w / 2, 12);
    ctx.fillStyle = COLOR.HUD_HI;
    ctx.font = 'bold 12px monospace';
    ctx.fillText(String(hi).padStart(6, '0'), w / 2, 24);

    // Power meter (bottom left)
    ctx.textAlign = 'left';
    ctx.fillStyle = COLOR.HUD_LABEL;
    ctx.font = 'bold 8px monospace';
    ctx.fillText('POWER', 8, h - 6);
    const meterX = 40;
    const meterY = h - 12;
    const barW = 6;
    const barH = 6;
    const barGap = 2;
    const barColor = player && player.weapon === 'laser' ? COLOR.BULLET_LASER : COLOR.BULLET_VULCAN;
    for (let i = 0; i < MAX_POWER; i++) {
        const x = meterX + i * (barW + barGap);
        ctx.fillStyle = COLOR.STATION_DARK;
        ctx.fillRect(x, meterY, barW, barH);
        if (player && i < player.power) {
            ctx.fillStyle = barColor;
            ctx.fillRect(x + 1, meterY + 1, barW - 2, barH - 2);
        }
    }

    // Bomb count (bottom right)
    ctx.textAlign = 'right';
    ctx.fillStyle = COLOR.POWER_BOMB;
    ctx.font = 'bold 10px monospace';
    ctx.fillText('BOMB x' + bombCount, w - 8, h - 6);

    ctx.textAlign = 'left';
}

// =====================================================================
// CRT OVERLAY
// =====================================================================

function drawCRT(ctx, w, h) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    for (let y = 0; y < h; y += 2) {
        ctx.fillRect(0, y, w, 1);
    }
    // Slight vignette in the corners.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, w, 2);
    ctx.fillRect(0, h - 2, w, 2);
}

// =====================================================================
// TITLE / ATTRACT MODE
// =====================================================================

function gameTitleRender(ctx, w, h, time) {
    // Drive a parallel demo world from real elapsed time.
    if (demoState === null) {
        resetDemo();
        demoLastTime = time;
    }
    let dt = (time - demoLastTime) * 60;
    demoLastTime = time;
    if (dt > 3) dt = 3;
    if (dt < 0) dt = 0;
    updateDemo(dt);

    // Background ocean scroll, reusing the terrain renderer via a fake scroll value.
    const savedScroll = scrollY;
    scrollY = demoState.scroll;
    renderTerrain(ctx, w, h);
    scrollY = savedScroll;

    renderDemo(ctx);

    // Title block — drawn behind the engine's title text so we leave room
    // for the engine title to remain visible up top.
    ctx.textAlign = 'center';

    // High score table
    ctx.fillStyle = COLOR.HUD_HI;
    ctx.font = 'bold 9px monospace';
    ctx.fillText('HIGH SCORES', w / 2, h / 2 + 26);

    const scores = (HighScores && HighScores.scores) ? HighScores.scores : [];
    ctx.font = 'bold 8px monospace';
    for (let i = 0; i < 5; i++) {
        const s = scores[i];
        const rank = String(i + 1).padStart(2, ' ');
        const name = s ? s.name : '---';
        const sc = s ? String(s.score).padStart(6, '0') : '------';
        ctx.fillStyle = i === 0 ? COLOR.HUD_HI : COLOR.HUD_TEXT;
        ctx.fillText(`${rank}.  ${name}   ${sc}`, w / 2, h / 2 + 40 + i * 10);
    }

    // PRESS START — flashing
    if ((Math.sin(time * 4) > -0.2)) {
        ctx.fillStyle = COLOR.PLAYER_NOSE;
        ctx.font = 'bold 14px monospace';
        ctx.fillText('PRESS START', w / 2, h - 14);
    }

    if (crtOn) drawCRT(ctx, w, h);
    ctx.textAlign = 'left';
}

function resetDemo() {
    demoState = {
        scroll: 0,
        timer: 0,
        player: { x: GAME.width / 2, y: 170, dir: 1 },
        enemies: [],
        playerBullets: [],
        enemyBullets: [],
        explosions: [],
        spawnTimer: 30
    };
}

function updateDemo(dt) {
    const ds = demoState;
    ds.scroll += SCROLL_SPEED * dt;
    ds.timer += dt;

    // Reset cycle every ~14 seconds (840 frames at 60fps).
    if (ds.timer > 840) {
        resetDemo();
        return;
    }

    // Demo player drifts back and forth.
    ds.player.x += ds.player.dir * 1.0 * dt;
    if (ds.player.x < 60) ds.player.dir = 1;
    if (ds.player.x > GAME.width - 60) ds.player.dir = -1;

    // Demo player auto-fires.
    if (Math.floor(ds.timer) % 6 === 0) {
        ds.playerBullets.push({ x: ds.player.x, y: ds.player.y - 12, vy: -6 });
    }

    // Spawn a slow popcorn V every so often.
    ds.spawnTimer -= dt;
    if (ds.spawnTimer <= 0) {
        ds.spawnTimer = 90;
        const cx = 60 + Math.random() * (GAME.width - 120);
        for (let i = 0; i < 5; i++) {
            const offset = i - 2;
            ds.enemies.push({
                type: 'popcorn',
                x: cx + offset * 22,
                y: -12 - Math.abs(offset) * 14,
                vy: 1.2,
                hp: 1,
                age: 0
            });
        }
    }

    // Update demo bullets.
    for (let i = ds.playerBullets.length - 1; i >= 0; i--) {
        const b = ds.playerBullets[i];
        b.y += b.vy * dt;
        if (b.y < -10) ds.playerBullets.splice(i, 1);
    }

    // Update demo enemies + collisions.
    for (let i = ds.enemies.length - 1; i >= 0; i--) {
        const e = ds.enemies[i];
        e.y += e.vy * dt;
        e.age += dt;
        let killed = false;
        for (let j = ds.playerBullets.length - 1; j >= 0; j--) {
            const b = ds.playerBullets[j];
            if (Math.abs(b.x - e.x) < 8 && Math.abs(b.y - e.y) < 8) {
                ds.playerBullets.splice(j, 1);
                ds.explosions.push({ x: e.x, y: e.y, age: 0, maxAge: 18, radius: 10 });
                killed = true;
                break;
            }
        }
        if (killed || e.y > GAME.height + 16) {
            ds.enemies.splice(i, 1);
        }
    }

    // Demo explosions.
    for (let i = ds.explosions.length - 1; i >= 0; i--) {
        ds.explosions[i].age += dt;
        if (ds.explosions[i].age >= ds.explosions[i].maxAge) ds.explosions.splice(i, 1);
    }
}

function renderDemo(ctx) {
    const ds = demoState;

    // Demo enemies.
    for (const e of ds.enemies) drawPopcorn(ctx, e);

    // Demo player.
    drawPlayerSprite(ctx, ds.player.x, ds.player.y, ds.timer);

    // Demo bullets — small pink rects.
    ctx.fillStyle = COLOR.BULLET_VULCAN;
    for (const b of ds.playerBullets) {
        ctx.fillRect(b.x - 2, b.y - 3, 4, 6);
    }

    // Demo explosions.
    for (const ex of ds.explosions) {
        const t = ex.age / ex.maxAge;
        const r = ex.radius * (0.4 + t * 1.0);
        ctx.globalAlpha = (1 - t) * 0.7;
        ctx.fillStyle = COLOR.EXPLODE_GREEN;
        ctx.beginPath();
        ctx.arc(ex.x, ex.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// =====================================================================
// GAME OVER ART (frozen world behind engine overlay)
// =====================================================================

function gameOverRender(ctx, w, h) {
    renderTerrain(ctx, w, h);
    renderPowerups(ctx);
    renderEnemies(ctx);
    // Skip the player — it just exploded.
    renderEnemyBullets(ctx);
    renderExplosions(ctx);
    if (crtOn) drawCRT(ctx, w, h);
}

// =====================================================================
// HELPERS
// =====================================================================

function clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
}

function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function pointInRect(px, py, x, y, w, h) {
    return px >= x && px < x + w && py >= y && py < y + h;
}

function pointInCircle(px, py, cx, cy, r) {
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy <= r * r;
}
