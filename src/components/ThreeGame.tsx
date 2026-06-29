/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { sound } from '../utils/sound';
import { KeyConfig } from '../types';
import { Play, RotateCcw, Trophy, Volume2, VolumeX, Shield, Swords, Sparkles, AlertCircle } from 'lucide-react';

interface ThreeGameProps {
  keyConfig: KeyConfig;
  onBack: () => void;
}

interface EnemyEntity {
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  texture: THREE.Texture;
  hp: number;
  maxHp: number;
  position: THREE.Vector3;
  state: 'idle' | 'walk' | 'hit' | 'dead';
  animTimer: number;
  currentFrame: number;
  facing: 'left' | 'right';
  flashTimer: number;
  flashType: 'red' | 'white' | 'none';
  attackCooldown: number;
  knockbackVel: THREE.Vector3;
  deadTimer: number;
  deadLaunchVel: THREE.Vector3;
}

interface PotionEntity {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  bobTimer: number;
}

interface BossEntity {
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  texture: THREE.Texture;
  hp: number;
  maxHp: number;
  position: THREE.Vector3;
  state: 'idle' | 'move' | 'prepare' | 'dead';
  stateTimer: number;
  animTimer: number;
  currentFrame: number;
  facing: 'left' | 'right';
  flashTimer: number;
  flashType: 'red' | 'white' | 'none';
  targetPosition: THREE.Vector3;
  attackTimer: number;
}

interface FireballEntity {
  mesh: THREE.Mesh;
  warningRing: THREE.Mesh;
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  currentPos: THREE.Vector3;
  elapsedTime: number;
  totalTime: number;
}

interface FloatText {
  id: string;
  text: string;
  x: number;
  y: number;
  life: number; // 0 to 100
  color: string;
}

const DIALOG_STEPS = [
  {
    speaker: 'npc' as const,
    name: 'อลิซ (NPC)',
    text: 'เหลือเชื่อจริงๆ! คุณปราบพญาปีศาจ Crimson Omega ลงได้แล้ว!',
  },
  {
    speaker: 'player' as const,
    name: 'ผู้พิทักษ์ (คุณ)',
    text: 'มันไม่ใช่เรื่องง่ายเลย พลังทำลายและการโจมตีด้วยลูกไฟของมันรุนแรงและคาดเดาได้ยากมาก...',
  },
  {
    speaker: 'npc' as const,
    name: 'อลิซ (NPC)',
    text: 'ความกล้าหาญและความแม่นยำในการหลบหลีกของคุณนั้นยอดเยี่ยมที่สุดในรุ่น!',
  },
  {
    speaker: 'player' as const,
    name: 'ผู้พิทักษ์ (คุณ)',
    text: 'ขอบคุณนะ ถ้าไม่ได้ยาฟื้นพลังงานที่ส่งลงมาช่วย ผมคงต้านทานมันไว้ไม่ไหวแน่ๆ',
  },
  {
    speaker: 'npc' as const,
    name: 'อลิซ (NPC)',
    text: 'นั่นคือเสบียงสนับสนุนกู้ชีพฉุกเฉินที่เราพยายามแฮกระบบส่งมาให้ทันเวลาล่ะ!',
  },
  {
    speaker: 'player' as const,
    name: 'ผู้พิทักษ์ (คุณ)',
    text: 'ตอนนี้พญาปีศาจก็ถูกกำจัดไปแล้ว ประตูมิติ Warp Gate ปลอดภัยแล้วใช่ไหม?',
  },
  {
    speaker: 'npc' as const,
    name: 'อลิซ (NPC)',
    text: 'แน่นอน! สัญญาณมิติเสถียร 100% แล้ว เรากลับสู่ฐานทัพหลักอย่างผู้ชนะกันเถอะ!',
  },
  {
    speaker: 'player' as const,
    name: 'ผู้พิทักษ์ (คุณ)',
    text: 'รับทราบ! เริ่มต้นกระบวนการเคลื่อนย้ายมิติและตั้งพิกัดกลับบ้านได้เลย!',
  },
];

const getSpriteStyle = (imgUrl: string, frame: number, row: number = 0) => {
  return {
    backgroundImage: `url(${imgUrl})`,
    backgroundSize: '400% 200%',
    backgroundPosition: `${(frame * 100) / 3}% ${row * 100}%`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated' as const,
  };
};

