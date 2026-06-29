/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ActiveScreen = 'MENU' | 'OPTIONS' | 'GAME' | 'HOW_TO_PLAY' | 'CREDITS';

export interface KeyConfig {
  moveUp: string;
  moveDown: string;
  moveLeft: string;
  moveRight: string;
  actionShoot: string;
  actionSpecial: string;
}

export interface KeyLabel {
  key: keyof KeyConfig;
  labelTh: string;
  labelEn: string;
  descriptionTh: string;
  descriptionEn: string;
  defaultKey: string;
}

export const DEFAULT_KEYS: KeyConfig = {
  moveUp: 'ArrowUp',
  moveDown: 'ArrowDown',
  moveLeft: 'ArrowLeft',
  moveRight: 'ArrowRight',
  actionShoot: 'Space',
  actionSpecial: 'ShiftLeft',
};

export const KEY_LABELS: KeyLabel[] = [
  {
    key: 'moveUp',
    labelTh: 'เดินขึ้น (Up)',
    labelEn: 'Move Up',
    descriptionTh: 'เคลื่อนที่ตัวละครขึ้นด้านบน',
    descriptionEn: 'Move the character upwards',
    defaultKey: 'ArrowUp',
  },
  {
    key: 'moveDown',
    labelTh: 'เดินลง (Down)',
    labelEn: 'Move Down',
    descriptionTh: 'เคลื่อนที่ตัวละครลงด้านล่าง',
    descriptionEn: 'Move the character downwards',
    defaultKey: 'ArrowDown',
  },
  {
    key: 'moveLeft',
    labelTh: 'เดินซ้าย (Left)',
    labelEn: 'Move Left',
    descriptionTh: 'เคลื่อนที่ตัวละครไปด้านซ้าย',
    descriptionEn: 'Move the character to the left',
    defaultKey: 'ArrowLeft',
  },
  {
    key: 'moveRight',
    labelTh: 'เดินขวา (Right)',
    labelEn: 'Move Right',
    descriptionTh: 'เคลื่อนที่ตัวละครไปด้านขวา',
    descriptionEn: 'Move the character to the right',
    defaultKey: 'ArrowRight',
  },
  {
    key: 'actionShoot',
    labelTh: 'ยิง / โจมตี (Shoot)',
    labelEn: 'Shoot / Attack',
    descriptionTh: 'ยิงกระสุนพลาสม่าโจมตีผู้รุกราน',
    descriptionEn: 'Fire plasma lasers at hostile drones',
    defaultKey: 'Space',
  },
  {
    key: 'actionSpecial',
    labelTh: 'สกิลพิเศษ / แดช (Special / Dash)',
    labelEn: 'Special Skill / Dash',
    descriptionTh: 'เปิดบาเรียต้านทานการโจมตีชั่วขณะ',
    descriptionEn: 'Activate energy shield for temporary invulnerability',
    defaultKey: 'ShiftLeft',
  },
];
