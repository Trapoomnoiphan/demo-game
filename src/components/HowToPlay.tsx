/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HelpCircle, ChevronLeft, Shield, Zap, Target, Star, Keyboard, Swords } from 'lucide-react';
import { sound } from '../utils/sound';

interface HowToPlayProps {
  onBack: () => void;
}

export default function HowToPlay({ onBack }: HowToPlayProps) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-red-900 pb-4 mb-8">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-8 h-8 text-red-500" />
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold tracking-wider text-white">
              วิธีการเล่น (How To Play)
            </h2>
            <p className="text-xs text-red-400 font-mono tracking-widest mt-1 uppercase">
              // Training manual & core directives
            </p>
          </div>
        </div>
        <button
          id="btn-how-to-back"
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Step 1 */}
        <div className="bg-neutral-950 p-6 rounded-lg border border-neutral-900 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-950/40 border border-red-900/50 text-red-400 rounded-full flex items-center justify-center mb-4 text-xl font-bold font-mono">
            01
          </div>
          <Keyboard className="w-8 h-8 text-white mb-3" />
          <h3 className="text-base font-display text-white font-semibold mb-2">ปรับแต่งการควบคุม</h3>
          <p className="text-xs text-neutral-400 font-sans leading-relaxed">
            เลือกปรับแต่งปุ่มบังคับตัวละครตามที่ท่านถนัดในเมนู <strong className="text-red-400 font-medium">Options</strong> รองรับทั้งปุ่มลูกศร, WASD หรือปุ่มใดๆ บนคีย์บอร์ดที่คุณชื่นชอบ
          </p>
        </div>

        {/* Step 2 */}
        <div className="bg-neutral-950 p-6 rounded-lg border border-neutral-900 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-950/40 border border-red-900/50 text-red-400 rounded-full flex items-center justify-center mb-4 text-xl font-bold font-mono">
            02
          </div>
          <Swords className="w-8 h-8 text-white mb-3" />
          <h3 className="text-base font-display text-white font-semibold mb-2">ปกป้องยานและทำลายโดรน</h3>
          <p className="text-xs text-neutral-400 font-sans leading-relaxed">
            เคลื่อนที่หลบหลีกเศษอุกกาบาต ดับเบิ้ลคลิกหรือกดยิงพลาสม่าด้วยคีย์โจมตีที่คุณเลือกเพื่อทำลายฝูงโดรนรุกรานที่พุ่งเข้ามาโจมตีอย่างรวดเร็ว
          </p>
        </div>

        {/* Step 3 */}
        <div className="bg-neutral-950 p-6 rounded-lg border border-neutral-900 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-950/40 border border-red-900/50 text-red-400 rounded-full flex items-center justify-center mb-4 text-xl font-bold font-mono">
            03
          </div>
          <Shield className="w-8 h-8 text-white mb-3" />
          <h3 className="text-base font-display text-white font-semibold mb-2">โล่บาเรียพลังงาน</h3>
          <p className="text-xs text-neutral-400 font-sans leading-relaxed">
            เมื่อตกอยู่ในอันตราย กดปุ่ม <strong className="text-cyan-400 font-medium">Special Skill</strong> เพื่อสร้างม่านพลังงานบาเรียต้านความเสียหายได้ชั่วขณะ (มีคูลดาวน์ 6 วินาที)
          </p>
        </div>
      </div>

      {/* Enemies and Scoring Section */}
      <div className="bg-neutral-950 p-6 rounded-lg border border-neutral-900 mb-8">
        <h3 className="text-sm font-display font-semibold text-red-400 tracking-wider mb-4 flex items-center gap-2 uppercase">
          <Target className="w-4 h-4" /> ตารางแต้มคะแนนและคู่ต่อสู้
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-neutral-900/50 rounded border border-neutral-900 flex items-center gap-4">
            <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center font-bold text-white border border-zinc-700">
              ●
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Asteroid (อุกกาบาต)</div>
              <div className="text-sm font-mono text-red-400 font-bold">+10 แต้ม</div>
            </div>
          </div>

          <div className="p-4 bg-neutral-900/50 rounded border border-neutral-900 flex items-center gap-4">
            <div className="w-10 h-10 rounded bg-red-950 flex items-center justify-center font-bold text-red-400 border border-red-800">
              ▲
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Scout Drone (ยานลาดตระเวน)</div>
              <div className="text-sm font-mono text-red-400 font-bold">+15 แต้ม</div>
            </div>
          </div>

          <div className="p-4 bg-neutral-900/50 rounded border border-neutral-900 flex items-center gap-4">
            <div className="w-10 h-10 rounded bg-rose-950 flex items-center justify-center font-bold text-rose-400 border border-rose-800">
              ◆
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Crimson Interceptor (ฝูงสกัดกั้น)</div>
              <div className="text-sm font-mono text-red-400 font-bold">+25 แต้ม</div>
            </div>
          </div>
        </div>

        {/* Boss Encounter warning */}
        <div className="mt-6 p-4 bg-red-950/20 rounded border border-red-900/40 flex items-start gap-3">
          <Star className="w-5 h-5 text-red-500 animate-pulse shrink-0 mt-0.5" />
          <div className="text-xs text-neutral-300 font-sans leading-relaxed">
            <strong className="text-red-400 block mb-1">⚠️ คำเตือนด่านความยากระดับวิกฤต:</strong>
            เมื่อสะสมคะแนนครบ <span className="font-bold text-white text-sm">150 แต้ม</span> ระบบจะเรียกระดมบอสมหาประลัย <strong className="text-red-500 font-semibold text-xs">"Crimson Sentinel"</strong> ออกมาปกป้องน่านฟ้า มันจะเคลื่อนที่รวดเร็วและกระหน่ำสาดกระสุนปืนพลาสม่าใส่คุณ จงเอาชนะมันเพื่อคว้าชัยชนะสูงสุด!
          </div>
        </div>
      </div>
    </div>
  );
}
