/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Award, ChevronLeft, ShieldCheck, Cpu, Code2 } from 'lucide-react';
import { sound } from '../utils/sound';

interface CreditsProps {
  onBack: () => void;
}

export default function Credits({ onBack }: CreditsProps) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 text-center">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-red-900 pb-4 mb-12 text-left">
        <div className="flex items-center gap-3">
          <Award className="w-8 h-8 text-red-500" />
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold tracking-wider text-white">
              เครดิตทีมงาน (Credits)
            </h2>
            <p className="text-xs text-red-400 font-mono tracking-widest mt-1 uppercase">
              // Project production roster
            </p>
          </div>
        </div>
        <button
          id="btn-credits-back"
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

      {/* Roster list */}
      <div className="max-w-xl mx-auto space-y-8 bg-neutral-950/80 p-8 border border-neutral-900 rounded-xl glowing-red-border">
        <div>
          <h3 className="text-xs font-mono text-red-400 tracking-widest uppercase mb-1">// LEAD DEVELOPER & ENGINEER</h3>
          <p className="text-lg font-sans font-bold text-white">ทีมพัฒนาระบบสเตลล่าร์</p>
          <p className="text-xs text-neutral-500 font-sans">Google AI Studio Space Cadet Team</p>
        </div>

        <div className="h-px bg-neutral-900 w-1/2 mx-auto" />

        <div>
          <h3 className="text-xs font-mono text-red-400 tracking-widest uppercase mb-1">// TECHNICAL ARCHITECTURE</h3>
          <p className="text-md font-sans text-white font-medium">HTML5 Canvas Rendering Engine</p>
          <p className="text-xs text-neutral-400 font-sans mt-1">Web Audio API Synthesis Synthesizer</p>
          <p className="text-xs text-neutral-500 font-sans">React 19 & Tailwind CSS v4.0</p>
        </div>

        <div className="h-px bg-neutral-900 w-1/2 mx-auto" />

        <div className="flex items-center justify-center gap-8 pt-4">
          <div className="flex flex-col items-center gap-1.5 text-neutral-400">
            <Cpu className="w-6 h-6 text-red-500" />
            <span className="text-[10px] font-mono tracking-wider">HARDWARE CORE</span>
          </div>

          <div className="flex flex-col items-center gap-1.5 text-neutral-400">
            <Code2 className="w-6 h-6 text-red-500" />
            <span className="text-[10px] font-mono tracking-wider">TYPESCRIPT</span>
          </div>

          <div className="flex flex-col items-center gap-1.5 text-neutral-400">
            <ShieldCheck className="w-6 h-6 text-red-500" />
            <span className="text-[10px] font-mono tracking-wider">SECURE SHIELD</span>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-neutral-600 font-mono tracking-wide mt-12">
        COPYRIGHT © {new Date().getFullYear()} CRIMSON FIGHTER. ALL DIRECTIVES PROCESSED SECURELY.
      </p>
    </div>
  );
}
