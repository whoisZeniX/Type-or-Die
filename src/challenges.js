export function createRng(seed = Date.now()) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296; 1
  };
}

function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

function shuffle(rng, list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}


const BINARY_BITS = [4, 5, 6, 8, 10]; 

function explainBinary(binary) {
  const values = [...binary]
    .map((bit, i) => (bit === '1' ? 2 ** (binary.length - 1 - i) : 0))
    .filter((value) => value > 0);
  return `${binary} = ${values.join(' + ')} = ${parseInt(binary, 2)}`;
}

function binaryChallenge(tier, rng) {
  const bits = BINARY_BITS[tier - 1];
  const value = randInt(rng, 1, 2 ** bits - 1);

  if (tier >= 3 && rng() < 0.5) {
    return {
      type: 'binary',
      title: 'binary encode',
      prompt: 'Convert this decimal number to binary.',
      data: String(value),
      hint: 'answer with 0s and 1s, e.g. 1011',
      input: 'text',
      answer: value.toString(2),
      explanation: explainBinary(value.toString(2)),
    };
  }

  const binary = value.toString(2).padStart(bits, '0');
  return {
    type: 'binary',
    title: 'binary decode',
    prompt: 'Convert this binary number to decimal.',
    data: binary,
    hint: 'answer with a decimal number, e.g. 11',
    input: 'text',
    answer: String(value),
    explanation: explainBinary(binary),
  };
}


const HEX_RANGES = [[1, 15], [16, 255], [16, 255], [256, 4095], [256, 65535]];

function explainHex(hex) {
  const parts = [...hex].map((digit, i) => `${parseInt(digit, 16)}×${16 ** (hex.length - 1 - i)}`);
  return `0x${hex} = ${parts.join(' + ')} = ${parseInt(hex, 16)}`;
}

function hexChallenge(tier, rng) {
  const [min, max] = HEX_RANGES[tier - 1];
  const value = randInt(rng, min, max);
  const hex = value.toString(16).toUpperCase();

  if (tier >= 3 && rng() < 0.5) {
    return {
      type: 'hex',
      title: 'hex encode',
      prompt: 'Convert this decimal number to hexadecimal.',
      data: String(value),
      hint: 'answer in hex, e.g. 3F (0x is optional)',
      input: 'text',
      answer: hex,
      explanation: explainHex(hex),
    };
  }

  return {
    type: 'hex',
    title: 'hex decode',
    prompt: 'Convert this hexadecimal number to decimal.',
    data: `0x${hex}`,
    hint: 'answer with a decimal number, e.g. 63',
    input: 'text',
    answer: String(value),
    explanation: explainHex(hex),
  };
}


const WORDS = ['access', 'kernel', 'packet', 'router', 'signal', 'cipher', 'socket', 'server',
  'buffer', 'vector', 'matrix', 'pixel', 'script', 'binary', 'switch', 'syntax'];
const PHRASES = ['open the vault', 'trace the signal', 'reboot the core', 'follow the packet',
  'decode the key', 'hello world', 'find the bug', 'ship the patch'];

const CAESAR_TIERS = [[false, 3, true], [false, 5, true], [false, 5, false], [true, 7, true], [true, 9, false]];

export function shiftText(text, shift) {
  return text.replace(/[a-z]/g, (letter) => {
    const index = letter.charCodeAt(0) - 97; // 'a' = 97
    return String.fromCharCode(97 + ((((index + shift) % 26) + 26) % 26));
  });
}

function caesarChallenge(tier, rng) {
  const [usePhrase, maxShift, showShift] = CAESAR_TIERS[tier - 1];
  const plain = pick(rng, usePhrase ? PHRASES : WORDS);
  const shift = randInt(rng, 1, maxShift);
  const encoded = shiftText(plain, shift).toUpperCase();

  return {
    type: 'caesar',
    title: 'caesar cipher',
    prompt: showShift
      ? `Every letter was shifted forward by ${shift}. Decode it.`
      : `Every letter was shifted forward by an unknown amount (1–${maxShift}). Decode it.`,
    data: encoded,
    hint: 'type the decoded message',
    input: 'text',
    answer: plain,
    explanation: `shift back by ${shift}: ${encoded} → ${plain.toUpperCase()}`,
  };
}

