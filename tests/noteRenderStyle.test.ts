import { SLOTS_PER_BAR } from '../src/utils/tabLayout.ts';
import { getNoteRenderStyle, isNumericTabValue } from '../src/utils/tabPreviewTimeline.ts';

const stringNames = ['G', 'D'];

const fillSlots = (slots: (string | undefined)[]) =>
  Array.from({ length: SLOTS_PER_BAR }, (_, index) => slots[index] ?? '-');

const makeBar = (cells: Record<string, (string | undefined)[]>) => ({
  cells: Object.fromEntries(
    stringNames.map((stringName) => [
      stringName,
      fillSlots(cells[stringName] ?? []),
    ]),
  ),
});

const runTest = (name: string, fn: () => void) => {
  try {
    fn();
    console.log(`[ok] ${name}`);
  } catch (error) {
    console.error(`[fail] ${name}`);
    throw error;
  }
};

const expectStyle = (
  name: string,
  rowBars: ReturnType<typeof makeBar>[],
  expected: ReturnType<typeof getNoteRenderStyle>,
) => {
  runTest(name, () => {
    const result = getNoteRenderStyle({
      rowBars,
      stringName: 'G',
      barIndex: 0,
      slotIndex: 0,
    });

    console.log(`[debug] ${name}: expected=${expected}, actual=${result}`);

    if (result !== expected) {
      throw new Error(`Expected ${expected} got ${result}`);
    }
  });
};

expectStyle(
  'consecutive slots are short notes',
  [makeBar({ G: Array.from({ length: 8 }, () => '7') })],
  'short',
);

expectStyle('note followed by one empty is beat', [makeBar({ G: ['7', undefined, '9'] })], 'beat');

expectStyle(
  'note with two empty slots becomes hold2',
  [makeBar({ G: ['7', undefined, undefined, '10'] })],
  'hold2',
);

expectStyle(
  'note with three empty slots (2 beats) becomes hold2',
  [makeBar({ G: ['7', undefined, undefined, undefined, '10'] })],
  'hold2',
);

expectStyle(
  'note with seven empty slots (4 beats) becomes hold4',
  [makeBar({ G: ['7'] }), makeBar({ G: ['10'] })],
  'hold4',
);

expectStyle(
  'note with nine empty slots (>4 beats) becomes hold4',
  [makeBar({ G: ['7'] }), makeBar({ G: [undefined, undefined, '10'] })],
  'hold4',
);

runTest('padded single-digit slots are treated as numeric notes', () => {
  if (!isNumericTabValue('7-')) {
    throw new Error('Expected 7- to be treated as numeric');
  }
});

runTest('symbol slots are not treated as numeric notes', () => {
  if (isNumericTabValue('/') || isNumericTabValue('\\') || isNumericTabValue('.') || isNumericTabValue('-')) {
    throw new Error('Expected symbol slots to be treated as non-numeric');
  }
});

expectStyle(
  'padded note value still produces beat timing',
  [makeBar({ G: ['7-', undefined, '9-'] })],
  'beat',
);

console.log('note render style tests passed');
