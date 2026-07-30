/**
 * A tiny expression evaluator for the graphing.
 *
 * Written out rather than reaching for `eval` — not because the input is
 * hostile (it's yours), but because eval would happily accept anything at all
 * and this needs to *reject* what isn't a function of x. Shunting-yard to RPN,
 * then a stack machine.
 *
 * Understands: numbers, `x`, `pi`, `e`, `+ - * / % ^`, parentheses, unary
 * minus, implicit multiplication (`2x`, `3(x+1)`, `2sin(x)`), and the functions
 * below.
 */
const FUNCTIONS: Record<string, (...args: number[]) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  ln: Math.log,
  log: Math.log10,
  log2: Math.log2,
  exp: Math.exp,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  sign: Math.sign,
  min: Math.min,
  max: Math.max,
  pow: Math.pow,
  mod: (a, b) => a % b,
};

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
  tau: Math.PI * 2,
};

interface Op {
  precedence: number;
  rightAssociative: boolean;
  apply: (a: number, b: number) => number;
}

const OPERATORS: Record<string, Op> = {
  '+': { precedence: 1, rightAssociative: false, apply: (a, b) => a + b },
  '-': { precedence: 1, rightAssociative: false, apply: (a, b) => a - b },
  '*': { precedence: 2, rightAssociative: false, apply: (a, b) => a * b },
  '/': { precedence: 2, rightAssociative: false, apply: (a, b) => a / b },
  '%': { precedence: 2, rightAssociative: false, apply: (a, b) => a % b },
  '^': { precedence: 4, rightAssociative: true, apply: (a, b) => a ** b },
};

type Token =
  | { kind: 'number'; value: number }
  | { kind: 'variable' }
  | { kind: 'operator'; name: string }
  | { kind: 'function'; name: string }
  | { kind: 'paren'; value: '(' | ')' }
  | { kind: 'comma' };

export class ExpressionError extends Error {}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  /** True when the previous token can end a value — so a `-` here is binary. */
  const afterValue = () => {
    const last = tokens[tokens.length - 1];
    if (!last) return false;
    return (
      last.kind === 'number' ||
      last.kind === 'variable' ||
      (last.kind === 'paren' && last.value === ')')
    );
  };

  while (i < input.length) {
    const char = input[i];

    if (/\s/.test(char)) {
      i += 1;
      continue;
    }

    if (/[0-9.]/.test(char)) {
      let j = i;
      while (j < input.length && /[0-9.]/.test(input[j])) j += 1;
      const value = Number(input.slice(i, j));
      if (!Number.isFinite(value)) throw new ExpressionError(`"${input.slice(i, j)}" isn't a number.`);
      // 2x and 2(x+1) mean multiplication.
      if (afterValue()) tokens.push({ kind: 'operator', name: '*' });
      tokens.push({ kind: 'number', value });
      i = j;
      continue;
    }

    if (/[a-zA-Z_]/.test(char)) {
      let j = i;
      while (j < input.length && /[a-zA-Z0-9_]/.test(input[j])) j += 1;
      const name = input.slice(i, j).toLowerCase();
      if (afterValue()) tokens.push({ kind: 'operator', name: '*' });

      if (name === 'x') tokens.push({ kind: 'variable' });
      else if (name in CONSTANTS) tokens.push({ kind: 'number', value: CONSTANTS[name] });
      else if (name in FUNCTIONS) tokens.push({ kind: 'function', name });
      else throw new ExpressionError(`I don't know "${name}".`);
      i = j;
      continue;
    }

    if (char === '(' || char === ')') {
      // 2(x+1) and (x+1)(x-1) are both multiplication.
      if (char === '(' && afterValue()) tokens.push({ kind: 'operator', name: '*' });
      tokens.push({ kind: 'paren', value: char });
      i += 1;
      continue;
    }

    if (char === ',') {
      tokens.push({ kind: 'comma' });
      i += 1;
      continue;
    }

    if (char in OPERATORS) {
      // A leading or post-operator minus is negation, written as (0 - v).
      if (char === '-' && !afterValue()) {
        tokens.push({ kind: 'number', value: 0 });
        tokens.push({ kind: 'operator', name: '-u' });
      } else if (char === '+' && !afterValue()) {
        // A leading plus is just noise.
      } else {
        tokens.push({ kind: 'operator', name: char });
      }
      i += 1;
      continue;
    }

    throw new ExpressionError(`"${char}" doesn't belong here.`);
  }

  return tokens;
}