export default function ThreeGame({ keyConfig, onBack }: ThreeGameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game state
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [playerHp, setPlayerHp] = useState<number>(5);
  const [maxPlayerHp] = useState<number>(5);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isGameWon, setIsGameWon] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatText[]>([]);
  const [specialCooldown, setSpecialCooldown] = useState<number>(100);
  const [defeatedCount, setDefeatedCount] = useState<number>(0);
  const [bossHp, setBossHp] = useState<number | null>(null);
  const [maxBossHp] = useState<number>(12);
  const [warpGateActive, setWarpGateActive] = useState<boolean>(false);

  // RPG Ending Dialogue states
  const [dialogIndex, setDialogIndex] = useState<number>(0);
  const [isDialogFinished, setIsDialogFinished] = useState<boolean>(false);
  const [dialogAnimFrame, setDialogAnimFrame] = useState<number>(0);
  const [npcWalkIn, setNpcWalkIn] = useState<boolean>(false);

  // Refs for tracking keyboard state safely in the render loop
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const lastShotTime = useRef<number>(0);
  const lastSpecialTime = useRef<number>(0);

  // Game loop entity collections
  const enemies = useRef<EnemyEntity[]>([]);
  const potions = useRef<PotionEntity[]>([]);
  const boss = useRef<BossEntity | null>(null);
  const fireballs = useRef<FireballEntity[]>([]);
  const warpGate = useRef<THREE.Mesh | null>(null);
  const activeParticles = useRef<{
    mesh: THREE.Points;
    velocity: Float32Array;
    life: number;
    maxLife: number;
  }[]>([]);

  // Sound muter syncing
  useEffect(() => {
    setMuted(sound.getMuteStatus());
    const savedHighScore = localStorage.getItem('three_high_score');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  const handleMuteToggle = () => {
    const isNowMuted = sound.toggleMute();
    setMuted(isNowMuted);
  };

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code || e.key;
      keysPressed.current[code] = true;

      // Prevent window scrolling when playing
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code || e.key;
      keysPressed.current[code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Trigger floating damage text
  const spawnFloatText = (text: string, position: THREE.Vector3, color: string = '#ef4444') => {
    const id = Math.random().toString();
    // Convert 3D position to 2D screen coordinates for elegant CSS positioning
    setFloatingTexts((prev) => [
      ...prev,
      {
        id,
        text,
        x: Math.random() * 60 - 30, // randomized offset
        y: Math.random() * 40 - 20,
        life: 100,
        color,
      },
    ]);
  };

  // Animate floating text life cycle
  useEffect(() => {
    const timer = setInterval(() => {
      setFloatingTexts((prev) =>
        prev
          .map((t) => ({ ...t, life: t.life - 4 }))
          .filter((t) => t.life > 0)
      );
    }, 40);
    return () => clearInterval(timer);
  }, []);

  // Main Three.js Setup and Loop
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;

    // 1. SCENE & RENDERER
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.FogExp2(0x050505, 0.035);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. CAMERA SETUP
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    // Position camera at an isometric angles
    camera.position.set(0, 8, 11);
    camera.lookAt(0, 0, 0);

    // 3. LIGHTING
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Directional light casting gorgeous shadows
    const dirLight = new THREE.DirectionalLight(0xff0033, 1.8);
    dirLight.position.set(10, 20, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    const dRange = 25;
    dirLight.shadow.camera.left = -dRange;
    dirLight.shadow.camera.right = dRange;
    dirLight.shadow.camera.top = dRange;
    dirLight.shadow.camera.bottom = -dRange;
    scene.add(dirLight);

    // Secondary cyber blue light for dramatic contrast
    const blueLight = new THREE.PointLight(0x00ffff, 2.5, 30);
    blueLight.position.set(-15, 6, -10);
    scene.add(blueLight);

    // 4. GROUND PLANE (Tiled ground.png)
    const textureLoader = new THREE.TextureLoader();
    const groundTex = textureLoader.load(
      'https://res.cloudinary.com/dsucg33fv/image/upload/v1782439980/ground_d1kjrx.png',
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(18, 18);
        texture.needsUpdate = true;
      }
    );

    const groundGeo = new THREE.PlaneGeometry(50, 50);
    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.8,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Neon laser perimeter fence
    const fenceGeo = new THREE.BoxGeometry(50, 0.8, 0.8);
    const fenceMat = new THREE.MeshStandardMaterial({
      color: 0xff0033,
      emissive: 0xff0033,
      emissiveIntensity: 1.5,
    });

    const fenceNorth = new THREE.Mesh(fenceGeo, fenceMat);
    fenceNorth.position.set(0, 0.4, -25);
    scene.add(fenceNorth);

    const fenceSouth = new THREE.Mesh(fenceGeo, fenceMat);
    fenceSouth.position.set(0, 0.4, 25);
    scene.add(fenceSouth);

    const fenceEast = new THREE.Mesh(fenceGeo, fenceMat);
    fenceEast.rotation.y = Math.PI / 2;
    fenceEast.position.set(25, 0.4, 0);
    scene.add(fenceEast);

    const fenceWest = new THREE.Mesh(fenceGeo, fenceMat);
    fenceWest.rotation.y = Math.PI / 2;
    fenceWest.position.set(-25, 0.4, 0);
    scene.add(fenceWest);

    // 5. PLAYER 2D SPRITE (BILLBOARD PLANE WITH SHADOWS)
    const playerTex = textureLoader.load(
      'https://raw.githubusercontent.com/banyapon/banyapon.github.io/refs/heads/main/studio/images/player.png'
    );
    playerTex.magFilter = THREE.NearestFilter;
    playerTex.minFilter = THREE.NearestFilter;
    playerTex.wrapS = THREE.ClampToEdgeWrapping;
    playerTex.wrapT = THREE.ClampToEdgeWrapping;
    playerTex.repeat.set(0.25, 0.25); // 4x4 frame sprite sheet

    const playerGeo = new THREE.PlaneGeometry(2.2, 2.2);
    // Use standard material with transparent map so it casts & receives shadows properly!
    const playerMat = new THREE.MeshStandardMaterial({
      map: playerTex,
      transparent: true,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      roughness: 0.5,
    });

    const playerMesh = new THREE.Mesh(playerGeo, playerMat);
    playerMesh.position.set(0, 1.1, 0);
    playerMesh.castShadow = true;
    playerMesh.receiveShadow = true;
    scene.add(playerMesh);

    // Player Direction Vector (default looking forward -Z)
    const playerDirection = new THREE.Vector3(0, 0, -1);

    // Interactive 3D Hitbox model
    const hitBoxGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const hitBoxMat = new THREE.MeshBasicMaterial({
      color: 0xff0055,
      wireframe: true,
      transparent: true,
      opacity: 0,
    });
    const hitBoxMesh = new THREE.Mesh(hitBoxGeo, hitBoxMat);
    scene.add(hitBoxMesh);

    // Interactive Skill O ring model
    const ringGeo = new THREE.RingGeometry(0.1, 0.2, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.05; // just above ground
    scene.add(ringMesh);

    // Setup collections
    enemies.current = [];
    potions.current = [];
    boss.current = null;
    fireballs.current = [];
    warpGate.current = null;
    setDefeatedCount(0);
    setBossHp(null);
    setWarpGateActive(false);

    // Boss texture loading
    const bossTex = textureLoader.load(
      'https://res.cloudinary.com/dsucg33fv/image/upload/v1782709455/boss_e8jti1.png'
    );
    bossTex.magFilter = THREE.NearestFilter;
    bossTex.minFilter = THREE.NearestFilter;
    bossTex.wrapS = THREE.ClampToEdgeWrapping;
    bossTex.wrapT = THREE.ClampToEdgeWrapping;
    bossTex.repeat.set(0.25, 0.5);

    const spawnBoss = (x: number, z: number) => {
      const individualBossTex = bossTex.clone();
      individualBossTex.needsUpdate = true;

      const bossGeo = new THREE.PlaneGeometry(4.2, 4.2);
      const bossMat = new THREE.MeshStandardMaterial({
        map: individualBossTex,
        transparent: true,
        alphaTest: 0.5,
        side: THREE.DoubleSide,
        roughness: 0.5,
      });

      const bossMesh = new THREE.Mesh(bossGeo, bossMat);
      bossMesh.position.set(x, 2.5, z); // elevated because it flies
      bossMesh.castShadow = true;
      bossMesh.receiveShadow = true;
      scene.add(bossMesh);

      // Glowing purple indicator under the flying Boss
      const brGeo = new THREE.RingGeometry(0.3, 1.2, 32);
      const brMat = new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      const brMesh = new THREE.Mesh(brGeo, brMat);
      brMesh.rotation.x = -Math.PI / 2;
      brMesh.position.y = -2.4;
      bossMesh.add(brMesh);

      boss.current = {
        mesh: bossMesh,
        material: bossMat,
        texture: individualBossTex,
        hp: 12,
        maxHp: 12,
        position: bossMesh.position,
        state: 'idle',
        stateTimer: 2.0,
        animTimer: 0,
        currentFrame: 0,
        facing: 'right',
        flashTimer: 0,
        flashType: 'none',
        targetPosition: bossMesh.position.clone(),
        attackTimer: 0,
      };
      setBossHp(12);
      sound.playConfirm();
      spawnExplosionParticles(bossMesh.position, '#a855f7', 50);
      spawnFloatText('⚠️ BOSS: CRIMSON OMEGA APPEARED! ⚠️', new THREE.Vector3(x, 4.0, z), '#a855f7');
    };

    const spawnFireball = (start: THREE.Vector3, target: THREE.Vector3) => {
      const fbGeo = new THREE.SphereGeometry(0.45, 12, 12);
      const fbMat = new THREE.MeshStandardMaterial({
        color: 0xff3300,
        emissive: 0xff3300,
        emissiveIntensity: 3.0,
        roughness: 0.1,
      });
      const fbMesh = new THREE.Mesh(fbGeo, fbMat);
      fbMesh.position.copy(start);
      scene.add(fbMesh);

      const wrGeo = new THREE.RingGeometry(0.1, 1.2, 24);
      const wrMat = new THREE.MeshBasicMaterial({
        color: 0xff3300,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      });
      const wrMesh = new THREE.Mesh(wrGeo, wrMat);
      wrMesh.rotation.x = -Math.PI / 2;
      wrMesh.position.set(target.x, 0.06, target.z);
      scene.add(wrMesh);

      const innerRingGeo = new THREE.RingGeometry(0.1, 0.3, 16);
      const innerRingMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
      });
      const innerRingMesh = new THREE.Mesh(innerRingGeo, innerRingMat);
      innerRingMesh.position.z = 0.01;
      wrMesh.add(innerRingMesh);

      fireballs.current.push({
        mesh: fbMesh,
        warningRing: wrMesh,
        startPos: start.clone(),
        targetPos: target.clone(),
        currentPos: fbMesh.position,
        elapsedTime: 0,
        totalTime: 1.6,
      });
    };

    const spawnWarpGate = (x: number, z: number) => {
      const wgGeo = new THREE.TorusGeometry(1.6, 0.18, 16, 64);
      const wgMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      });
      const wgMesh = new THREE.Mesh(wgGeo, wgMat);
      wgMesh.position.set(x, 1.8, z);
      scene.add(wgMesh);

      // Glowing inner vertical cylinder representing the portal face
      const innerGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.1, 32);
      const innerMat = new THREE.MeshBasicMaterial({
        color: 0x34d399,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      });
      const innerMesh = new THREE.Mesh(innerGeo, innerMat);
      innerMesh.rotation.x = Math.PI / 2;
      wgMesh.add(innerMesh);

      // Glowing point light inside the warp gate
      const pLight = new THREE.PointLight(0x10b981, 3.5, 12);
      wgMesh.add(pLight);

      warpGate.current = wgMesh;
      setWarpGateActive(true);
      sound.playConfirm();
      spawnExplosionParticles(wgMesh.position, '#10b981', 45);
      spawnFloatText('🌌 WARP GATE DEPLOYED! ENTER IT TO ESCAPE! 🌌', new THREE.Vector3(x, 3.8, z), '#10b981');
    };

    // Enemy texture setup (2 rows: 1 Standing/Idle, 2 Walking. 4 columns each)
    const enemyTex = textureLoader.load(
      'https://raw.githubusercontent.com/banyapon/banyapon.github.io/refs/heads/main/studio/images/enemy.png'
    );
    enemyTex.magFilter = THREE.NearestFilter;
    enemyTex.minFilter = THREE.NearestFilter;
    enemyTex.wrapS = THREE.ClampToEdgeWrapping;
    enemyTex.wrapT = THREE.ClampToEdgeWrapping;
    enemyTex.repeat.set(0.25, 0.5); // 4 columns, 2 rows

    const spawnEnemy = (x: number, z: number) => {
      // Clone texture so each enemy can animate its UV frames independently
      const individualEnemyTex = enemyTex.clone();
      individualEnemyTex.needsUpdate = true;

      const enemyGeo = new THREE.PlaneGeometry(2.2, 2.2);
      const enemyMat = new THREE.MeshStandardMaterial({
        map: individualEnemyTex,
        transparent: true,
        alphaTest: 0.5,
        side: THREE.DoubleSide,
        roughness: 0.5,
      });

      const enemyMesh = new THREE.Mesh(enemyGeo, enemyMat);
      enemyMesh.position.set(x, 1.1, z);
      enemyMesh.castShadow = true;
      enemyMesh.receiveShadow = true;
      scene.add(enemyMesh);

      enemies.current.push({
        mesh: enemyMesh,
        material: enemyMat,
        texture: individualEnemyTex,
        hp: 2,
        maxHp: 2,
        position: enemyMesh.position,
        state: 'idle',
        animTimer: 0,
        currentFrame: 0,
        facing: 'right',
        flashTimer: 0,
        flashType: 'none',
        attackCooldown: Math.random() * 1.5,
        knockbackVel: new THREE.Vector3(0, 0, 0),
        deadTimer: 0,
        deadLaunchVel: new THREE.Vector3(0, 0, 0),
      });
    };

    // Potion texture setup (single frame)
    const potionTex = textureLoader.load(
      'https://raw.githubusercontent.com/banyapon/banyapon.github.io/refs/heads/main/studio/images/potion.png'
    );
    potionTex.magFilter = THREE.NearestFilter;
    potionTex.minFilter = THREE.NearestFilter;
    potionTex.wrapS = THREE.ClampToEdgeWrapping;
    potionTex.wrapT = THREE.ClampToEdgeWrapping;

    const spawnPotion = (x: number, z: number) => {
      const potionGeo = new THREE.PlaneGeometry(1.2, 1.2);
      const potionMat = new THREE.MeshStandardMaterial({
        map: potionTex,
        transparent: true,
        alphaTest: 0.5,
        side: THREE.DoubleSide,
        roughness: 0.5,
      });

      const potionMesh = new THREE.Mesh(potionGeo, potionMat);
      potionMesh.position.set(x, 0.6, z);
      potionMesh.castShadow = true;
      potionMesh.receiveShadow = true;
      scene.add(potionMesh);

      // Cyber glowing ring under potion
      const rGeo = new THREE.RingGeometry(0.1, 0.5, 16);
      const rMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      const rMesh = new THREE.Mesh(rGeo, rMat);
      rMesh.rotation.x = -Math.PI / 2;
      rMesh.position.y = -0.55;
      potionMesh.add(rMesh);

      potions.current.push({
        mesh: potionMesh,
        position: potionMesh.position,
        bobTimer: Math.random() * Math.PI * 2,
      });
    };

    // Spawn starting enemies
    spawnEnemy(-12, -10);
    spawnEnemy(12, 10);
    spawnEnemy(-15, 8);
    spawnEnemy(8, -12);
    spawnEnemy(0, 15);
    spawnEnemy(-5, -15);
    spawnEnemy(15, -5);

    // Spawn starting potions
    spawnPotion(-8, 5);
    spawnPotion(8, -5);
    spawnPotion(0, -10);

    // 6. SPARK / EXPLOSION PARTICLE ENGINE
    const spawnExplosionParticles = (pos: THREE.Vector3, color: string = '#ef4444', count: number = 30) => {
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const velocities = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        positions[i * 3] = pos.x;
        positions[i * 3 + 1] = pos.y;
        positions[i * 3 + 2] = pos.z;

        // Spherical velocity mapping
        const angle = Math.random() * Math.PI * 2;
        const pitch = Math.random() * Math.PI;
        const speed = Math.random() * 4 + 1.5;

        velocities[i * 3] = Math.sin(pitch) * Math.cos(angle) * speed;
        velocities[i * 3 + 1] = Math.cos(pitch) * speed + 2; // slight upward thrust
        velocities[i * 3 + 2] = Math.sin(pitch) * Math.sin(angle) * speed;
      }

      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const mat = new THREE.PointsMaterial({
        color: new THREE.Color(color),
        size: 0.18,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      });

      const particlePoints = new THREE.Points(geo, mat);
      scene.add(particlePoints);

      activeParticles.current.push({
        mesh: particlePoints,
        velocity: velocities,
        life: 1.0,
        maxLife: 1.0,
      });
    };

    // 7. ANIMATION TIMINGS & STATE TRACKING
    let playerState: 'IDLE' | 'WALK' | 'ATTACK' | 'DANCE' = 'IDLE';
    let currentFrameIndex = 0;
    let animTimer = 0;
    let hitBoxActiveTimer = 0;
    let ringActiveTimer = 0;
    let ringScale = 1.0;

    // Game loop parameters
    let lastTime = performance.now();
    let curPlayerHp = 5;
    let enemySpawnTimer = 0;
    let enemySpawnInterval = 1.0 + Math.random() * 2.0; // Random 1-3 seconds
    let potionSpawnTimer = 0;
    let localDefeatedCount = 0;
    let bossSpawned = false;

    const getSpawnPosAwayFromPlayer = (minDist: number) => {
      let tries = 0;
      while (tries < 50) {
        // Random angle (all directions) around player
        const angle = Math.random() * Math.PI * 2;
        const dist = 14 + Math.random() * 10; // 14 to 24 units away
        const x = playerMesh.position.x + Math.cos(angle) * dist;
        const z = playerMesh.position.z + Math.sin(angle) * dist;
        // Clamp inside playground boundaries
        const bound = 23.5;
        const px = Math.max(-bound, Math.min(bound, x));
        const pz = Math.max(-bound, Math.min(bound, z));
        const pos = new THREE.Vector3(px, 1.1, pz);
        if (pos.distanceTo(playerMesh.position) > minDist) {
          return pos;
        }
        tries++;
      }
      return new THREE.Vector3(10, 1.1, 10);
    };

    const animate = () => {
      const id = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Ensure camera always bills player mesh perfectly
      playerMesh.quaternion.copy(camera.quaternion);

      // Sync player hitbox placement
      hitBoxMesh.position.copy(playerMesh.position).addScaledVector(playerDirection, 1.2);

      // Particle update loop
      activeParticles.current = activeParticles.current.filter((p) => {
        const positions = p.mesh.geometry.attributes.position.array as Float32Array;
        const count = positions.length / 3;

        for (let i = 0; i < count; i++) {
          positions[i * 3] += p.velocity[i * 3] * dt;
          positions[i * 3 + 1] += p.velocity[i * 3 + 1] * dt;
          positions[i * 3 + 2] += p.velocity[i * 3 + 2] * dt;

          // Add simple gravity to particles
          p.velocity[i * 3 + 1] -= 9.8 * dt;
        }
        p.mesh.geometry.attributes.position.needsUpdate = true;

        p.life -= dt * 1.8;
        const mat = p.mesh.material as THREE.PointsMaterial;
        mat.opacity = Math.max(0, p.life);

        if (p.life <= 0) {
          scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          mat.dispose();
          return false;
        }
        return true;
      });

      // Update Hitbox Visuals
      if (hitBoxActiveTimer > 0) {
        hitBoxActiveTimer -= dt;
        const hMat = hitBoxMesh.material as THREE.MeshBasicMaterial;
        hMat.opacity = Math.max(0, hitBoxActiveTimer * 3);
        if (hitBoxActiveTimer <= 0) {
          hMat.opacity = 0;
        }
      }

      // Update Special Ring Visuals
      if (ringActiveTimer > 0) {
        ringActiveTimer -= dt;
        ringScale += dt * 18;
        ringMesh.scale.set(ringScale, ringScale, 1);
        const rMat = ringMesh.material as THREE.MeshBasicMaterial;
        rMat.opacity = Math.max(0, ringActiveTimer * 1.8);
        if (ringActiveTimer <= 0) {
          rMat.opacity = 0;
        }
      }

      // A. SPAWN PERIODIC ENEMIES AND POTIONS
      enemySpawnTimer += dt;
      potionSpawnTimer += dt;

      if (enemySpawnTimer > enemySpawnInterval && enemies.current.length < 15 && !isGameOver && !isGameWon) {
        enemySpawnTimer = 0;
        enemySpawnInterval = 1.0 + Math.random() * 2.0; // Randomize next interval (1-3s)
        const spawnPos = getSpawnPosAwayFromPlayer(8);
        spawnEnemy(spawnPos.x, spawnPos.z);
      }

      // Trigger Boss when player defeats 10 or more enemies
      if (localDefeatedCount >= 10 && !bossSpawned && !isGameOver && !isGameWon) {
        bossSpawned = true;
        const spawnPos = getSpawnPosAwayFromPlayer(10);
        spawnBoss(spawnPos.x, spawnPos.z);
      }

      if (potionSpawnTimer > 9.0 && potions.current.length < 5 && !isGameOver && !isGameWon) {
        potionSpawnTimer = 0;
        const rx = (Math.random() * 40) - 20;
        const rz = (Math.random() * 40) - 20;
        spawnPotion(rx, rz);
        spawnExplosionParticles(new THREE.Vector3(rx, 0.6, rz), '#10b981', 15);
      }

      // B. POTIONS BOBBING & PICKUP COLLISION LOOP
      potions.current = potions.current.filter((p) => {
        p.bobTimer += dt * 3.0;
        p.mesh.position.y = 0.6 + Math.sin(p.bobTimer) * 0.15;
        p.mesh.rotation.y += dt * 1.5;

        const distToPlayer = p.position.distanceTo(playerMesh.position);
        if (distToPlayer < 1.3) {
          // Play pick sound / health up
          curPlayerHp = Math.min(5, curPlayerHp + 1);
          setPlayerHp(curPlayerHp);
          sound.playShield(); // healing sound

          spawnExplosionParticles(p.position, '#10b981', 25);
          spawnFloatText('HEAL +1 HP! 🧪', p.position, '#10b981');

          scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          p.mesh.children.forEach((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
              child.material.dispose();
            }
          });
          p.mesh.material.dispose();
          return false;
        }
        return true;
      });

      // C. ENEMIES UPDATE LOOP
      enemies.current = enemies.current.filter((d) => {
        // Handle flashing timer
        if (d.flashTimer > 0) {
          d.flashTimer -= dt;
          if (d.flashType === 'red') {
            d.material.color.setRGB(1.0, 0.1, 0.1);
            d.material.emissive.setRGB(0.8, 0.0, 0.0);
            d.material.emissiveIntensity = 1.2;
          } else if (d.flashType === 'white') {
            const pulse = Math.floor(now / 60) % 2 === 0;
            if (pulse) {
              d.material.color.setRGB(1.0, 1.0, 1.0);
              d.material.emissive.setRGB(1.0, 1.0, 1.0);
              d.material.emissiveIntensity = 2.0;
            } else {
              d.material.color.setRGB(0.3, 0.3, 0.3);
              d.material.emissive.setRGB(0.0, 0.0, 0.0);
              d.material.emissiveIntensity = 0.0;
            }
          }
          if (d.flashTimer <= 0) {
            d.flashType = 'none';
          }
        } else {
          d.material.color.setRGB(1.0, 1.0, 1.0);
          d.material.emissive.setRGB(0.0, 0.0, 0.0);
          d.material.emissiveIntensity = 0.0;
        }

        // Make enemies look at camera (Billboard)
        d.mesh.quaternion.copy(camera.quaternion);

        // State Machine
        if (d.state === 'dead') {
          d.deadTimer -= dt;
          // Apply fly out of bounds velocity
          d.position.addScaledVector(d.deadLaunchVel, dt);
          // Apply gravity
          d.deadLaunchVel.y -= 35.0 * dt;
          // Wild spinning
          d.mesh.rotation.z += dt * 15.0;
          d.mesh.rotation.y += dt * 10.0;

          if (d.deadTimer <= 0) {
            spawnExplosionParticles(d.position, '#ffffff', 20);
            scene.remove(d.mesh);
            d.mesh.geometry.dispose();
            d.material.dispose();
            return false;
          }
          return true;
        }

        // Decrease attack cooldown
        if (d.attackCooldown > 0) {
          d.attackCooldown -= dt;
        }

        // Apply knockback if hit
        if (d.state === 'hit') {
          d.position.addScaledVector(d.knockbackVel, dt);
          d.knockbackVel.multiplyScalar(0.88); // decay
          if (d.knockbackVel.length() < 0.1) {
            d.state = 'walk';
          }
        }

        const distToPlayer = d.position.distanceTo(playerMesh.position);

        if (d.state !== 'hit') {
          if (distToPlayer > 1.2) {
            d.state = 'walk';
            // Move toward player
            const dir = new THREE.Vector3().subVectors(playerMesh.position, d.position);
            dir.y = 0; // lock Y
            dir.normalize();

            // Set animation row to Walking (Row 2: offset.y = 0)
            d.texture.offset.y = 0.0;

            const enemySpeed = 2.5;
            d.position.addScaledVector(dir, enemySpeed * dt);

            // Flip facing (หันขวาเป็นหลัก โดย default)
            if (dir.x < 0) {
              d.mesh.scale.x = -1; // face left
              d.facing = 'left';
            } else if (dir.x > 0) {
              d.mesh.scale.x = 1; // face right
              d.facing = 'right';
            }
          } else {
            d.state = 'idle';
            // Set animation row to Standing (Row 1: offset.y = 0.5)
            d.texture.offset.y = 0.5;

            // Attack logic
            if (d.attackCooldown <= 0 && !isGameOver && !isGameWon) {
              d.attackCooldown = 1.5; // attack rate
              d.flashTimer = 0.25;
              d.flashType = 'red';

              // Damage player
              curPlayerHp = Math.max(0, curPlayerHp - 1);
              setPlayerHp(curPlayerHp);
              sound.playExplode();

              spawnExplosionParticles(playerMesh.position, '#ef4444', 18);
              spawnFloatText('Ouch! -1 HP', playerMesh.position, '#f43f5e');

              if (curPlayerHp <= 0) {
                sound.playGameOver();
                setIsGameOver(true);
              }

              // Knock player back slightly away from enemy
              const pushBackDir = new THREE.Vector3().subVectors(playerMesh.position, d.position);
              pushBackDir.y = 0;
              pushBackDir.normalize();
              playerMesh.position.addScaledVector(pushBackDir, 1.2);
            }
          }
        }

        // Animate Enemy Texture Columns
        d.animTimer += dt;
        if (d.animTimer > 0.12) {
          d.animTimer = 0;
          d.currentFrame = (d.currentFrame + 1) % 4;
          d.texture.offset.x = d.currentFrame * 0.25;
        }

        return true;
      });

      // C2. BOSS UPDATE LOOP
      if (boss.current) {
        const b = boss.current;

        // Handle flash timers
        if (b.flashTimer > 0) {
          b.flashTimer -= dt;
          if (b.flashType === 'red') {
            b.material.color.setRGB(1.0, 0.1, 0.1);
            b.material.emissive.setRGB(0.8, 0.0, 0.0);
            b.material.emissiveIntensity = 1.2;
          } else if (b.flashType === 'white') {
            const pulse = Math.floor(now / 60) % 2 === 0;
            if (pulse) {
              b.material.color.setRGB(1.0, 1.0, 1.0);
              b.material.emissive.setRGB(1.0, 1.0, 1.0);
              b.material.emissiveIntensity = 2.0;
            } else {
              b.material.color.setRGB(0.3, 0.3, 0.3);
              b.material.emissive.setRGB(0.0, 0.0, 0.0);
              b.material.emissiveIntensity = 0.0;
            }
          }
          if (b.flashTimer <= 0) {
            b.flashType = 'none';
          }
        } else {
          b.material.color.setRGB(1.0, 1.0, 1.0);
          b.material.emissive.setRGB(0.0, 0.0, 0.0);
          b.material.emissiveIntensity = 0.0;
        }

        // Billboarding
        b.mesh.quaternion.copy(camera.quaternion);

        if (b.state === 'dead') {
          // Fall and spin
          b.mesh.rotation.z += dt * 10;
          b.mesh.rotation.y += dt * 5;
          b.mesh.position.y -= dt * 4;

          b.stateTimer -= dt;
          if (b.stateTimer <= 0) {
            const deathPos = b.position.clone();
            deathPos.y = 0.1; // reset ground level for warp gate
            scene.remove(b.mesh);
            b.mesh.geometry.dispose();
            b.material.dispose();
            boss.current = null;
            setBossHp(null);

            // Spawn the escape warp gate!
            spawnWarpGate(deathPos.x, deathPos.z);
          }
        } else {
          // Normal state machine
          b.animTimer += dt;
          if (b.animTimer > 0.12) {
            b.animTimer = 0;
            b.currentFrame = (b.currentFrame + 1) % 4;
            b.texture.offset.x = b.currentFrame * 0.25;
          }

          if (b.state === 'idle') {
            // Bobbing flight animation
            b.position.y = 2.8 + Math.sin(now * 0.003) * 0.35;
            b.texture.offset.y = 0.5; // Row 1: Idle

            b.stateTimer -= dt;
            if (b.stateTimer <= 0) {
              // Decide next action: 50% move, 50% attack prepare
              if (Math.random() < 0.5) {
                b.state = 'move';
                b.stateTimer = 3.0;
                // Choose target position
                // 50% chance to jump close to player, 50% chance to jump far
                const close = Math.random() < 0.5;
                const angle = Math.random() * Math.PI * 2;
                const dist = close ? 5.0 + Math.random() * 3.0 : 13.0 + Math.random() * 6.0;
                const tx = playerMesh.position.x + Math.cos(angle) * dist;
                const tz = playerMesh.position.z + Math.sin(angle) * dist;
                // Clamp within bounds
                const bound = 22.0;
                b.targetPosition.set(Math.max(-bound, Math.min(bound, tx)), 2.5, Math.max(-bound, Math.min(bound, tz)));
              } else {
                b.state = 'prepare';
                b.stateTimer = 1.2; // prepare duration
              }
            }
          } else if (b.state === 'move') {
            // Row 2: Moving/Dashing
            b.texture.offset.y = 0.0;
            b.position.y = 2.8 + Math.sin(now * 0.005) * 0.2;

            const moveDir = new THREE.Vector3().subVectors(b.targetPosition, b.position);
            moveDir.y = 0;
            const dist = moveDir.length();
            if (dist > 0.3) {
              moveDir.normalize();
              b.position.addScaledVector(moveDir, 11.0 * dt); // High-speed dash!
              if (moveDir.x < 0) {
                b.mesh.scale.x = -1; // face left
                b.facing = 'left';
              } else {
                b.mesh.scale.x = 1; // face right
                b.facing = 'right';
              }
            } else {
              b.state = 'idle';
              b.stateTimer = 1.0 + Math.random() * 1.0;
            }

            b.stateTimer -= dt;
            if (b.stateTimer <= 0) {
              b.state = 'idle';
              b.stateTimer = 1.0;
            }
          } else if (b.state === 'prepare') {
            b.texture.offset.y = 0.0; // Row 2 for charge
            b.stateTimer -= dt;

            // Squash/Stretch pulse as a warning
            const scalePulse = Math.sin(now * 0.04) * 0.25;
            const baseScaleX = b.facing === 'left' ? -4.2 : 4.2;
            b.mesh.scale.set(baseScaleX * (1.0 + scalePulse), 4.2 * (1.0 - scalePulse), 1.0);

            if (b.stateTimer <= 0) {
              b.state = 'idle';
              b.stateTimer = 1.5; // Rest duration after attack

              // Reset scale to normal
              b.mesh.scale.set(baseScaleX, 4.2, 1.0);

              // Play shoot sound and fire 3 fireballs
              sound.playShoot();
              for (let i = 0; i < 3; i++) {
                const delay = i * 0.25;
                setTimeout(() => {
                  if (!boss.current || boss.current.state === 'dead') return;
                  const angle = Math.random() * Math.PI * 2;
                  const r = Math.random() * 4.5;
                  const target = playerMesh.position.clone().add(new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r));
                  spawnFireball(boss.current.position.clone(), target);
                }, delay * 1000);
              }
            }
          }
        }
      }

      // C3. FIREBALLS UPDATE LOOP
      fireballs.current = fireballs.current.filter((fb) => {
        fb.elapsedTime += dt;
        const ratio = fb.elapsedTime / fb.totalTime;

        if (ratio >= 1.0) {
          // Landed!
          sound.playExplode();
          spawnExplosionParticles(fb.targetPos, '#ff4400', 25);
          spawnFloatText('CRASH! 💥', fb.targetPos, '#ff3300');

          // Damage player if inside target radius
          const distToPlayer = playerMesh.position.distanceTo(fb.targetPos);
          if (distToPlayer < 1.6 && !isGameOver && !isGameWon) {
            curPlayerHp = Math.max(0, curPlayerHp - 1);
            setPlayerHp(curPlayerHp);
            sound.playExplode();
            spawnExplosionParticles(playerMesh.position, '#ef4444', 20);
            spawnFloatText('Ouch! -1 HP', playerMesh.position, '#f43f5e');

            if (curPlayerHp <= 0) {
              sound.playGameOver();
              setIsGameOver(true);
            }

            // Push player back
            const pushDir = new THREE.Vector3().subVectors(playerMesh.position, fb.targetPos);
            pushDir.y = 0;
            pushDir.normalize();
            playerMesh.position.addScaledVector(pushDir, 1.8);
          }

          // Clean up meshes from scene
          scene.remove(fb.mesh);
          fb.mesh.geometry.dispose();
          if (Array.isArray(fb.mesh.material)) {
            fb.mesh.material.forEach((m) => m.dispose());
          } else {
            fb.mesh.material.dispose();
          }

          scene.remove(fb.warningRing);
          fb.warningRing.geometry.dispose();
          fb.warningRing.children.forEach((c) => {
            if (c instanceof THREE.Mesh) {
              c.geometry.dispose();
              if (Array.isArray(c.material)) {
                c.material.forEach((cm) => cm.dispose());
              } else {
                c.material.dispose();
              }
            }
          });
          if (Array.isArray(fb.warningRing.material)) {
            fb.warningRing.material.forEach((m) => m.dispose());
          } else {
            fb.warningRing.material.dispose();
          }

          return false;
        }

        // Fly in arc
        fb.currentPos.lerpVectors(fb.startPos, fb.targetPos, ratio);
        const arcHeight = 7.5;
        fb.currentPos.y = fb.startPos.y + (fb.targetPos.y - fb.startPos.y) * ratio + Math.sin(ratio * Math.PI) * arcHeight;

        // Pulse warning ring scale / opacity
        const warningMat = fb.warningRing.material as THREE.MeshBasicMaterial;
        warningMat.opacity = 0.3 + Math.sin(now * 0.01) * 0.2 + (ratio * 0.4);

        // Pulse inner ring of warning ring
        fb.warningRing.children.forEach((c) => {
          if (c instanceof THREE.Mesh) {
            c.scale.setScalar(1.0 + Math.sin(now * 0.02) * 0.3);
          }
        });

        // Spin fireball mesh
        fb.mesh.rotation.x += dt * 5;
        fb.mesh.rotation.y += dt * 5;

        return true;
      });

      // D. WARP GATE COLLISION
      if (warpGate.current && warpGateActive && !isGameWon && !isGameOver) {
        // Spin warp gate rings
        warpGate.current.rotation.z += dt * 0.8;
        warpGate.current.children.forEach((c) => {
          if (c instanceof THREE.Mesh && c.geometry.type === 'RingGeometry') {
            c.rotation.z -= dt * 1.5;
          }
        });

        const distToWarp = playerMesh.position.distanceTo(warpGate.current.position);
        if (distToWarp < 1.6) {
          setIsGameWon(true);
          sound.playConfirm();
          spawnExplosionParticles(playerMesh.position, '#34d399', 50);
        }
      }

      // 8. PLAYER CONTROL & MOVEMENT MATHEMATICS (8-Directions)
      let dx = 0;
      let dz = 0;

      // Support WASD and Arrows
      if (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp']) dz -= 1;
      if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) dz += 1;
      if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) dx -= 1;
      if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) dx += 1;

      // Handle continuous states
      const isMoving = dx !== 0 || dz !== 0;

      if (playerState !== 'ATTACK' && playerState !== 'DANCE') {
        if (isMoving) {
          playerState = 'WALK';
        } else {
          playerState = 'IDLE';
        }
      }

      if (isMoving && playerState !== 'ATTACK' && playerState !== 'DANCE') {
        // Normalise vector for diagonal movement speed balancing
        const moveVec = new THREE.Vector3(dx, 0, dz).normalize();
        playerDirection.copy(moveVec);

        // Apply movement velocity
        const speed = 6.2;
        playerMesh.position.addScaledVector(moveVec, speed * dt);

        // Clamp inside playground fence boundaries
        const bound = 24.0;
        playerMesh.position.x = Math.max(-bound, Math.min(bound, playerMesh.position.x));
        playerMesh.position.z = Math.max(-bound, Math.min(bound, playerMesh.position.z));

        // Flip sprite mesh horizontally depending on orientation
        if (dx < 0) {
          playerMesh.scale.x = -1; // look left
        } else if (dx > 0) {
          playerMesh.scale.x = 1; // look right
        }
      }

      // Action 1: Punch (P) - Play Attack Frame
      const timeNow = Date.now();
      if (keysPressed.current['KeyP'] && timeNow - lastShotTime.current > 300) {
        playerState = 'ATTACK';
        currentFrameIndex = 0; // restart
        sound.playShoot();
        lastShotTime.current = timeNow;

        // Visualise glowing red hitbox
        const hMat = hitBoxMesh.material as THREE.MeshBasicMaterial;
        hMat.opacity = 0.5;
        hitBoxActiveTimer = 0.2; // active for 200ms

        // Hit testing enemies
        enemies.current.forEach((d) => {
          if (d.state === 'dead') return;
          const distanceToHitbox = d.position.distanceTo(hitBoxMesh.position);
          if (distanceToHitbox < 2.2) {
            d.hp -= 1;
            sound.playExplode();

            if (d.hp === 1) {
              // Hit 1: Knockback in player direction + red flash
              spawnExplosionParticles(d.position, '#ef4444', 15);
              spawnFloatText(`HIT! 💥`, d.position, '#f43f5e');
              d.state = 'hit';
              d.knockbackVel.copy(playerDirection).normalize().multiplyScalar(15.0);
              d.flashTimer = 0.3;
              d.flashType = 'red';
            } else if (d.hp <= 0) {
              // Hit 2: Fly out of bounds/rapid white flashing
              spawnFloatText(`KO! 💫`, d.position, '#10b981');
              d.state = 'dead';
              d.deadTimer = 0.8;
              const launchBack = new THREE.Vector3().copy(playerDirection).normalize().multiplyScalar(12.0);
              d.deadLaunchVel.set(launchBack.x, 22.0, launchBack.z);
              d.flashTimer = 0.8;
              d.flashType = 'white';

              localDefeatedCount++;
              setDefeatedCount(localDefeatedCount);

              setScore((prev) => {
                const next = prev + 100;
                if (next > highScore) {
                  localStorage.setItem('three_high_score', String(next));
                  setHighScore(next);
                }
                return next;
              });
            }
          }
        });

        // Hit testing the Boss
        if (boss.current && boss.current.state !== 'dead') {
          const b = boss.current;
          const distanceToHitbox = b.position.distanceTo(hitBoxMesh.position);
          if (distanceToHitbox < 3.2) { // Boss has a larger hit boundary
            b.hp -= 1;
            setBossHp(b.hp);
            sound.playExplode();
            spawnExplosionParticles(b.position, '#a855f7', 20);

            if (b.hp <= 0) {
              spawnFloatText('BOSS KO! 🏆', b.position, '#10b981');
              b.state = 'dead';
              b.stateTimer = 2.0; // time to spin and fall
              b.flashTimer = 2.0;
              b.flashType = 'white';

              setScore((prev) => {
                const next = prev + 1000; // Giant boss score!
                if (next > highScore) {
                  localStorage.setItem('three_high_score', String(next));
                  setHighScore(next);
                }
                return next;
              });
            } else {
              spawnFloatText(`BOSS -1 HP 💥`, b.position, '#a855f7');
              b.flashTimer = 0.25;
              b.flashType = 'red';
            }
          }
        }

        // Clear state after speedier animation
        setTimeout(() => {
          if (playerState === 'ATTACK') {
            playerState = 'IDLE';
          }
        }, 300);
      }

      // Action 2: Special Skill (O) - Burst ring & knockback
      if (keysPressed.current['KeyO'] && timeNow - lastSpecialTime.current > 4000) {
        playerState = 'DANCE';
        currentFrameIndex = 0;
        sound.playShield();
        lastSpecialTime.current = timeNow;

        // Activate expanding cyan ground ring
        ringScale = 0.5;
        const rMat = ringMesh.material as THREE.MeshBasicMaterial;
        rMat.opacity = 0.9;
        ringActiveTimer = 0.5; // active for 500ms
        ringMesh.position.copy(playerMesh.position);
        ringMesh.position.y = 0.05; // ground offset

        spawnExplosionParticles(playerMesh.position, '#00ffff', 40);

        // AOE Ring hit test
        enemies.current.forEach((d) => {
          if (d.state === 'dead') return;
          const dist = d.position.distanceTo(playerMesh.position);
          if (dist < 6.5) {
            d.hp -= 2; // Instant defeat on full HP!
            sound.playExplode();

            spawnExplosionParticles(d.position, '#00ffff', 25);
            spawnFloatText(`AOE BURST! ⚡`, d.position, '#06b6d4');

            d.state = 'dead';
            d.deadTimer = 0.8;
            const pushDir = new THREE.Vector3().subVectors(d.position, playerMesh.position).normalize();
            d.deadLaunchVel.set(pushDir.x * 12.0, 22.0, pushDir.z * 12.0);
            d.flashTimer = 0.8;
            d.flashType = 'white';

            localDefeatedCount++;
            setDefeatedCount(localDefeatedCount);

            setScore((prev) => {
              const next = prev + 150;
              if (next > highScore) {
                localStorage.setItem('three_high_score', String(next));
                setHighScore(next);
              }
              return next;
            });
          }
        });

        // AOE Ring hit test for Boss
        if (boss.current && boss.current.state !== 'dead') {
          const b = boss.current;
          const dist = b.position.distanceTo(playerMesh.position);
          if (dist < 7.5) {
            b.hp -= 2; // Heavy damage from ultimate!
            setBossHp(b.hp);
            sound.playExplode();
            spawnExplosionParticles(b.position, '#00ffff', 35);

            if (b.hp <= 0) {
              spawnFloatText('BOSS KO! 🏆', b.position, '#10b981');
              b.state = 'dead';
              b.stateTimer = 2.0;
              b.flashTimer = 2.0;
              b.flashType = 'white';

              setScore((prev) => {
                const next = prev + 1000;
                if (next > highScore) {
                  localStorage.setItem('three_high_score', String(next));
                  setHighScore(next);
                }
                return next;
              });
            } else {
              spawnFloatText(`BOSS -2 HP ⚡`, b.position, '#06b6d4');
              b.flashTimer = 0.35;
              b.flashType = 'red';
            }
          }
        }

        setTimeout(() => {
          if (playerState === 'DANCE') {
            playerState = 'IDLE';
          }
        }, 600);
      }

      // Update special skill cooldown state
      const skillElapsed = timeNow - lastSpecialTime.current;
      const cooldownPercent = Math.min(100, Math.floor((skillElapsed / 4000) * 100));
      setSpecialCooldown(cooldownPercent);

      // (No auto score victory - victory is now triggered via Warp Gate portal entry!)

      // 9. ANIMATE THE SPRITE UVs
      animTimer += dt;
      const animSpeed = playerState === 'ATTACK' ? 0.07 : playerState === 'DANCE' ? 0.12 : 0.15;
      if (animTimer > animSpeed) {
        animTimer = 0;
        currentFrameIndex = (currentFrameIndex + 1) % 4;

        // Map column to horizontal offset (0, 0.25, 0.5, 0.75)
        playerTex.offset.x = currentFrameIndex * 0.25;

        // Map state row to vertical offset:
        // Row 1 (Idle): offset.y = 0.75
        // Row 2 (Walk): offset.y = 0.50
        // Row 3 (Attack): offset.y = 0.25
        // Row 4 (Dance): offset.y = 0.00
        if (playerState === 'IDLE') {
          playerTex.offset.y = 0.75;
        } else if (playerState === 'WALK') {
          playerTex.offset.y = 0.50;
        } else if (playerState === 'ATTACK') {
          playerTex.offset.y = 0.25;
        } else if (playerState === 'DANCE') {
          playerTex.offset.y = 0.00;
        }
      }

      // 10. CAMERA FOLLOW WITH SMOOTH LERP
      const targetCamX = playerMesh.position.x;
      const targetCamZ = playerMesh.position.z + 8.5;
      const targetCamY = playerMesh.position.y + 6.5;

      camera.position.x += (targetCamX - camera.position.x) * 0.08;
      camera.position.z += (targetCamZ - camera.position.z) * 0.08;
      camera.position.y += (targetCamY - camera.position.y) * 0.08;
      camera.lookAt(playerMesh.position.x, playerMesh.position.y, playerMesh.position.z);

      renderer.render(scene, camera);
    };

    let frameId = requestAnimationFrame(animate);

    // Window resize handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      groundGeo.dispose();
      groundMat.dispose();
      playerGeo.dispose();
      playerMat.dispose();
      hitBoxGeo.dispose();
      hitBoxMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();

      // Clean up enemies and potions to prevent memory leaks
      enemies.current.forEach((d) => {
        scene.remove(d.mesh);
        d.mesh.geometry.dispose();
        d.material.dispose();
      });
      potions.current.forEach((p) => {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        if (p.mesh.material) {
          if (Array.isArray(p.mesh.material)) {
            p.mesh.material.forEach((m) => m.dispose());
          } else {
            p.mesh.material.dispose();
          }
        }
      });

      // Clean up Boss
      if (boss.current) {
        scene.remove(boss.current.mesh);
        boss.current.mesh.geometry.dispose();
        boss.current.material.dispose();
      }

      // Clean up Fireballs
      fireballs.current.forEach((fb) => {
        scene.remove(fb.mesh);
        fb.mesh.geometry.dispose();
        if (Array.isArray(fb.mesh.material)) {
          fb.mesh.material.forEach((m) => m.dispose());
        } else {
          fb.mesh.material.dispose();
        }

        scene.remove(fb.warningRing);
        fb.warningRing.geometry.dispose();
        fb.warningRing.children.forEach((c) => {
          if (c instanceof THREE.Mesh) {
            c.geometry.dispose();
            if (Array.isArray(c.material)) {
              c.material.forEach((cm) => cm.dispose());
            } else {
              c.material.dispose();
            }
          }
        });
        if (Array.isArray(fb.warningRing.material)) {
          fb.warningRing.material.forEach((m) => m.dispose());
        } else {
          fb.warningRing.material.dispose();
        }
      });

      // Clean up Warp Gate
      if (warpGate.current) {
        scene.remove(warpGate.current);
        warpGate.current.children.forEach((c) => {
          if (c instanceof THREE.Mesh) {
            c.geometry.dispose();
            if (Array.isArray(c.material)) {
              c.material.forEach((cm) => cm.dispose());
            } else {
              c.material.dispose();
            }
          }
        });
      }
    };
  }, [keyConfig, isGameOver, isGameWon]);

  const restartGame = () => {
    setIsGameOver(false);
    setIsGameWon(false);
    setPlayerHp(5);
    setScore(0);
    setDefeatedCount(0);
    setBossHp(null);
    setDialogIndex(0);
    setIsDialogFinished(false);
    setNpcWalkIn(false);
  };

  const handleNextDialog = () => {
    sound.playConfirm();
    if (dialogIndex < DIALOG_STEPS.length - 1) {
      setDialogIndex((prev) => prev + 1);
    } else {
      setIsDialogFinished(true);
    }
  };

  // RPG Dialogue frame timer & walk-in trigger
  useEffect(() => {
    let interval: any;
    if (isGameWon && !isDialogFinished) {
      interval = setInterval(() => {
        setDialogAnimFrame((f) => (f + 1) % 4);
      }, 150);
      
      // Delay NPC walking in slightly for dramatic effect
      setNpcWalkIn(false);
      const timer = setTimeout(() => {
        setNpcWalkIn(true);
      }, 200);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [isGameWon, isDialogFinished]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[500px] flex flex-col bg-[#050505] relative select-none" id="three-game-arena">
      {/* Top HUD Display */}
      <div className="w-full flex justify-between items-center bg-neutral-950 border-b border-red-950/40 px-5 py-3.5 z-20">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[9px] text-neutral-500 font-mono tracking-widest uppercase">แต้มคะแนน</span>
            <span className="text-xl md:text-2xl font-display font-black text-white tracking-widest">{score}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] text-neutral-500 font-mono tracking-widest uppercase">สูงสุด</span>
            <span className="text-xl md:text-2xl font-display font-black text-red-500 tracking-widest flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-red-500" /> {highScore}
            </span>
          </div>
        </div>

        {/* Dynamic Float Damage Text */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex flex-col gap-1 pointer-events-none z-30">
          {floatingTexts.map((item) => (
            <div
              key={item.id}
              className="font-display font-black tracking-wide text-sm drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] transition-all duration-300"
              style={{
                color: item.color,
                transform: `translate(${item.x}px, ${item.y - (100 - item.life)}px)`,
                opacity: item.life / 100,
              }}
            >
              {item.text}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-three-mute"
            onClick={handleMuteToggle}
            className="p-2 bg-neutral-900 border border-neutral-800 hover:border-red-500 text-neutral-400 hover:text-white transition-all rounded"
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-neutral-300" />}
          </button>

          <button
            id="btn-three-exit"
            onClick={() => {
              sound.playHover();
              onBack();
            }}
            className="px-3.5 py-1.5 text-xs bg-red-950/30 border border-red-900/60 text-red-400 hover:bg-red-900 hover:text-white transition-all rounded font-sans"
          >
            ออก (Exit)
          </button>
        </div>
      </div>

      {/* THREE.js Canvas Viewport */}
      <div className="flex-1 w-full bg-[#050505] relative overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />

        {/* Quick Instructions overlay */}
        <div className="absolute top-4 left-4 bg-black/75 border border-neutral-900 rounded p-3 text-neutral-400 text-[10px] font-mono leading-relaxed max-w-xs pointer-events-none">
          <div className="text-white font-semibold mb-1 uppercase flex items-center gap-1.5 text-red-400">
            <Swords className="w-3.5 h-3.5" /> 2.5D Arena controls:
          </div>
          เดิน 8 ทิศทางด้วย: <span className="text-white">WASD / คีย์บอร์ดลูกศร</span>
          <br />
          กดยิง/ต่อย: <span className="text-red-400 font-bold">P Key</span>
          <br />
          ระเบิดพลังงาน AOE: <span className="text-cyan-400 font-bold">O Key (วงแหวนรอบตัว)</span>
        </div>

        {/* Boss HP bar or Defeated Enemies counter */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-black/85 border border-neutral-900 rounded p-3.5 min-w-[220px] pointer-events-none shadow-2xl">
          {bossHp !== null ? (
            <div className="flex flex-col w-full">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-display font-black text-red-500 tracking-wide animate-pulse">👹 BOSS (เจ้าแห่งเงา)</span>
                <span className="text-[10px] font-mono text-red-400 font-bold">{bossHp} / {maxBossHp}</span>
              </div>
              <div className="w-full h-3 bg-neutral-950 rounded overflow-hidden border border-red-950">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-purple-600 to-red-500 transition-all duration-300 shadow-[0_0_12px_rgba(220,38,38,0.8)]"
                  style={{ width: `${(bossHp / maxBossHp) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col w-full">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] text-neutral-400 font-sans">ปราบศัตรูเพื่อเรียกบอส:</span>
                <span className="text-xs font-mono text-white font-black">{defeatedCount} / 10</span>
              </div>
              <div className="w-full h-2 bg-neutral-955 rounded overflow-hidden border border-neutral-900">
                <div
                  className={`h-full transition-all duration-300 ${
                    defeatedCount >= 10
                      ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                      : 'bg-gradient-to-r from-amber-500 to-red-500'
                  }`}
                  style={{ width: `${Math.min(100, (defeatedCount / 10) * 100)}%` }}
                />
              </div>
              {defeatedCount >= 10 && (
                <div className="text-[9px] text-red-500 font-mono tracking-widest uppercase font-bold animate-pulse mt-2 text-center">
                  ⚠️ BOSS IS ACTIVE! WATCH THE SKY! ⚠️
                </div>
              )}
            </div>
          )}
          {warpGateActive && (
            <div className="text-[10px] text-cyan-400 font-sans tracking-wide font-black animate-pulse mt-2 text-center border border-cyan-950 bg-cyan-950/40 py-2 rounded shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              🌀 ประตูมิติปรากฏขึ้นแล้ว! เดินเข้าไปเพื่อหลบหนีและจบเกม!
            </div>
          )}
        </div>

        {/* GAME OVER Screen */}
        {isGameOver && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-sm z-30 flex items-center justify-center text-center p-6 border-4 border-red-600 animate-fade-in">
            <div className="max-w-md bg-neutral-950 border border-red-900/40 p-8 rounded-lg shadow-2xl glowing-red-border">
              <div className="w-16 h-16 bg-red-950 border border-red-600 flex items-center justify-center rounded-full mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500 animate-bounce" />
              </div>
              <h1 className="text-3xl font-display font-black text-red-500 tracking-widest uppercase mb-2" id="title-gameover-popup">
                GAME OVER
              </h1>
              <p className="text-neutral-400 font-sans text-sm mb-6 leading-relaxed" id="desc-gameover-popup">
                พลังงานขับเคลื่อนหมดลงจากการโจมตีของศัตรู! คุณรอดพ้นได้นานพอแล้ว
              </p>

              <div className="flex items-center justify-between border-y border-neutral-900 py-3 mb-6 font-mono text-sm text-neutral-400">
                <span>คะแนนสะสม:</span>
                <span className="text-white font-bold">{score}</span>
              </div>

              <div className="flex gap-3">
                <button
                  id="btn-three-retry"
                  onClick={restartGame}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold rounded tracking-wide transition-all uppercase font-display text-sm"
                >
                  <RotateCcw className="w-4 h-4" /> เริ่มใหม่ (Retry)
                </button>
                <button
                  id="btn-three-go-back"
                  onClick={onBack}
                  className="px-6 py-3 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 rounded text-sm font-sans"
                >
                  กลับหน้าหลัก
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GAME WON / ENDING Screen */}
        {isGameWon && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-30 flex flex-col justify-between p-6 md:p-10 border-4 border-cyan-500 animate-fade-in">
            {!isDialogFinished ? (
              // RPG DIALOGUE MODE
              <div className="flex-1 w-full flex flex-col justify-between gap-6">
                {/* Header */}
                <div className="w-full text-center shrink-0">
                  <div className="inline-flex items-center gap-2 bg-cyan-950/40 border border-cyan-900/60 px-4 py-1.5 rounded-full text-xs font-mono text-cyan-400 tracking-widest uppercase shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" /> ภารกิจสำเร็จ: ก้าวข้ามประตูมิติแห่งดวงดาว
                  </div>
                </div>

                {/* Character Standings Area */}
                <div className="flex-1 w-full flex items-center justify-around max-w-4xl mx-auto gap-8 relative">
                  {/* Left Side: Player */}
                  {(() => {
                    const isPlayerActive = DIALOG_STEPS[dialogIndex].speaker === 'player';
                    return (
                      <div className={`flex flex-col items-center transition-all duration-300 ${
                        isPlayerActive ? 'scale-110 filter brightness-100 drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]' : 'opacity-40 scale-90 filter brightness-50'
                      }`}>
                        <div className={`w-28 h-28 md:w-36 md:h-36 bg-neutral-900 border-2 rounded-lg overflow-hidden relative shadow-lg flex items-center justify-center transition-all duration-300 ${
                          isPlayerActive ? 'border-cyan-400 ring-2 ring-cyan-500/20' : 'border-neutral-800'
                        }`}>
                          <div 
                            className="w-24 h-24 md:w-32 md:h-32"
                            style={getSpriteStyle(
                              'https://raw.githubusercontent.com/banyapon/banyapon.github.io/refs/heads/main/studio/images/player.png',
                              dialogAnimFrame,
                              isPlayerActive ? 1 : 0
                            )}
                          />
                        </div>
                        <div className={`mt-3 px-3.5 py-1 rounded border text-xs font-bold tracking-wide transition-all ${
                          isPlayerActive ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'bg-neutral-900 border-neutral-800 text-neutral-500'
                        }`}>
                          ผู้พิทักษ์ (คุณ)
                        </div>
                      </div>
                    );
                  })()}

                  {/* Middle Break Deco */}
                  <div className="hidden sm:flex flex-col items-center opacity-25">
                    <div className="h-0.5 w-16 bg-gradient-to-r from-cyan-500 to-purple-500" />
                    <span className="text-[10px] font-mono tracking-widest mt-1 text-white uppercase">CONVERSATION</span>
                  </div>

                  {/* Right Side: NPC (Alice) */}
                  {(() => {
                    const isNpcActive = DIALOG_STEPS[dialogIndex].speaker === 'npc';
                    const isNpcWalking = !npcWalkIn || (isGameWon && npcWalkIn && dialogIndex === 0);
                    return (
                      <div className={`flex flex-col items-center transition-all duration-1000 ease-out ${
                        npcWalkIn ? 'translate-x-0 opacity-100' : 'translate-x-24 opacity-0'
                      } ${
                        isNpcActive ? 'scale-110 filter brightness-100 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]' : 'opacity-40 scale-90 filter brightness-50'
                      }`}>
                        <div className={`w-28 h-28 md:w-36 md:h-36 bg-neutral-900 border-2 rounded-lg overflow-hidden relative shadow-lg flex items-center justify-center transition-all duration-300 ${
                          isNpcActive ? 'border-purple-400 ring-2 ring-purple-500/20' : 'border-neutral-800'
                        }`}>
                          <div 
                            className="w-24 h-24 md:w-32 md:h-32"
                            style={getSpriteStyle(
                              'https://res.cloudinary.com/dsucg33fv/image/upload/v1782439980/npc1_pdraha.png',
                              dialogAnimFrame,
                              isNpcWalking ? 1 : 0
                            )}
                          />
                        </div>
                        <div className={`mt-3 px-3.5 py-1 rounded border text-xs font-bold tracking-wide transition-all ${
                          isNpcActive ? 'bg-purple-950 border-purple-400 text-purple-300 shadow-[0_0_10px_rgba(192,132,252,0.3)]' : 'bg-neutral-900 border-neutral-800 text-neutral-500'
                        }`}>
                          ผู้ช่วย อลิซ (NPC)
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Bottom Dialogue Box */}
                {(() => {
                  const isPlayerActive = DIALOG_STEPS[dialogIndex].speaker === 'player';
                  return (
                    <div 
                      className="w-full max-w-3xl mx-auto bg-neutral-950/95 border-2 border-cyan-500/60 rounded-xl p-5 md:p-6 shadow-2xl relative min-h-[140px] md:min-h-[160px] flex flex-col justify-between cursor-pointer hover:border-cyan-400 transition-all"
                      onClick={handleNextDialog}
                    >
                      {/* Speaker Badge */}
                      <div className={`absolute -top-4 left-6 px-4 py-1 rounded-md border text-[11px] font-black tracking-widest uppercase shadow-md transition-all ${
                        isPlayerActive ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-purple-600 border-purple-400 text-white'
                      }`}>
                        {DIALOG_STEPS[dialogIndex].name}
                      </div>

                      {/* Dialogue Content */}
                      <p className="text-sm md:text-base text-neutral-100 font-sans tracking-wide leading-relaxed mt-2 text-left select-text">
                        {DIALOG_STEPS[dialogIndex].text}
                      </p>

                      {/* Box Footer Controls */}
                      <div className="w-full flex justify-between items-center mt-4 border-t border-neutral-900/80 pt-3 shrink-0">
                        <span className="text-[10px] text-neutral-500 font-mono">
                          ประโยค {dialogIndex + 1} จาก {DIALOG_STEPS.length}
                        </span>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNextDialog();
                            }}
                            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded text-xs tracking-wider transition-all uppercase"
                          >
                            ถัดไป (Next)
                          </button>
                          <span className="text-[10px] text-cyan-400 font-bold animate-pulse tracking-widest font-mono">▼</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              // GAME WON COMPLETE SCOREBOARD (FINISH SCREEN)
              <div className="max-w-md w-full bg-neutral-950 border border-cyan-950 p-8 rounded-lg shadow-2xl glowing-cyan-border mx-auto my-auto animate-scale-up">
                <div className="w-20 h-20 bg-cyan-950/50 border border-cyan-500 flex items-center justify-center rounded-full mx-auto mb-6 shadow-[0_0_25px_rgba(6,182,212,0.6)] animate-pulse">
                  <Sparkles className="w-10 h-10 text-cyan-400" />
                </div>
                <h1 className="text-3xl font-display font-black text-cyan-400 tracking-widest uppercase mb-3" id="title-victory-popup">
                  FINISH
                </h1>
                <p className="text-neutral-300 font-sans text-sm mb-6 leading-relaxed" id="desc-victory-popup">
                  คุณได้จบภารกิจและร่วมเดินทางหลบหนีออกจากพื้นที่ทดลองอย่างปลอดภัยพร้อมผู้ช่วยอลิซอย่างเสร็จสมบูรณ์!
                </p>

                <div className="flex flex-col gap-2 border-y border-neutral-900 py-4 mb-6 font-mono text-sm text-neutral-400">
                  <div className="flex justify-between">
                    <span>ศัตรูที่กำจัดทั้งหมด:</span>
                    <span className="text-white font-bold">{defeatedCount} ตัว</span>
                  </div>
                  <div className="flex justify-between">
                    <span>คะแนนสุดท้าย:</span>
                    <span className="text-cyan-400 font-bold">{score} แต้ม</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    id="btn-three-win-retry"
                    onClick={restartGame}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 hover:border-neutral-700 font-bold rounded tracking-wide transition-all uppercase font-display text-sm"
                  >
                    <RotateCcw className="w-4 h-4" /> เล่นใหม่อีกครั้ง
                  </button>
                  <button
                    id="btn-three-win-back"
                    onClick={onBack}
                    className="flex-1 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-bold rounded text-sm font-sans tracking-wide uppercase font-display"
                  >
                    กลับหน้าหลัก (Title)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Status Panel */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 border-t border-red-950/40 bg-neutral-950 px-5 py-4 shrink-0 z-20">
        {/* HP Legend */}
        <div className="flex items-center gap-2 border-r border-neutral-900/50 pr-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-500 font-mono tracking-wider uppercase">พลังขับเคลื่อน (HP)</span>
            <div className="flex items-center gap-1 mt-1.5">
              {Array.from({ length: maxPlayerHp }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-3 w-6 rounded-sm border ${
                    idx < playerHp
                      ? 'bg-red-600 border-red-500 shadow-[0_0_8px_rgba(220,38,38,0.5)]'
                      : 'bg-neutral-900 border-neutral-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Skill Cooldown */}
        <div className="flex items-center gap-2 md:border-r border-neutral-900/50 px-4">
          <div className="flex flex-col w-full">
            <span className="text-[10px] text-neutral-500 font-mono tracking-wider uppercase flex justify-between">
              <span>วงแหวนระเบิดพลัง (O)</span>
              <span className={specialCooldown >= 100 ? 'text-cyan-400 font-bold' : 'text-neutral-500'}>
                {specialCooldown >= 100 ? 'READY' : `${specialCooldown}%`}
              </span>
            </span>
            <div className="w-full h-2.5 bg-neutral-900 rounded overflow-hidden mt-1.5 border border-neutral-850">
              <div
                className={`h-full transition-all duration-100 ${
                  specialCooldown >= 100
                    ? 'bg-gradient-to-r from-cyan-500 to-sky-400 shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                    : 'bg-neutral-800'
                }`}
                style={{ width: `${specialCooldown}%` }}
              />
            </div>
          </div>
        </div>

        {/* Key configurations list */}
        <div className="col-span-2 hidden md:flex items-center justify-end gap-3 text-neutral-500 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-neutral-900/50 border border-neutral-900 px-3 py-2 rounded">
            <span className="text-neutral-400 font-sans text-[11px]">คีย์ควบคุม:</span>
            <kbd className="px-1.5 py-0.5 bg-neutral-800 text-white rounded text-[10px]">{keyConfig.moveUp.toUpperCase()}/{keyConfig.moveDown.toUpperCase()}/{keyConfig.moveLeft.toUpperCase()}/{keyConfig.moveRight.toUpperCase()}</kbd>
            <span className="text-neutral-400 font-sans text-[11px] ml-1">โจมตี:</span>
            <kbd className="px-1.5 py-0.5 bg-neutral-800 text-red-400 rounded text-[10px] font-bold">P</kbd>
            <span className="text-neutral-400 font-sans text-[11px] ml-1">สกิลวงแหวน:</span>
            <kbd className="px-1.5 py-0.5 bg-neutral-800 text-cyan-400 rounded text-[10px] font-bold">O</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
