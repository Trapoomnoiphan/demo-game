/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ActiveScreen, KeyConfig, DEFAULT_KEYS } from './types';
import { sound } from './utils/sound';
import OptionsPanel from './components/OptionsPanel';
import ThreeGame from './components/ThreeGame';
import HowToPlay from './components/HowToPlay';
import Credits from './components/Credits';
import { Volume2, VolumeX, Shield, Play, Settings, HelpCircle, Award, Terminal } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('MENU');
  const [keyConfig, setKeyConfig] = useState<KeyConfig>(DEFAULT_KEYS);
  const [muted, setMuted] = useState<boolean>(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  // Load configuration from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('character_key_config');
    if (saved) {
      try {
        setKeyConfig(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved key config', e);
      }
    }
    setMuted(sound.getMuteStatus());
  }, []);

  // Save key config to state & local storage
  const handleSaveConfig = (newConfig: KeyConfig) => {
    setKeyConfig(newConfig);
    localStorage.setItem('character_key_config', JSON.stringify(newConfig));
  };

  const handleMuteToggle = () => {
    const isNowMuted = sound.toggleMute();
    setMuted(isNowMuted);
  };

  // Trigger background synth music once the user interacts with the app
  const handleUserInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      sound.startMusic();
    }
  };

  // Sound triggers on option hover
  const onHoverOption = () => {
    sound.playHover();
  };

  // Helper to render active screen panels
  const renderScreen = () => {
    switch (activeScreen) {
      case 'OPTIONS':
        return (
          <OptionsPanel
            keyConfig={keyConfig}
            onSaveConfig={handleSaveConfig}
            onBack={() => setActiveScreen('MENU')}
          />
        );
      case 'HOW_TO_PLAY':
        return <HowToPlay onBack={() => setActiveScreen('MENU')} />;
      case 'CREDITS':
        return <Credits onBack={() => setActiveScreen('MENU')} />;
      case 'GAME':
        return (
          <ThreeGame
            keyConfig={keyConfig}
            onBack={() => {
              setActiveScreen('MENU');
              // Restart background theme music on returning to the main menu
              if (!muted) {
                sound.startMusic();
              }
            }}
          />
        );
      case 'MENU':
      default:
        return (
          <div className="flex flex-col items-center justify-center flex-1 py-10 w-full">
            {/* Pulsing Interactive Game Logo at 60% Width */}
            <div className="w-full max-w-4xl flex justify-center mb-10 px-4">
              <img
                src="https://res.cloudinary.com/dsucg33fv/image/upload/v1782709347/logo_i8827v.png"
                alt="Crimson Space Fighter Logo"
                referrerPolicy="no-referrer"
                className="w-[60%] md:max-w-md lg:max-w-xl object-contain drop-shadow-[0_0_35px_rgba(220,38,38,0.45)] hover:scale-105 transition-transform duration-500 cursor-pointer"
                title="Crimson Star Fighter"
                onClick={() => {
                  sound.playConfirm();
                  setActiveScreen('GAME');
                  sound.stopMusic();
                }}
              />
            </div>

            {/* Menu Buttons Block */}
            <div className="w-full max-w-sm flex flex-col gap-3.5 px-6">
              <button
                id="btn-menu-play"
                onMouseEnter={onHoverOption}
                onClick={() => {
                  sound.playConfirm();
                  setActiveScreen('GAME');
                  sound.stopMusic(); // Stop menu background synth, game runs its own audio
                }}
                className="group relative flex items-center justify-center gap-3 w-full py-4 px-6 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-display text-sm font-black tracking-widest rounded-lg transition-all duration-300 shadow-[0_4px_20px_rgba(220,38,38,0.3)] hover:shadow-[0_4px_25px_rgba(220,38,38,0.5)] cursor-pointer"
              >
                <div className="absolute inset-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                <Play className="w-4 h-4 text-white fill-white group-hover:scale-110 transition-transform" />
                <span>เข้าเล่นเกม (PLAY)</span>
              </button>

              <button
                id="btn-menu-options"
                onMouseEnter={onHoverOption}
                onClick={() => {
                  sound.playConfirm();
                  setActiveScreen('OPTIONS');
                }}
                className="flex items-center justify-center gap-3 w-full py-3.5 px-6 bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 hover:border-red-500 text-neutral-200 hover:text-white font-sans text-sm font-semibold rounded-lg transition-all duration-300 cursor-pointer"
              >
                <Settings className="w-4 h-4 text-neutral-400 group-hover:rotate-45" />
                <span>ตั้งค่าการควบคุม (OPTIONS)</span>
              </button>

              <button
                id="btn-menu-how"
                onMouseEnter={onHoverOption}
                onClick={() => {
                  sound.playConfirm();
                  setActiveScreen('HOW_TO_PLAY');
                }}
                className="flex items-center justify-center gap-3 w-full py-3 px-6 bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 hover:border-red-500/60 text-neutral-300 hover:text-white font-sans text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-neutral-400" />
                <span>วิธีการเล่น (GUIDE)</span>
              </button>

              <button
                id="btn-menu-credits"
                onMouseEnter={onHoverOption}
                onClick={() => {
                  sound.playConfirm();
                  setActiveScreen('CREDITS');
                }}
                className="flex items-center justify-center gap-3 w-full py-3 px-6 bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-850 hover:border-red-500/40 text-neutral-400 hover:text-white font-sans text-sm font-normal rounded-lg transition-all duration-300 cursor-pointer"
              >
                <Award className="w-4 h-4 text-neutral-500" />
                <span>เครดิตทีมงาน (CREDITS)</span>
              </button>
            </div>

            {/* Quick guide subtitle */}
            <div className="mt-8 text-center px-4 font-mono text-[10px] text-neutral-600 tracking-wider">
              <span>PROTIP: GO TO OPTIONS TO REDEFINE CHARACTER ACTION KEYS</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      onClick={handleUserInteraction}
      className="w-full min-h-screen bg-black text-white relative flex flex-col justify-between p-4 md:p-6 select-none crt-screen overflow-x-hidden"
      id="arcade-launcher-app"
    >
      {/* GLOWING RED PULSING BORDER WRAPPER */}
      <div className="absolute inset-2 border-4 rounded-xl glowing-red-border pointer-events-none z-50" />

      {/* Top Console Bar */}
      <div className="w-full flex items-center justify-between px-3 py-2 border-b border-red-950/60 z-30 shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-red-500" />
          <span className="text-[10px] md:text-xs font-mono tracking-widest text-neutral-400 uppercase">
            System: ACTIVE // CORE_STRIKER_v1.0
          </span>
        </div>

        {/* Global Sound Toggler */}
        <button
          id="btn-global-mute"
          onClick={(e) => {
            e.stopPropagation();
            handleMuteToggle();
          }}
          className="flex items-center gap-1.5 px-3 py-1 bg-neutral-950 border border-neutral-800 hover:border-red-500 rounded text-[10px] font-mono tracking-wider text-neutral-400 hover:text-white transition-all"
          title="เปิด/ปิดเสียงดนตรีประกอบ"
        >
          {muted ? (
            <>
              <VolumeX className="w-3.5 h-3.5 text-red-500" />
              <span>MUSIC: OFF</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 text-neutral-300" />
              <span>MUSIC: ON</span>
            </>
          )}
        </button>
      </div>

      {/* Center Main Stage Content */}
      <div className="flex-1 w-full flex flex-col justify-center items-center z-20">
        {renderScreen()}
      </div>

      {/* Footer system details */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between border-t border-neutral-950 pt-3 px-3 z-30 shrink-0 text-[10px] font-mono text-neutral-600">
        <div>
          <span>OPERATIONAL MODE: IMMERSIVE FULLSCREEN</span>
        </div>
        <div className="mt-1 sm:mt-0">
          <span>SECURE PROTOCOL BINDING READY</span>
        </div>
      </div>
    </div>
  );
}