/** Unary minus binds tighter than everything but ^. */
const UNARY: Op = { precedence: 3, rightAssociative: true, apply: (a, b) => a - b };

function toRpn(tokens: Token[]): Token[] {
  const output: Token[] = [];
  const stack: Token[] = [];

  for (const token of tokens) {
    if (token.kind === 'number' || token.kind === 'variable') {
      output.push(token);
    } else if (token.kind === 'function') {
      stack.push(token);
    } else if (token.kind === 'comma') {
      while (stack.length && !(stack[stack.length - 1].kind === 'paren')) {
        output.push(stack.pop() as Token);
      }
      if (!stack.length) throw new ExpressionError('A comma outside a function.');
    } else if (token.kind === 'operator') {
      const op = token.name === '-u' ? UNARY : OPERATORS[token.name];
      while (stack.length) {
        const top = stack[stack.length - 1];
        if (top.kind !== 'operator') break;
        const topOp = top.name === '-u' ? UNARY : OPERATORS[top.name];
        const takes = op.rightAssociative
          ? topOp.precedence > op.precedence
          : topOp.precedence >= op.precedence;
        if (!takes) break;
        output.push(stack.pop() as Token);
      }
      stack.push(token);
    } else if (token.value === '(') {
      stack.push(token);
    } else {
      while (stack.length && !(stack[stack.length - 1].kind === 'paren')) {
        output.push(stack.pop() as Token);
      }
      if (!stack.length) throw new ExpressionError('A closing bracket with nothing to close.');
      stack.pop();
      if (stack.length && stack[stack.length - 1].kind === 'function') {
        output.push(stack.pop() as Token);
      }
    }
  }

  while (stack.length) {
    const top = stack.pop() as Token;
    if (top.kind === 'paren') throw new ExpressionError('A bracket was left open.');
    output.push(top);
  }
  return output;
}

export interface Compiled {
  /** Evaluate at x. Returns NaN where the function isn't defined. */
  (x: number): number;
}

/** Turn source into a function of x, or throw explaining why not. */
export function compile(source: string): Compiled {
  const trimmed = source.trim();
  if (!trimmed) throw new ExpressionError('Nothing to plot.');
  const rpn = toRpn(tokenize(trimmed));
  if (rpn.length === 0) throw new ExpressionError('Nothing to plot.');

  // Run it once to fail loudly here rather than silently per-pixel later.
  const evaluate = (x: number): number => {
    const stack: number[] = [];
    for (const token of rpn) {
      if (token.kind === 'number') {
        stack.push(token.value);
      } else if (token.kind === 'variable') {
        stack.push(x);
      } else if (token.kind === 'operator') {
        const b = stack.pop();
        const a = stack.pop();
        if (a === undefined || b === undefined) throw new ExpressionError('An operator is missing a number.');
        stack.push((token.name === '-u' ? UNARY : OPERATORS[token.name]).apply(a, b));
      } else if (token.kind === 'function') {
        // Two-argument functions take two; the rest take one.
        const arity = ['min', 'max', 'pow', 'mod'].includes(token.name) ? 2 : 1;
        const args: number[] = [];
        for (let n = 0; n < arity; n += 1) {
          const value = stack.pop();
          if (value === undefined) throw new ExpressionError(`${token.name}() is missing a number.`);
          args.unshift(value);
        }
        stack.push(FUNCTIONS[token.name](...args));
      }
    }
    if (stack.length !== 1) throw new ExpressionError('That doesn’t read as one expression.');
    return stack[0];
  };

  evaluate(1);
  return evaluate;
}

export interface Sample {
  x: number;
  y: number;
}

/**
 * Sample across a range. Points where the function isn't defined, or runs off
 * to infinity, come back as NaN so the plot can break the line rather than
 * drawing a vertical spike through an asymptote.
 */
export function sample(fn: Compiled, from: number, to: number, steps = 240): Sample[] {
  const out: Sample[] = [];
  const span = to - from;
  for (let i = 0; i <= steps; i += 1) {
    const x = from + (span * i) / steps;
    let y: number;
    try {
      y = fn(x);
    } catch {
      y = NaN;
    }
    out.push({ x, y: Number.isFinite(y) ? y : NaN });
  }
  return out;
}