const PATTERNS = [
  { minTier: 1, make(rng) {
    const start = randInt(rng, 1, 20);
    const step = randInt(rng, 2, 9);
    return { terms: [0, 1, 2, 3, 4, 5].map((i) => start + step * i), rule: `add ${step} each time` };
  } },
  { minTier: 2, make(rng) {
    const start = randInt(rng, 1, 5);
    const factor = randInt(rng, 2, 3);
    return { terms: [0, 1, 2, 3, 4, 5].map((i) => start * factor ** i), rule: `multiply by ${factor} each time` };
  } },
  { minTier: 3, make(rng) {
    const first = randInt(rng, 1, 4);
    const extra = randInt(rng, 0, 5);
    const rule = extra === 0 ? 'square numbers' : `square numbers plus ${extra}`;
    return { terms: [0, 1, 2, 3, 4, 5].map((i) => (first + i) ** 2 + extra), rule };
  } },
  { minTier: 3, make(rng) {
    const terms = [randInt(rng, 1, 10)];
    const gap = randInt(rng, 1, 5);
    for (let i = 0; i < 5; i++) terms.push(terms[i] + gap + i);
    return { terms, rule: `the gap grows by 1 (+${gap}, +${gap + 1}, +${gap + 2}, …)` };
  } },
  { minTier: 4, make(rng) {
    const terms = [randInt(rng, 1, 5), randInt(rng, 2, 8)];
    while (terms.length < 6) terms.push(terms.at(-1) + terms.at(-2));
    return { terms, rule: 'each number is the sum of the two before it' };
  } },
  { minTier: 5, make(rng) {
    const add = randInt(rng, 1, 5);
    const terms = [randInt(rng, 1, 6)];
    for (let i = 0; i < 5; i++) terms.push(i % 2 === 0 ? terms[i] + add : terms[i] * 2);
    return { terms, rule: `alternate: add ${add}, then double` };
  } },
];

function makeChoices(answer, rng) {
  const choices = [answer];
  for (const offset of shuffle(rng, [-3, -2, -1, 1, 2, 3, 4, 5, 10])) {
    const candidate = answer + offset;
    if (candidate > 0 && !choices.includes(candidate)) choices.push(candidate);
    if (choices.length === 4) break;
  }
  return shuffle(rng, choices).map(String);
}

function sequenceChallenge(tier, rng) {
  const unlocked = PATTERNS.filter((p) => p.minTier <= tier);
  const newest = unlocked.filter((p) => p.minTier >= tier - 1);
  const { terms, rule } = pick(rng, newest.length > 0 ? newest : unlocked).make(rng);
  const answer = terms[5];

  return {
    type: 'sequence',
    title: 'pattern lock',
    prompt: 'Which number comes next?',
    data: `${terms.slice(0, 5).join(', ')}, ?`,
    hint: 'press 1–4 to choose',
    input: 'choice',
    choices: makeChoices(answer, rng),
    answer: String(answer),
    explanation: `${rule} → ${answer}`,
  };
}


const OPERATIONS = { AND: (a, b) => a & b, OR: (a, b) => a | b, XOR: (a, b) => a ^ b };
const LOGIC_TIERS = { 2: [1, 1], 3: [4, 1], 4: [4, 2], 5: [6, 2] }; 

function toBits(value, width) {
  return value.toString(2).padStart(width, '0');
}

function logicChallenge(tier, rng) {
  const [bits, steps] = LOGIC_TIERS[tier] ?? LOGIC_TIERS[2];
  const max = 2 ** bits - 1;

  const a = randInt(rng, 0, max);
  const b = randInt(rng, 0, max);
  const op = pick(rng, Object.keys(OPERATIONS));
  let result = OPERATIONS[op](a, b);
  let expression = `${toBits(a, bits)} ${op} ${toBits(b, bits)}`;
  const workings = [`${expression} = ${toBits(result, bits)}`];

  if (steps === 2) {
    const c = randInt(rng, 0, max);
    const op2 = pick(rng, Object.keys(OPERATIONS));
    const next = OPERATIONS[op2](result, c);
    workings.push(`${toBits(result, bits)} ${op2} ${toBits(c, bits)} = ${toBits(next, bits)}`);
    expression = `(${expression}) ${op2} ${toBits(c, bits)}`;
    result = next;
  }

  return {
    type: 'logic',
    title: 'logic gate',
    prompt: bits === 1 ? 'What does this gate output?' : 'Evaluate this bit by bit.',
    data: expression,
    hint: bits === 1 ? 'answer 0 or 1' : `answer in binary, e.g. ${toBits(5, bits)}`,
    input: 'text',
    answer: toBits(result, bits),
    explanation: workings.join(', then '),
  };
}


export const CHALLENGE_TYPES = [
  { id: 'binary', minTier: 1, generate: binaryChallenge },
  { id: 'hex', minTier: 1, generate: hexChallenge },
  { id: 'caesar', minTier: 1, generate: caesarChallenge },
  { id: 'sequence', minTier: 1, generate: sequenceChallenge },
  { id: 'logic', minTier: 2, generate: logicChallenge },
];

export function nextChallenge(tier, rng, previousType = null) {
  let options = CHALLENGE_TYPES.filter((type) => type.minTier <= tier);
  if (options.length > 1) options = options.filter((type) => type.id !== previousType);
  return pick(rng, options).generate(tier, rng);
}

export function normalizeAnswer(text) {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^0[xb](?=.)/, '') 
    .replace(/^0+(?=.)/, '');   
}

export function isCorrect(challenge, input) {
  return normalizeAnswer(input) === normalizeAnswer(challenge.answer);
}
