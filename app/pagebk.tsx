'use client';

import { useState } from 'react';
import {
  NavTabs,
  M3Fab,
  M3SegmentedButton,
  M3BadgeButton,
  M3Checkbox,
  M3Switch,
  M3Slider,
  M3Select,
  M3Chips,
} from '@/components/material';

export default function Page() {
  const [activeTab, setActiveTab] = useState('receive');
  const [segmentedIdx, setSegmentedIdx] = useState(0);
  const [switchVal, setSwitchVal] = useState(true);

  return (
    <div className="min-h-screen bg-[#0E141B] text-[#E1E2E8] p-8 flex flex-col md:flex-row gap-8">
      {/* 1. NavTabs directly used */}
      <aside className="w-64 bg-[#111820] p-6 rounded-[24px] border border-[#1F2933]">
        <NavTabs
          title="LocalSend"
          items={[
            { id: 'receive', label: 'Receive', icon: 'wifi' },
            { id: 'send', label: 'Send', icon: 'send' },
            { id: 'settings', label: 'Settings', icon: 'settings' },
          ]}
          activeId={activeTab}
          onChange={setActiveTab}
        />
      </aside>

      {/* 2. Other Components directly used */}
      <main className="flex-1 flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <M3Fab label="New Task" icon="add" onClick={() => alert('New task!')} />
          <M3BadgeButton icon="notifications" badgeValue={5} />
        </div>

        <M3SegmentedButton
          options={[{ label: 'Day' }, { label: 'Week' }, { label: 'Month' }]}
          selectedIndex={segmentedIdx}
          onChange={setSegmentedIdx}
        />

        <M3Switch
          label="Auto Sync"
          selected={switchVal}
          onChange={setSwitchVal}
        />
      </main>
    </div>
  );
}