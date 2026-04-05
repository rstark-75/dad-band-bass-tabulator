export interface AvatarPreset {
  id: string;
  label: string;
  glyph: string;
  background: string;
  textColor: string;
}

export const avatarPresets: AvatarPreset[] = [
  { id: 'sunburst', label: 'Sunburst', glyph: '🎸', background: '#f59e0b', textColor: '#111827' },
  { id: 'amp', label: 'Amp', glyph: '🔊', background: '#22c55e', textColor: '#052e16' },
  { id: 'wave', label: 'Wave', glyph: '🌊', background: '#38bdf8', textColor: '#082f49' },
  { id: 'bolt', label: 'Bolt', glyph: '⚡', background: '#facc15', textColor: '#3f2a00' },
  { id: 'pick', label: 'Pick', glyph: '🎼', background: '#fb7185', textColor: '#4a1020' },
  { id: 'mixer', label: 'Mixer', glyph: '🎛️', background: '#a78bfa', textColor: '#231942' },
  { id: 'vinyl', label: 'Vinyl', glyph: '💿', background: '#f97316', textColor: '#431407' },
  { id: 'metronome', label: 'Metro', glyph: '⏱️', background: '#22d3ee', textColor: '#083344' },
  { id: 'crowd', label: 'Crowd', glyph: '🙌', background: '#4ade80', textColor: '#052e16' },
  { id: 'fire', label: 'Fire', glyph: '🔥', background: '#fb923c', textColor: '#7c2d12' },
  { id: 'headphones', label: 'Phones', glyph: '🎧', background: '#60a5fa', textColor: '#172554' },
  { id: 'moon', label: 'Night', glyph: '🌙', background: '#818cf8', textColor: '#1e1b4b' },
  { id: 'star', label: 'Star', glyph: '⭐', background: '#facc15', textColor: '#422006' },
  { id: 'wavehand', label: 'Hey', glyph: '🤘', background: '#34d399', textColor: '#052e16' },
  { id: 'drum', label: 'Drum', glyph: '🥁', background: '#f87171', textColor: '#450a0a' },
  { id: 'keys', label: 'Keys', glyph: '🎹', background: '#94a3b8', textColor: '#0f172a' },
  { id: 'spark', label: 'Spark', glyph: '✨', background: '#a3e635', textColor: '#1a2e05' },
  { id: 'rocket', label: 'Rocket', glyph: '🚀', background: '#2dd4bf', textColor: '#042f2e' },
  { id: 'coffee', label: 'Coffee', glyph: '☕', background: '#c084fc', textColor: '#2e1065' },
  { id: 'stage', label: 'Stage', glyph: '🎤', background: '#f472b6', textColor: '#500724' },
];

export const avatarPresetValue = (presetId: string): string => `preset:${presetId}`;

export const findAvatarPreset = (value: string): AvatarPreset | null => {
  if (!value.startsWith('preset:')) {
    return null;
  }

  const presetId = value.slice('preset:'.length);
  return avatarPresets.find((preset) => preset.id === presetId) ?? null;
};
