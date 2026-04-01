let expression = '';
let angleMode = 'deg';
let memory = null;
let justCalculated = false;

const exprEl = document.getElementById('expression');
const resultEl = document.getElementById('result');
const memIndicator = document.getElementById('memIndicator');

function display() {
  exprEl.textContent = formatExpression(expression);
  if (!expression) {
    resultEl.textContent = '0';
    resultEl.classList.remove('error');
  }
}

function formatExpression(expr) {
  return expr
    .replace(/\*/g, '\u00d7')
    .replace(/\//g, '\u00f7')
    .replace(/pi/g, '\u03c0')
    .replace(/sqrt\(/g, '\u221a(');
}

function input(val) {
  if (justCalculated && /^[0-9.]/.test(val)) {
    expression = '';
    resultEl.classList.remove('error');
  }
  justCalculated = false;
  expression += val;
  display();
}

function clearAll() {
  expression = '';
  justCalculated = false;
  resultEl.textContent = '0';
  resultEl.classList.remove('error');
  exprEl.textContent = '';
}

function backspace() {
  if (justCalculated) {
    clearAll();
    return;
  }
  // Remove multi-char tokens at end
  const tokens = ['sin(', 'cos(', 'tan(', 'log(', 'ln(', 'sqrt(', 'pi', '1/'];
  for (const t of tokens) {
    if (expression.endsWith(t)) {
      expression = expression.slice(0, -t.length);
      display();
      return;
    }
  }
  expression = expression.slice(0, -1);
  display();
}

function setAngleMode(mode) {
  angleMode = mode;
  document.getElementById('degBtn').classList.toggle('active', mode === 'deg');
  document.getElementById('radBtn').classList.toggle('active', mode === 'rad');
}

function toggleSign() {
  if (justCalculated) {
    const current = resultEl.textContent;
    if (current && current !== 'Error' && current !== '0') {
      const num = parseFloat(current);
      expression = String(-num);
      justCalculated = false;
      display();
      resultEl.textContent = expression;
    }
    return;
  }
  if (expression) {
    // Find the last number and negate it
    const match = expression.match(/(.*?)(-?\d+\.?\d*)$/);
    if (match) {
      const prefix = match[1];
      const num = match[2];
      if (num.startsWith('-')) {
        expression = prefix + num.slice(1);
      } else {
        expression = prefix + '-' + num;
      }
      display();
    }
  }
}

function factorial(n) {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n > 170) return Infinity;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function evaluate(expr) {
  // Replace constants
  expr = expr.replace(/pi/g, '(' + Math.PI + ')');
  expr = expr.replace(/e(?![0-9])/g, '(' + Math.E + ')');

  // Replace factorial: number followed by !
  expr = expr.replace(/(\d+)!/g, (_, n) => factorial(parseInt(n)));

  // Replace 1/x pattern
  expr = expr.replace(/1\/([0-9.]+)/g, '(1/$1)');

  // Replace scientific functions
  const toRad = angleMode === 'deg' ? '*(Math.PI/180)' : '';
  expr = expr.replace(/sin\(([^)]+)\)/g, (_, a) => 'Math.sin((' + a + ')' + toRad + ')');
  expr = expr.replace(/cos\(([^)]+)\)/g, (_, a) => 'Math.cos((' + a + ')' + toRad + ')');
  expr = expr.replace(/tan\(([^)]+)\)/g, (_, a) => 'Math.tan((' + a + ')' + toRad + ')');
  expr = expr.replace(/log\(([^)]+)\)/g, 'Math.log10($1)');
  expr = expr.replace(/ln\(([^)]+)\)/g, 'Math.log($1)');
  expr = expr.replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)');

  // Replace ^ with **
  expr = expr.replace(/\^/g, '**');

  // Validate: only allow safe characters
  if (!/^[0-9+\-*/().,%eE \t\n\rMath.sincotaglqrpow10Ify]*$/.test(expr)) {
    throw new Error('Invalid expression');
  }

  const fn = new Function('return ' + expr);
  return fn();
}

function calculate() {
  if (!expression) return;

  try {
    const result = evaluate(expression);
    if (result === undefined || result === null) {
      throw new Error('Invalid');
    }

    let display;
    if (!isFinite(result)) {
      display = result === Infinity ? 'Infinity' : '-Infinity';
    } else if (isNaN(result)) {
      throw new Error('Invalid');
    } else {
      // Format: remove trailing zeros, limit precision
      display = parseFloat(result.toPrecision(12)).toString();
      // Use scientific notation for very large/small numbers
      if (Math.abs(result) > 1e15 || (Math.abs(result) < 1e-10 && result !== 0)) {
        display = result.toExponential(8);
      }
    }

    exprEl.textContent = formatExpression(expression) + ' =';
    resultEl.textContent = display;
    resultEl.classList.remove('error');
    expression = display;
    justCalculated = true;
  } catch {
    resultEl.textContent = 'Error';
    resultEl.classList.add('error');
    expression = '';
    justCalculated = true;
  }
}

function memStore() {
  const val = parseFloat(resultEl.textContent);
  if (!isNaN(val)) {
    memory = val;
    memIndicator.textContent = 'M';
  }
}

function memRecall() {
  if (memory !== null) {
    input(String(memory));
  }
}

// Keyboard support
document.addEventListener('keydown', (e) => {
  const key = e.key;

  if (/^[0-9.]$/.test(key)) {
    input(key);
  } else if (key === '+') {
    input('+');
  } else if (key === '-') {
    input('-');
  } else if (key === '*') {
    input('*');
  } else if (key === '/') {
    e.preventDefault();
    input('/');
  } else if (key === '^') {
    input('^');
  } else if (key === '(' || key === ')') {
    input(key);
  } else if (key === 'Enter' || key === '=') {
    e.preventDefault();
    calculate();
  } else if (key === 'Backspace') {
    backspace();
  } else if (key === 'Escape' || key === 'Delete') {
    clearAll();
  } else if (key === 'p') {
    input('pi');
  } else if (key === 's') {
    input('sin(');
  } else if (key === 'c') {
    input('cos(');
  } else if (key === 't') {
    input('tan(');
  } else if (key === 'l') {
    input('log(');
  } else if (key === 'n') {
    input('ln(');
  } else if (key === 'r') {
    input('sqrt(');
  } else if (key === '!') {
    input('!');
  }
});
