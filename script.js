const SELECTORS = {
  INPUT_DEC: '#rule-dec',
  INPUT_BIN: '#rule-bin',
  INPUT_HEX: '#rule-hex',
  INPUT_SPEED: '#speed',
  SELECT_CELL_SIZE: '#cell-size',
  BUTTON_START_STOP: '#button-start-stop',
  BUTTON_RESET: '#button-reset',
  BUTTON_COPY_PRESET: '#button-copy-preset',
  BUTTON_SINGLE_CELL: '#button-single-cell',
  CANVAS: '#canvas',
};
const START_STOP_VARIANTS = {
  START: null,
  STOP: 'Stop',
};

const DEFAULTS = {
  SPEED: 24,
  CELL_SIZE: 10,
};

const getRandomState = () =>
  Array(640 / window.cellSize)
    .fill()
    .map(() => Math.round(Math.random()));

let theInterval;

class CanvasHandler {
  #canvas;
  #context;
  #cellSize;
  #currentPosY = 0;
  #theMatrix = [];
  #height;

  constructor (canvas) {
    this.#canvas = canvas;
    this.#cellSize = window.cellSize;
    this.#height = Math.floor(canvas.height / this.#cellSize);
    this.#context = canvas.getContext('2d');
  }

  recalcCellSize (cellSize) {
    this.#cellSize = cellSize;
    this.#height = Math.floor(window.canvas.height / this.#cellSize);
  }

  reset () {
    this.#theMatrix = [];
    this.#currentPosY = 0;
    this.#clear();
  }

  #clear () {
    this.#context.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
  }

  #fillRect (x, y) {
    this.#context.fillStyle = 'black';
    this.#context.fillRect(
      x * this.#cellSize + 1,
      y * this.#cellSize + 1,
      this.#cellSize - 2,
      this.#cellSize - 2,
    );
  }

  #scrollCanvas () {
    this.#clear();
    this.#theMatrix.shift();
    this.#theMatrix.forEach((row, rowIdx) => {
      row.forEach((cell, cellIdx) => {
        if (cell === 1) {
          this.#fillRect(cellIdx, rowIdx);
        }
      });
    });
  }

  fill (arr) {
    this.#theMatrix.push(arr);
    if (this.#currentPosY === this.#height) {
      this.#scrollCanvas();
    }
    arr.forEach((el, idx) => {
      if (el === 1) {
        this.#fillRect(idx, this.#currentPosY);
      }
    });
    this.#currentPosY = Math.min(this.#height, this.#currentPosY + 1);
  }
}

const inputDec = document.querySelector(SELECTORS.INPUT_DEC);
const inputBin = document.querySelector(SELECTORS.INPUT_BIN);
const inputHex = document.querySelector(SELECTORS.INPUT_HEX);
const inputSpeed = document.querySelector(SELECTORS.INPUT_SPEED);
const selectCellSize = document.querySelector(SELECTORS.SELECT_CELL_SIZE);

const buttonStartStop = document.querySelector(SELECTORS.BUTTON_START_STOP);
START_STOP_VARIANTS.START = buttonStartStop.innerText;

const buttonReset = document.querySelector(SELECTORS.BUTTON_RESET);
const buttonCopyPreset = document.querySelector(SELECTORS.BUTTON_COPY_PRESET);
const buttonSingleCell = document.querySelector(SELECTORS.BUTTON_SINGLE_CELL);

const getNewState = currentState => {
  const newState = [];
  for (let i = -1; i < currentState.length - 1; i++) {
    const _3state = [
      currentState.at(i),
      currentState.at(i + 1),
      currentState.at(((i + currentState.length + 3) % currentState.length) - 1),
    ].join('');
    const pos = 7 - parseInt(_3state, 2);
    const res = Number(Number(window.rule).toString(2).padStart(8, 0)[pos]);
    newState.push(res);
  }
  return newState;
};

const onInputDecInput = e => {
  if (/[^0-9]+/g.test(e.target.value)) {
    e.target.value = e.target.value.replace(/[^0-9]+/g, '');
  }
  e.target.value = Math.min(e.target.value, 255);
  e.target.value = e.target.value.replace(/^0*(?=[0-9a-fA-F])/, '');

  window.rule = parseInt(e.target.value);
  inputHex.value = Number(window.rule).toString(16);
  inputBin.value = Number(window.rule).toString(2).padStart(8, '0');
};

const onInputBinInput = e => {
  if (/[^0-1]+/g.test(e.target.value)) {
    e.target.value = e.target.value.replace(/[^0-1]+/g, '');
  }
  if (e.target.value === '') {
    e.target.value = 0;
  }
  e.target.value = Math.min(parseInt(e.target.value, 2), 255).toString(2).padStart(8, '0');

  window.rule = parseInt(e.target.value, 2);
  inputHex.value = Number(window.rule).toString(16);
  inputDec.value = Number(window.rule).toString(10);
};

const onInputHexInput = e => {
  if (/[^0-9a-fA-F]+/g.test(e.target.value)) {
    e.target.value = e.target.value.replace(/[^0-9a-fA-F]+/g, '').toUpperCase();
  }

  if (e.target.value === '') {
    e.target.value = 0;
  }

  e.target.value = Math.min(parseInt(e.target.value, 16), 255).toString(16).toUpperCase();
  e.target.value = e.target.value.replace(/^0*(?=[0-9a-fA-F])/, '');

  window.rule = parseInt(e.target.value, 16);
  inputDec.value = Number(window.rule).toString(10);
  inputBin.value = Number(window.rule).toString(2).padStart(8, '0');
};

