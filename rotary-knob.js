// Simple knob component without external dependencies for testing
class SimpleKnob extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Default values
    this._value = 0;
    this._min = 0;
    this._max = 100;
    this._step = 1;
    this._size = 100;
    
    this.render();
    this.bindEvents();
  }

  static get observedAttributes() {
    return ['value', 'min', 'max', 'step', 'size'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'value':
        this._value = parseFloat(newValue) || 0;
        break;
      case 'min':
        this._min = parseFloat(newValue) || 0;
        break;
      case 'max':
        this._max = parseFloat(newValue) || 100;
        break;
      case 'step':
        this._step = parseFloat(newValue) || 1;
        break;
      case 'size':
        this._size = parseInt(newValue) || 100;
        break;
    }
    this.render();
  }

  get value() { return this._value; }
  set value(val) {
    const numVal = parseFloat(val) || 0;
    if (this._value !== numVal) {
      this._value = numVal;
      this.render();
    }
  }

  get min() { return this._min; }
  set min(val) { 
    this._min = parseFloat(val) || 0; 
    this.render();
  }

  get max() { return this._max; }
  set max(val) { 
    this._max = parseFloat(val) || 100; 
    this.render();
  }

  get step() { return this._step; }
  set step(val) { 
    this._step = parseFloat(val) || 1; 
  }

  get size() { return this._size; }
  set size(val) { 
    this._size = parseInt(val) || 100; 
    this.render();
  }

  render() {
    const Math_PI = 3.14159265358979;
    const radius = 40;
    const midX = 50;
    const midY = 50;
    const minRadians = (4 * Math_PI) / 3;
    const maxRadians = -Math_PI / 3;
    const strokeWidth = 14;
    
    // Calculate paths
    const valueRadians = this.mapRange(this._value, this._min, this._max, minRadians, maxRadians);
    const zeroRadians = this._min > 0 && this._max > 0 
      ? this.mapRange(this._min, this._min, this._max, minRadians, maxRadians)
      : this.mapRange(0, this._min, this._max, minRadians, maxRadians);
    
    const minX = midX + Math.cos(minRadians) * radius;
    const minY = midY - Math.sin(minRadians) * radius;
    const maxX = midX + Math.cos(maxRadians) * radius;
    const maxY = midY - Math.sin(maxRadians) * radius;
    
    const zeroX = midX + Math.cos(zeroRadians) * radius;
    const zeroY = midY - Math.sin(zeroRadians) * radius;
    const valueX = midX + Math.cos(valueRadians) * radius;
    const valueY = midY - Math.sin(valueRadians) * radius;
    
    const largeArc = Math.abs(zeroRadians - valueRadians) < Math_PI ? 0 : 1;
    const sweep = valueRadians > zeroRadians ? 0 : 1;
    
    const rangePath = `M ${minX} ${minY} A ${radius} ${radius} 0 1 1 ${maxX} ${maxY}`;
    const valuePath = `M ${zeroX} ${zeroY} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${valueX} ${valueY}`;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          cursor: pointer;
          margin: 2px;
        }
        
        .knob-container {
          position: relative;
          display: inline-flex;
          justify-content: center;
          align-items: center;
        }
        
        svg {
          transform-origin: center;
          border-radius: 50%;
        }
        
        .knob-range {
          fill: none;
          stroke: #ffffff2e;
          stroke-linecap: butt;
        }
        
        .knob-value {
          fill: none;
          stroke: var(--primary-color, #007ad9);
          stroke-linecap: butt;
        }
        
        .knob-text {
          font-size: 1.5em;
          font-weight: bold;
          fill: #ffffffcc;
        }
        
        .knob-container:focus {
              outline: .15em solid var(--primary-color);
            outline-offset: .15em;
        }
      </style>
      <div class="knob-container">
        <svg
          viewBox="0 0 100 100"
          role="slider"
          width="${this._size}"
          height="${this._size}"
          tabindex="0"
          aria-valuemin="${this._min}"
          aria-valuemax="${this._max}"
          aria-valuenow="${this._value}"
        >
          <path
            d="${rangePath}"
            stroke-width="${strokeWidth}"
            class="knob-range"
          ></path>
          <path
            d="${valuePath}"
            stroke-width="${strokeWidth}"
            class="knob-value"
          ></path>
          <text
            x="50"
            y="57"
            text-anchor="middle"
            class="knob-text"
          >${this.formatValue(this._value)}</text>
        </svg>
      </div>
    `;
  }

  mapRange(x, inMin, inMax, outMin, outMax) {
    return ((x - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }

  formatValue(value) {
    // Format number to maximum 2 decimal places, removing trailing zeros
    return parseFloat(value.toFixed(2)).toString();
  }

  bindEvents() {
    this.addEventListener('click', this.onClick.bind(this));
    this.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  onClick(event) {
    // Focus the knob first so keyboard events will work
    const svg = this.shadowRoot.querySelector('svg');
    if (svg) {
      svg.focus();
    }
    
    // For click, we can increment/decrement based on click position
    const rect = svg.getBoundingClientRect();
    const offsetY = event.clientY - rect.top;
    const centerY = rect.height / 2;
    
    if (offsetY < centerY) {
      // Clicked in upper half - increase value
      this.updateValue(this._value + this._step);
    } else {
      // Clicked in lower half - decrease value
      this.updateValue(this._value - this._step);
    }
  }

  onMouseDown(event) {
    // Focus the knob so keyboard events will work after dragging
    const svg = this.shadowRoot.querySelector('svg');
    if (svg) {
      svg.focus();
    }
    
    this.isDragging = true;
    this.startY = event.clientY;
    this.startValue = this._value;
    
    const mouseMoveHandler = (e) => {
      if (this.isDragging) {
        this.updateValueByVerticalMovement(e.clientY);
      }
    };
    
    const mouseUpHandler = () => {
      this.isDragging = false;
      window.removeEventListener('mousemove', mouseMoveHandler);
      window.removeEventListener('mouseup', mouseUpHandler);
      
      // Re-focus the knob after mouse up to maintain keyboard control
      setTimeout(() => {
        const svg = this.shadowRoot.querySelector('svg');
        if (svg) {
          svg.focus();
        }
      }, 0);
    };
    
    window.addEventListener('mousemove', mouseMoveHandler);
    window.addEventListener('mouseup', mouseUpHandler);
    event.preventDefault();
  }

  onTouchStart(event) {
    // Focus the knob so keyboard events will work after touch interaction
    const svg = this.shadowRoot.querySelector('svg');
    if (svg) {
      svg.focus();
    }
    
    this.isDragging = true;
    const touch = event.touches[0];
    this.startY = touch.clientY;
    this.startValue = this._value;
    
    const touchMoveHandler = (e) => {
      if (this.isDragging && e.touches.length === 1) {
        const touch = e.touches[0];
        this.updateValueByVerticalMovement(touch.clientY);
        e.preventDefault();
      }
    };
    
    const touchEndHandler = () => {
      this.isDragging = false;
      window.removeEventListener('touchmove', touchMoveHandler);
      window.removeEventListener('touchend', touchEndHandler);
      
      // Re-focus the knob after touch end to maintain keyboard control
      setTimeout(() => {
        const svg = this.shadowRoot.querySelector('svg');
        if (svg) {
          svg.focus();
        }
      }, 0);
    };
    
    window.addEventListener('touchmove', touchMoveHandler, { passive: false });
    window.addEventListener('touchend', touchEndHandler);
    event.preventDefault();
  }

  onKeyDown(event) {
    switch (event.code) {
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault();
        this.updateValue(this._value + this._step, true);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault();
        this.updateValue(this._value - this._step, true);
        break;
      case 'Home':
        event.preventDefault();
        this.updateValue(this._min, true);
        break;
      case 'End':
        event.preventDefault();
        this.updateValue(this._max, true);
        break;
    }
  }

  updateValueByVerticalMovement(currentY, shiftKey = false) {
    const deltaY = this.startY - currentY; // Inverted: moving up increases value
    const range = this._max - this._min;
    const numberOfSteps = range / this._step;
    
    let sensitivity;
    if (shiftKey) {
      // Use current implementation when shift is held (more sensitive)
      sensitivity = 2;
    } else {
      // Adaptive sensitivity: 2*height should change value from min to max
      const knobHeight = this._size;
      // Base sensitivity on number of possible steps, not just range
      sensitivity = (4 * knobHeight) / numberOfSteps;
    }
    
    const stepChange = deltaY / sensitivity;
    const valueChange = stepChange * this._step;
    
    let newValue = this.startValue + valueChange;
    
    // Round to step increments
    newValue = Math.round((newValue - this._min) / this._step) * this._step + this._min;
    
    this.updateValue(newValue);
  }

  updateValue(newValue, skipFullRender = false) {
    if (newValue > this._max) newValue = this._max;
    if (newValue < this._min) newValue = this._min;
    
    const oldValue = this._value;
    this._value = newValue;
    
    // Dispatch events
    this.dispatchEvent(new CustomEvent('input', {
      detail: { value: newValue, oldValue },
      bubbles: true,
      composed: true
    }));

    this.dispatchEvent(new CustomEvent('change', {
      detail: { value: newValue, oldValue },
      bubbles: true,
      composed: true
    }));

    if (skipFullRender) {
      // Update the visual elements without full re-render
      this.updateVisualElements();
    } else {
      this.render();
    }
  }

  updateVisualElements() {
    // Update text content
    const textElement = this.shadowRoot.querySelector('.knob-text');
    if (textElement) {
      textElement.textContent = this.formatValue(this._value);
    }

    // Update aria-valuenow
    const svg = this.shadowRoot.querySelector('svg');
    if (svg) {
      svg.setAttribute('aria-valuenow', this._value);
    }

    // Recalculate and update SVG paths
    const Math_PI = 3.14159265358979;
    const radius = 40;
    const midX = 50;
    const midY = 50;
    const minRadians = (4 * Math_PI) / 3;
    const maxRadians = -Math_PI / 3;
    
    // Calculate paths (same logic as in render method)
    const valueRadians = this.mapRange(this._value, this._min, this._max, minRadians, maxRadians);
    const zeroRadians = this._min > 0 && this._max > 0 
      ? this.mapRange(this._min, this._min, this._max, minRadians, maxRadians)
      : this.mapRange(0, this._min, this._max, minRadians, maxRadians);
    
    const minX = midX + Math.cos(minRadians) * radius;
    const minY = midY - Math.sin(minRadians) * radius;
    const maxX = midX + Math.cos(maxRadians) * radius;
    const maxY = midY - Math.sin(maxRadians) * radius;
    
    const zeroX = midX + Math.cos(zeroRadians) * radius;
    const zeroY = midY - Math.sin(zeroRadians) * radius;
    const valueX = midX + Math.cos(valueRadians) * radius;
    const valueY = midY - Math.sin(valueRadians) * radius;
    
    const largeArc = Math.abs(zeroRadians - valueRadians) < Math_PI ? 0 : 1;
    const sweep = valueRadians > zeroRadians ? 0 : 1;
    
    const rangePath = `M ${minX} ${minY} A ${radius} ${radius} 0 1 1 ${maxX} ${maxY}`;
    const valuePath = `M ${zeroX} ${zeroY} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${valueX} ${valueY}`;

    // Update the path elements
    const rangePathElement = this.shadowRoot.querySelector('.knob-range');
    const valuePathElement = this.shadowRoot.querySelector('.knob-value');
    
    if (rangePathElement) {
      rangePathElement.setAttribute('d', rangePath);
    }
    if (valuePathElement) {
      valuePathElement.setAttribute('d', valuePath);
    }
  }
}

customElements.define('rotary-knob', SimpleKnob);
console.log('Rotary Knob component registered successfully');