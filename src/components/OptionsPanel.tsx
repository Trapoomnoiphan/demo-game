/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { KeyConfig, KEY_LABELS } from '../types';
import { sound } from '../utils/sound';
import { Settings, RefreshCw, ChevronLeft, HelpCircle, Gamepad2, Info } from 'lucide-react';
import { motion } from 'motion/react';

interface OptionsPanelProps {
  keyConfig: KeyConfig;
  onSaveConfig: (newConfig: KeyConfig) => void;
  onBack: () => void;
}

export default function OptionsPanel({ keyConfig, onSaveConfig, onBack }: OptionsPanelProps) {
  const [currentBinds, setCurrentBinds] = useState<KeyConfig>({ ...keyConfig });
  const [activeBindingKey, setActiveBindingKey] = useState<keyof KeyConfig | null>(null);

  useEffect(() => {
    // If we are actively binding a key, listen to the keydown event once
    if (activeBindingKey === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Avoid blocking Escape key so users can cancel binding
      if (e.key === 'Escape') {
        setActiveBindingKey(null);
        sound.playHover();
        return;
      }

      // Read event code (e.g., 'KeyW', 'ArrowUp', 'Space', 'ShiftLeft')
      const code = e.code || e.key;

      const updated = { ...currentBinds, [activeBindingKey]: code };
      setCurrentBinds(updated);
      onSaveConfig(updated);
      setActiveBindingKey(null);
      sound.playConfirm();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [activeBindingKey, currentBinds, onSaveConfig]);

  const handleReset = () => {
    sound.playConfirm();
    const defaults: KeyConfig = {
      moveUp: 'ArrowUp',
      moveDown: 'ArrowDown',
      moveLeft: 'ArrowLeft',
      moveRight: 'ArrowRight',
      actionShoot: 'Space',
      actionSpecial: 'ShiftLeft',
    };
    setCurrentBinds(defaults);
    onSaveConfig(defaults);
  };

  // Helper to format Key display names nicely
  const formatKeyName = (code: string) => {
    if (!code) return 'ว่าง (Empty)';
    return code
      .replace('Arrow', 'Arrow ')
      .replace('Key', '')
      .replace('Digit', 'Num ')
      .replace('Left', ' Left')
      .replace('Right', ' Right')
      .toUpperCase();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-red-900 pb-4 mb-8">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-red-500 animate-spin-slow" />
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold tracking-wider text-white">
              ตั้งค่าการควบคุม
            </h2>
            <p className="text-xs text-red-400 font-mono tracking-widest mt-1 uppercase">
              // Control Panel configuration
            </p>
          </div>
        </div>
        <button
          id="btn-options-back"
          onClick={() => {
            sound.playHover();
            onBack();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 rounded hover:border-red-500 hover:text-white transition-all text-sm font-sans"
        >
          <ChevronLeft className="w-4 h-4" />
          ย้อนกลับ (Back)
        </button>
      </div>

      {/* Grid for Actions and Key Binding */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-4">
          <div className="bg-neutral-950 p-4 border border-neutral-900 rounded-lg">
            <h3 className="text-sm font-display font-semibold text-red-400 tracking-wider mb-4 flex items-center gap-2 uppercase">
              <Gamepad2 className="w-4 h-4" /> ทิศทางการเคลื่อนที่
            </h3>
            <div className="space-y-3">
              {KEY_LABELS.slice(0, 4).map((item) => {
                const isBinding = activeBindingKey === item.key;
                return (
                  <div
                    key={item.key}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-neutral-900/50 rounded border border-neutral-900 hover:border-neutral-800 transition-colors"
                  >
                    <div className="mb-2 sm:mb-0">
                      <div className="text-sm font-sans font-medium text-white">{item.labelTh}</div>
                      <div className="text-xs text-neutral-500 font-sans mt-0.5">{item.descriptionTh}</div>
                    </div>
                    <button
                      id={`btn-bind-${item.key}`}
                      onClick={() => {
                        sound.playHover();
                        setActiveBindingKey(item.key);
                      }}
                      className={`min-w-[140px] px-3 py-2 text-xs font-mono rounded tracking-wider border transition-all ${
                        isBinding
                          ? 'bg-red-950 border-red-500 text-red-300 animate-pulse'
                          : 'bg-neutral-900 border-neutral-700 text-white hover:border-red-500 hover:bg-red-950/20'
                      }`}
                    >
                      {isBinding ? 'กดปุ่มคีย์ใดก็ได้...' : formatKeyName(currentBinds[item.key])}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-neutral-950 p-4 border border-neutral-900 rounded-lg h-full flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-display font-semibold text-red-400 tracking-wider mb-4 flex items-center gap-2 uppercase">
                <Settings className="w-4 h-4" /> ปัญญายุทธ / ปุ่มโจมตี
              </h3>
              <div className="space-y-3">
                {KEY_LABELS.slice(4).map((item) => {
                  const isBinding = activeBindingKey === item.key;
                  return (
                    <div
                      key={item.key}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-neutral-900/50 rounded border border-neutral-900 hover:border-neutral-800 transition-colors"
                    >
                      <div className="mb-2 sm:mb-0">
                        <div className="text-sm font-sans font-medium text-white">{item.labelTh}</div>
                        <div className="text-xs text-neutral-500 font-sans mt-0.5">{item.descriptionTh}</div>
                      </div>
                      <button
                        id={`btn-bind-${item.key}`}
                        onClick={() => {
                          sound.playHover();
                          setActiveBindingKey(item.key);
                        }}
                        className={`min-w-[140px] px-3 py-2 text-xs font-mono rounded tracking-wider border transition-all ${
                          isBinding
                            ? 'bg-red-950 border-red-500 text-red-300 animate-pulse'
                            : 'bg-neutral-900 border-neutral-700 text-white hover:border-red-500 hover:bg-red-950/20'
                        }`}
                      >
                        {isBinding ? 'กดปุ่มคีย์ใดก็ได้...' : formatKeyName(currentBinds[item.key])}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Helper Banner */}
            <div className="mt-6 p-3 bg-neutral-900 rounded border border-neutral-800 flex items-start gap-3">
              <Info className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs text-neutral-400 font-sans leading-relaxed">
                <span className="text-white font-medium block mb-1">คำแนะนำการปรับแต่งปุ่ม:</span>
                คลิกที่ปุ่มคีย์ที่ต้องการเปลี่ยน จากนั้นกดปุ่มบนแป้นพิมพ์ของท่านเพื่อป้อนข้อมูลใหม่ ระบบจะบันทึกอัตโนมัติ (หรือกด <kbd className="px-1.5 py-0.5 bg-neutral-800 text-white rounded font-mono text-[10px]">ESC</kbd> เพื่อยกเลิก)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons & Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-neutral-900/40 rounded-lg border border-neutral-900">
        <div className="flex items-center gap-2 text-neutral-400 text-xs">
          <HelpCircle className="w-4 h-4 text-neutral-500" />
          <span>ข้อมูลทุกลิสต์การเปลี่ยนคีย์จะถูกเซฟอัตโนมัติลงบน Local Storage ของเบราว์เซอร์คุณ</span>
        </div>
        <button
          id="btn-options-reset"
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 bg-red-950/30 border border-red-900/60 text-red-400 hover:bg-red-900/40 hover:text-white transition-all rounded text-sm font-sans font-medium w-full sm:w-auto justify-center"
        >
          <RefreshCw className="w-4 h-4" />
          คืนค่าเริ่มต้น (Reset Defaults)
        </button>
      </div>
    </div>
  );
}
