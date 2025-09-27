// Simple knob component without external dependencies for testing
class SimpleKnob extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

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
    return ["value", "min", "max", "step", "size"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case "value":
        this._value = parseFloat(newValue) || 0;
        break;
      case "min":
        this._min = parseFloat(newValue) || 0;
        break;
      case "max":
        this._max = parseFloat(newValue) || 100;
        break;
      case "step":
        this._step = parseFloat(newValue) || 1;
        break;
      case "size":
        this._size = parseInt(newValue) || 100;
        break;
    }
    this.render();
  }

  get value() {
    return this._value;
  }
  set value(val) {
    const numVal = parseFloat(val) || 0;
    if (this._value !== numVal) {
      this._value = numVal;
      this.render();
    }
  }

  get min() {
    return this._min;
  }
  set min(val) {
    this._min = parseFloat(val) || 0;
    this.render();
  }

  get max() {
    return this._max;
  }
  set max(val) {
    this._max = parseFloat(val) || 100;
    this.render();
  }

  get step() {
    return this._step;
  }
  set step(val) {
    this._step = parseFloat(val) || 1;
  }

  get size() {
    return this._size;
  }
  set size(val) {
    this._size = parseInt(val) || 100;
    this.render();
  }

  getGeometry() {
    const radius = 40;
    const midX = 50;
    const midY = 50;
    const minRadians = (4 * Math.PI) / 3;
    const maxRadians = -Math.PI / 3;
    const strokeWidth = 14;

    // Calculate paths
    const valueRadians = this.mapRange(
      this._value,
      this._min,
      this._max,
      minRadians,
      maxRadians
    );
    const zeroRadians =
      this._min > 0 && this._max > 0
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

    const largeArc = Math.abs(zeroRadians - valueRadians) < Math.PI ? 0 : 1;
    const sweep = valueRadians > zeroRadians ? 0 : 1;

    const rangePath = `M ${minX} ${minY} A ${radius} ${radius} 0 1 1 ${maxX} ${maxY}`;
    const valuePath = `M ${zeroX} ${zeroY} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${valueX} ${valueY}`;

    return { strokeWidth, rangePath, valuePath };
  }

  render() {
    const hadFocus =
      this.shadowRoot &&
      this.shadowRoot.activeElement === this.shadowRoot.querySelector("svg");
    const hostHadFocus = document.activeElement === this;

    const { strokeWidth, rangePath, valuePath } = this.getGeometry();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          cursor: pointer;
          margin: 2px;
          -webkit-tap-highlight-color: transparent;
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
          touch-action: none;

          &:focus {
            outline: .1em solid var(--primary-color);
            outline-offset: .1em;
          }
        }
        
        .knob-range {
          fill: none;
          stroke: color-mix(
            in srgb,
            var(--text-dark) 8%,
            transparent
          );
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
          fill: var(--text-muted-dark, #ffffffcc);
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
    // Restore focus if it was focused before
    if (hadFocus) {
      const svg = this.shadowRoot.querySelector("svg");
      svg && svg.focus({ preventScroll: true });
    } else if (hostHadFocus) {
      this.focus({ preventScroll: true });
    }
  }

  mapRange(x, inMin, inMax, outMin, outMax) {
    return ((x - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }

  formatValue(value) {
    // Format number to maximum 2 decimal places, removing trailing zeros
    return parseFloat(value.toFixed(2)).toString();
  }

  bindEvents() {
    this.addEventListener("click", this.onClick.bind(this));
    // Remove legacy separate mouse/touch handlers; unified pointer events used instead
    this.addEventListener("pointerdown", this.onPointerDown.bind(this));
    this.addEventListener("keydown", this.onKeyDown.bind(this));
  }

  onPointerDown(event) {
    if (event.button !== 0 && event.pointerType === "mouse") return; // only left click for mouse

    const svg = this.shadowRoot.querySelector("svg");
    // if (svg) svg.focus(); else this.focus();

    this.isDragging = true;
    this.dragMoved = false; // reset drag movement flag
    this.startY = event.clientY;
    this.startX = event.clientX;
    this.startValue = this._value;

    const onPointerMove = (e) => {
      if (!this.isDragging) return;
      const moveDelta =
        Math.abs(e.clientY - this.startY) + Math.abs(e.clientX - this.startX);
      if (moveDelta > 2) this.dragMoved = true; // minimal threshold to classify as drag
      this.updateValueByVerticalMovement(e.clientY, e.shiftKey);
      e.preventDefault?.();
    };

    const onPointerUp = (e) => {
      this.isDragging = false;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp, { passive: false });

    event.preventDefault?.();
  }

  onClick(event) {
    if (this.dragMoved) {
      return;
    } // safeguard: ignore if classified as drag

    // Focus the knob first so keyboard events will work
    const svg = this.shadowRoot.querySelector("svg");
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

  onKeyDown(event) {
    switch (event.code) {
      case "ArrowRight":
      case "ArrowUp":
        event.preventDefault();
        this.updateValue(this._value + this._step, true);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        event.preventDefault();
        this.updateValue(this._value - this._step, true);
        break;
      case "Home":
        event.preventDefault();
        this.updateValue(this._min, true);
        break;
      case "End":
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
      sensitivity = 2; // more sensitive when holding shift
    } else {
      const knobHeight = this._size;
      sensitivity = (4 * knobHeight) / numberOfSteps;
    }

    const stepChange = deltaY / sensitivity;
    const valueChange = stepChange * this._step;

    let newValue = this.startValue + valueChange;
    newValue =
      Math.round((newValue - this._min) / this._step) * this._step + this._min;

    // Skip full render during drag for performance
    this.updateValue(newValue, true);
  }

  updateValue(newValue, skipFullRender = false) {
    if (newValue > this._max) newValue = this._max;
    if (newValue < this._min) newValue = this._min;

    const oldValue = this._value;
    this._value = newValue;

    const svgBefore = this.shadowRoot && this.shadowRoot.querySelector("svg");
    const svgHadFocus =
      svgBefore && this.shadowRoot.activeElement === svgBefore;
    const hostHadFocus = document.activeElement === this;

    // Dispatch events
    this.dispatchEvent(
      new CustomEvent("input", {
        detail: { value: newValue, oldValue },
        bubbles: true,
        composed: true,
      })
    );

    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { value: newValue, oldValue },
        bubbles: true,
        composed: true,
      })
    );

    if (skipFullRender) {
      this.updateVisualElements();
    } else {
      this.render();
      // If we re-rendered we already restore focus inside render(); skip double
    }
    if (skipFullRender) {
      // ensure focus not lost during incremental updates
      if (svgHadFocus) {
        const svgNow = this.shadowRoot.querySelector("svg");
        svgNow && svgNow.focus({ preventScroll: true });
      } else if (hostHadFocus) {
        this.focus({ preventScroll: true });
      }
    }
  }

  updateVisualElements() {
    const textElement = this.shadowRoot.querySelector(".knob-text");
    if (textElement) {
      textElement.textContent = this.formatValue(this._value);
    }

    const svg = this.shadowRoot.querySelector("svg");
    if (svg) {
      svg.setAttribute("aria-valuenow", this._value);
    }

    const { rangePath, valuePath } = this.getGeometry();

    const rangePathElement = this.shadowRoot.querySelector(".knob-range");
    const valuePathElement = this.shadowRoot.querySelector(".knob-value");

    if (rangePathElement) rangePathElement.setAttribute("d", rangePath);
    if (valuePathElement) valuePathElement.setAttribute("d", valuePath);
  }
}

customElements.define("rotary-knob", SimpleKnob);
console.log("Rotary Knob component registered successfully");
