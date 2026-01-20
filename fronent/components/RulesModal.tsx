
import React from 'react';
import { Modal } from './Modal';
import { Trophy, Clock, Users, ArrowRightLeft, Scale } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="智慧排點規則">
      <div className="space-y-6">
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-sm text-amber-900 leading-relaxed">
          <p className="font-bold mb-1">💡 設計核心：</p>
          系統會根據歷史數據，自動計算每位球員的優先權，確保每個人都能打到球，且場地實力盡量平均。
        </div>

        <div className="space-y-4">
          {/* Rule 1 */}
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Trophy size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800">1. 優先上場順序</h4>
              <p className="text-xs text-slate-500 mt-1">
                系統會依序篩選球員：
                <br />
                1. <span className="font-bold text-slate-700">上場次數最少</span> 的人優先。
                <br />
                2. 若次數相同，<span className="font-bold text-slate-700">休息最久</span> 的人優先。
              </p>
            </div>
          </div>

          {/* Rule 2 */}
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <Users size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800">2. 人數控管</h4>
              <p className="text-xs text-slate-500 mt-1">
                堅持 <span className="font-bold text-slate-700">4 人一場</span>。
                <br />
                例如：現場有 6 人，系統只會安排 1 個場地 (4人)，讓 2 人休息，避免 3 打 3 或有人落單。
              </p>
            </div>
          </div>

          {/* Rule 3 */}
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <Scale size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800">3. S型能力分配 (S-Curve)</h4>
              <p className="text-xs text-slate-500 mt-1">
                選出球員後，依照等級排序 (Lv.5 ~ Lv.1)。
                <br />
                採用蛇形排列將強弱平均分散到各個場地，避免高手全部擠在同一場。
              </p>
            </div>
          </div>
        </div>

        <div className="text-center pt-2">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg text-sm transition-colors"
          >
            了解，開始排點
          </button>
        </div>
      </div>
    </Modal>
  );
};