const onInputSpeedInput = e => {
  if (/[^0-9]+/g.test(e.target.value)) {
    e.target.value = e.target.value.replace(/[^0-9]+/g, '');
  }
  e.target.value = Math.min(Math.max(e.target.value, 1), 100);
  e.target.value = e.target.value.replace(/^0*(?=[0-9a-fA-F])/, '');

  window.speed = parseInt(e.target.value);
  if (!theInterval) {
    return;
  }
  theInterval && clearInterval(theInterval);
  theInterval = setInterval(() => {
    const newState = getNewState(currentState);
    canvasHandler.fill(newState);
    currentState = newState;
  }, 1000 / window.speed);
};

const onSelectCellSizeChange = e => {
  window.cellSize = Number(e.target.value);
  canvasHandler.recalcCellSize(window.cellSize);
  canvasHandler.reset();
  currentState = getRandomState();
  canvasHandler.fill(currentState);
};

const onbuttonStartStopClick = () => {
  buttonStartStop.innerText =
      buttonStartStop.innerText === START_STOP_VARIANTS.START
        ? START_STOP_VARIANTS.STOP
        : START_STOP_VARIANTS.START;

  if (theInterval) {
    clearInterval(theInterval);
    theInterval = null;
    return;
  }
  theInterval = setInterval(() => {
    const newState = getNewState(currentState);
    canvasHandler.fill(newState);
    currentState = newState;
  }, 1000 / window.speed);
};

const onButtonResetClick = () => {
  canvasHandler.reset();
  currentState = getRandomState();
  canvasHandler.fill(currentState);
};

const onButtonCopyPresetClick = async () => {
  const hrefURL = new URL(window.location.href);
  hrefURL.searchParams.set('rule', window.rule);
  hrefURL.searchParams.set('cellSize', window.cellSize);
  hrefURL.searchParams.set('speed', window.speed);
  await navigator.clipboard?.writeText(hrefURL.toString());
};

const onButtonSingleCellClick = () => {
  canvasHandler.reset();
  currentState = Array(640 / window.cellSize)
    .fill()
    .map((item, idx, arr) => Number(idx === Math.floor(arr.length / 2) - 1));
  canvasHandler.fill(currentState);
};

inputDec.addEventListener('input', onInputDecInput);
inputBin.addEventListener('input', onInputBinInput);
inputHex.addEventListener('input', onInputHexInput);
inputSpeed.addEventListener('input', onInputSpeedInput);
selectCellSize.addEventListener('change', onSelectCellSizeChange);

buttonStartStop.addEventListener('click', onbuttonStartStopClick);
buttonReset.addEventListener('click', onButtonResetClick);
buttonCopyPreset.addEventListener('click', onButtonCopyPresetClick);
buttonSingleCell.addEventListener('click', onButtonSingleCellClick);

const validateParams = hrefURL => {
  const removeParamsAndRedirect = () => {
    Array.from(hrefURL.searchParams).forEach(entry => hrefURL.searchParams.delete(entry[0]));
    window.location.href = hrefURL.href;
  };
  const validateRule = () => {
    const PARAM_KEY = 'rule';
    const rule = hrefURL.searchParams.get(PARAM_KEY);
    if (rule === null) {
      return;
    }
    if (rule === '' || /[\D]+/.test(rule) || Number(rule) > 255) {
      removeParamsAndRedirect();
    }
    return Number(rule);
  };
  const validateSpeed = () => {
    const PARAM_KEY = 'speed';
    const speed = hrefURL.searchParams.get(PARAM_KEY);
    if (speed === null) {
      return;
    }
    if (speed === '' || /[\D]+/.test(speed) || Number(speed) > 60 || Number(speed) < 1) {
      removeParamsAndRedirect();
    }
    return Number(speed);
  };
  const validateCellSize = () => {
    const PARAM_KEY = 'cellSize';
    const cellSize = hrefURL.searchParams.get(PARAM_KEY);
    if (cellSize === null) {
      return;
    }
    if (
      !Array.from(selectCellSize.options)
        .map(option => option.value)
        .includes(cellSize)
    ) {
      removeParamsAndRedirect();
    }
    return Number(cellSize);
  };

  return {
    rule: validateRule(),
    speed: validateSpeed(),
    cellSize: validateCellSize(),
  };
};
const { rule, speed, cellSize } = validateParams(new URL(window.location.href));
const initialRule = rule ?? Math.floor(Math.random() * 2 ** 8);
inputDec.value = initialRule;
inputBin.value = Number(initialRule).toString(2).padStart(8, 0);
inputHex.value = Number(initialRule).toString(16).toUpperCase();

const initialSpeed = speed ?? DEFAULTS.SPEED;
inputSpeed.value = initialSpeed;

const initialCellSize = cellSize ?? DEFAULTS.CELL_SIZE;
selectCellSize.value = initialCellSize;

window.rule = initialRule;
window.speed = initialSpeed;
window.cellSize = initialCellSize;

let currentState = getRandomState();

const canvasHandler = new CanvasHandler(document.querySelector(SELECTORS.CANVAS));
canvasHandler.fill(currentState);
