# Material 3 Components Guide

> [!NOTE]
> This markdown file is made by AI and is only there for reference. It is NOT a part of the application.

This document is your reference for using all the custom Google Material Design 3 (M3) components located in [`components/material/`](file:///c:/Users/Adeebur/Documents/Dwell/components/material).

---

## Table of Contents

1. [NavTabs (LocalSend-Style Tabs)](#1-navtabs-localsend-style-tabs)
2. [M3Fab (Floating Action Button)](#2-m3fab-floating-action-button)
3. [M3SegmentedButton (Segmented Buttons)](#3-m3segmentedbutton)
4. [M3BadgeButton (Icon Button with Badge)](#4-m3badgebutton)
5. [Selection Controls (Checkbox, Radio, Switch, Slider)](#5-selection-controls)
   - [M3Checkbox](#m3checkbox)
   - [M3Radio](#m3radio)
   - [M3Switch](#m3switch)
   - [M3Slider](#m3slider)
7. [M3Select (Dropdown Menus)](#6-m3select-dropdown-menus)
8. [M3Chips (Chips & Filters)](#7-m3chips)
9. [Color Customization Rules](#color-customization-rules)
10. [Full Page Example](#full-page-example)

---

## How to Use Directly in `page.tsx`

You **do not** need to import another page file or use `next/dynamic`. You can import any component directly into `app/page.tsx` as long as you add `'use client';` at the top:

```tsx
// app/page.tsx
'use client';

import { useState } from 'react';
import { NavTabs, M3Fab, M3Switch } from '@/components/material';

export default function Page() {
  const [tab, setTab] = useState('receive');
  const [sync, setSync] = useState(true);

  return (
    <main className="p-8">
      <NavTabs
        items={[
          { id: 'receive', label: 'Receive', icon: 'wifi' },
          { id: 'send', label: 'Send', icon: 'send' },
        ]}
        activeId={tab}
        onChange={setTab}
      />
      <M3Fab label="Create" icon="add" />
      <M3Switch label="Sync" selected={sync} onChange={setSync} />
    </main>
  );
}
```


---

## 1. NavTabs (LocalSend-Style Tabs)

A vertical navigation tab bar with a rounded stadium pill indicator around the icon, matching LocalSend's UI. The click ripple animation is strictly masked inside the logo chip.

```tsx
import { NavTabs } from '@/components/material';

const [activeTab, setActiveTab] = useState('receive');

<NavTabs
  title="LocalSend"
  items={[
    { id: 'receive', label: 'Receive', icon: 'wifi' },
    { id: 'send', label: 'Send', icon: 'send' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ]}
  activeId={activeTab}
  onChange={(id) => setActiveTab(id)}
  // Optional custom colors:
  color="#38BDF8"       // Active icon & text color (Default: #96CCFF)
  pillColor="#1E3A4A"   // Stadium pill background (Default: #253745)
/>
```

### Props:
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `items` | `Array<{ id: string; label: string; icon: string }>` | **Required** | List of tab items. `icon` is a Material Symbols name. |
| `activeId` | `string` | **Required** | The ID of the currently selected tab. |
| `onChange` | `(id: string) => void` | **Required** | Callback fired when any tab is clicked. |
| `title` | `string` | `'LocalSend'` | Optional header text displayed above the tabs. |
| `color` | `string` | Theme default (`#96CCFF`) | Custom active icon & text color (Hex, RGB, etc.). |
| `pillColor` | `string` | Theme default (`#253745`) | Custom active stadium chip background color. |
| `className` | `string` | `''` | Custom CSS class string. |

---

## 2. M3Fab (Floating Action Button)

A Material 3 squircle Floating Action Button supporting primary, secondary, tertiary, and branded styles.

```tsx
import { M3Fab } from '@/components/material';

// 1. Primary with label and icon
<M3Fab label="Create" icon="add" variant="primary" onClick={() => {}} />

// 2. Icon-only Secondary FAB
<M3Fab icon="edit" variant="secondary" />

// 3. Lowered Tertiary FAB
<M3Fab icon="navigation" variant="tertiary" lowered />

// 4. Branded FAB
<M3Fab label="Google" icon="star" variant="branded" />

// 5. Custom Color Override
<M3Fab
  label="Custom Color"
  icon="bolt"
  color="#006874"       // Background color
  textColor="#4FD8EB"   // Icon and text color
/>
```

### Props:
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `label` | `string` | `undefined` | Extended text label. Omit for an icon-only FAB. |
| `icon` | `string` | `undefined` | Material Symbols icon name. |
| `variant` | `'primary' \| 'secondary' \| 'tertiary' \| 'branded'` | `'primary'` | Visual style of the FAB. |
| `lowered` | `boolean` | `false` | Renders the FAB with lower elevation. |
| `color` | `string` | Theme default | Custom container background color. |
| `textColor` | `string` | Theme default | Custom label and icon color. |
| `onClick` | `() => void` | `undefined` | Click event handler. |

---

## 3. M3SegmentedButton

A group of connected buttons used to select between multiple options (e.g. Day / Week / Month).

```tsx
import { M3SegmentedButton } from '@/components/material';

const [selectedIdx, setSelectedIdx] = useState(0);

<M3SegmentedButton
  options={[
    { label: 'Day' },
    { label: 'Week' },
    { label: 'Month' },
  ]}
  selectedIndex={selectedIdx}
  onChange={(newIndex) => setSelectedIdx(newIndex)}
  // Custom Color Override (Optional):
  color="#004D57"              // Custom selected background
  selectedTextColor="#70F5FF"  // Custom selected text color
/>
```

### Props:
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `options` | `Array<{ label: string; icon?: string; value?: string }>` | **Required** | Array of segments to display. |
| `selectedIndex` | `number` | **Required** | Zero-based index of the active segment. |
| `onChange` | `(index: number) => void` | **Required** | Callback fired when a segment is clicked. |
| `color` | `string` | Theme default | Custom selected background container color. |
| `selectedTextColor`| `string` | Theme default | Custom text/icon color for selected segment. |

---

## 4. M3BadgeButton

An icon button with an anchored numeric or dot badge for notification counts, alerts, or carts.

```tsx
import { M3BadgeButton } from '@/components/material';

// 1. Numeric Badge
<M3BadgeButton icon="notifications" badgeValue={4} onClick={() => {}} />

// 2. High-count Badge (Filled variant)
<M3BadgeButton icon="mail" badgeValue="99+" variant="filled" />

// 3. Dot Badge (pass true for a small alert dot)
<M3BadgeButton icon="shopping_cart" badgeValue={true} variant="outlined" />

// 4. Custom Color Badge
<M3BadgeButton
  icon="star"
  badgeValue="NEW"
  color="#B3261E"          // Custom badge color
  badgeTextColor="#FFFFFF" // Custom badge text color
/>
```

### Props:
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `icon` | `string` | **Required** | Material Symbols icon name. |
| `badgeValue` | `string \| number \| boolean` | `undefined` | Value in the badge. Pass `true` for a dot badge. |
| `variant` | `'standard' \| 'filled' \| 'filled-tonal' \| 'outlined'` | `'standard'` | Icon button background style. |
| `color` | `string` | Theme default (`#FFB4AB`) | Custom badge background color. |
| `badgeTextColor` | `string` | Theme default (`#690005`) | Custom badge text color. |
| `onClick` | `() => void` | `undefined` | Click event handler. |

---

## 5. Selection Controls

### M3Checkbox
```tsx
import { M3Checkbox } from '@/components/material';

const [checked, setChecked] = useState(true);

<M3Checkbox
  label="Auto-Accept Incoming Files"
  checked={checked}
  onChange={(val) => setChecked(val)}
  // Optional:
  indeterminate={false}
  color="#00A8B5" // Custom checked color
/>
```

### M3Radio
```tsx
import { M3Radio } from '@/components/material';

const [speed, setSpeed] = useState('fast');

<M3Radio
  name="network-speed"
  value="fast"
  label="Fast Transfer"
  checked={speed === 'fast'}
  onChange={(val) => setSpeed(val)}
/>
<M3Radio
  name="network-speed"
  value="eco"
  label="Eco Mode"
  checked={speed === 'eco'}
  onChange={(val) => setSpeed(val)}
  color="#4FD8EB" // Custom color
/>
```

### M3Switch
```tsx
import { M3Switch } from '@/components/material';

const [autoSync, setAutoSync] = useState(true);

<M3Switch
  label="Auto Sync"
  selected={autoSync}
  onChange={(val) => setAutoSync(val)}
  icons={true}    // Show check/cross icons
  color="#006874" // Custom track color
/>
```

### M3Slider
```tsx
import { M3Slider } from '@/components/material';

const [volume, setVolume] = useState(65);

<M3Slider
  label="Volume"
  min={0}
  max={100}
  step={5}
  ticks={true}    // Shows discrete tick marks
  labeled={true}  // Shows floating value pill
  value={volume}
  onChange={(val) => setVolume(val)}
  color="#38BDF8" // Custom track & handle color
/>
```

---

## 6. M3Select (Dropdown Menus)

Material 3 Select pickers supporting floating labels and both outlined and filled styles.

```tsx
import { M3Select } from '@/components/material';

const [network, setNetwork] = useState('wifi');

<M3Select
  label="Network Mode"
  variant="outlined" // 'outlined' | 'filled'
  value={network}
  onChange={(val) => setNetwork(val)}
  options={[
    { label: 'Wi-Fi (Fast Transfer)', value: 'wifi' },
    { label: 'Mobile Hotspot', value: 'hotspot' },
    { label: 'Ethernet LAN', value: 'lan' },
  ]}
  color="#38BDF8" // Custom focus border & label color
/>
```

### Props:
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `label` | `string` | **Required** | The floating label text. |
| `options` | `Array<{ label: string; value: string }>` | **Required** | List of selectable choices. |
| `value` | `string` | `undefined` | Currently selected value. |
| `variant` | `'outlined' \| 'filled'` | `'outlined'` | Outlined border or filled container style. |
| `color` | `string` | Theme default | Custom focus highlight color. |
| `onChange` | `(value: string) => void` | `undefined` | Callback fired when selection changes. |

---

## 7. M3Chips

A container of Material 3 chips supporting Assist, Filter (toggleable), Input (removable), and Suggestion types.

```tsx
import { M3Chips, type ChipItem } from '@/components/material';

const [chips, setChips] = useState<ChipItem[]>([
  { id: '1', label: 'Nearby Device', icon: 'devices', type: 'assist' },
  { id: '2', label: 'Auto-Accept', type: 'filter', selected: true },
  { id: '3', label: 'downloads/folder', type: 'input' },
  { id: '4', label: 'Quick Send', type: 'suggestion' },
]);

<M3Chips
  items={chips}
  onSelect={(id) => {
    // Toggle filter chip selection
    setChips((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  }}
  onRemove={(id) => {
    // Remove input chip
    setChips((prev) => prev.filter((c) => c.id !== id));
  }}
  color="#004A76" // Custom selected container color
/>
```

---

## Color Customization Rules

1. **Default State**:
   - If you do not pass a `color` prop, the component automatically inherits the **Material 3 Dark Mode Blue Theme** defined in [`app/globals.css`](file:///c:/Users/Adeebur/Documents/Dwell/app/globals.css).
2. **Custom State**:
   - Every component accepts a `color` prop (and where relevant, `textColor`, `pillColor`, or `selectedTextColor`).
   - You can pass any standard CSS color:
     - Hex code: `color="#00E5FF"`
     - RGB / RGBA: `color="rgb(0, 104, 116)"`
     - CSS Variable: `color="var(--my-custom-color)"`

---

## Full Page Example

Here is a clean example of building your own page using these components:

```tsx
// app/my-dashboard/page.tsx
'use client';

import dynamic from 'next/dynamic';

const DashboardView = dynamic(() => import('./DashboardView'), { ssr: false });

export default function Page() {
  return <DashboardView />;
}
```

```tsx
// app/my-dashboard/DashboardView.tsx
'use client';

import React, { useState } from 'react';
import {
  NavTabs,
  M3Fab,
  M3SegmentedButton,
  M3BadgeButton,
  M3Checkbox,
  M3Switch,
  M3Select,
} from '@/components/material';

export default function DashboardView() {
  const [tab, setTab] = useState('receive');
  const [segmented, setSegmented] = useState(0);
  const [sync, setSync] = useState(true);

  return (
    <div className="min-h-screen bg-[#0E141B] text-[#E1E2E8] flex flex-col md:flex-row">
      {/* Left Sidebar */}
      <aside className="w-64 bg-[#111820] p-6 border-r border-[#1F2933]">
        <NavTabs
          title="LocalSend"
          items={[
            { id: 'receive', label: 'Receive', icon: 'wifi' },
            { id: 'send', label: 'Send', icon: 'send' },
            { id: 'settings', label: 'Settings', icon: 'settings' },
          ]}
          activeId={tab}
          onChange={setTab}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 flex flex-col gap-6">
        <header className="flex items-center justify-between pb-4 border-b border-[#1F2933]">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <M3BadgeButton icon="notifications" badgeValue={3} />
        </header>

        <div className="bg-[#161D24] p-6 rounded-[24px] border border-[#242E38] flex flex-col gap-4">
          <M3SegmentedButton
            options={[{ label: 'Daily' }, { label: 'Weekly' }, { label: 'Monthly' }]}
            selectedIndex={segmented}
            onChange={setSegmented}
          />

          <M3Switch
            label="Enable Background Sync"
            selected={sync}
            onChange={setSync}
          />

          <M3Fab label="New Transfer" icon="add" onClick={() => alert('Sending!')} />
        </div>
      </main>
    </div>
  );
}
```
