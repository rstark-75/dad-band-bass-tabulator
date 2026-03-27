export const tuningOptions = [
  'Standard (E A D G)',
  'Drop D (D A D G)',
  'Half Step Down (Eb Ab Db Gb)',
  'Whole Step Down (D G C F)',
  'Drop C (C G C F)',
  '5-String Standard (B E A D G)',
  '5-String Drop A (A E A D G)',
] as const;

export type TuningOption = (typeof tuningOptions)[number];
