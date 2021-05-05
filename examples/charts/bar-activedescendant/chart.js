class Chart {
  constructor(chartEl, options = {}) {
    this.rootEl = chartEl;
    this.options = options;
    this.dataPoints = [...chartEl.querySelectorAll('.data-point')];

    // state
    this.activeId = 0;

    // add ids
    this.idBase = 'point-';
    this.dataPoints.forEach((el, i) => {
      el.id = `${this.idBase}${i}`;
    });
    this.updateCurrentPoint(0);

    // attach events
    chartEl.addEventListener('click', (event) => this.onDataClick(event.target));
    chartEl.addEventListener('keydown', this.onDataKeyDown.bind(this));
  }

  onDataClick(data) {
    this.updateCurrentPoint(this.dataPoints.indexOf(data));
  
    if (this.options.onClick) {
      this.options.onClick(data);
    }
  }

  onDataKeyDown(event) {
    let newIndex;

    // handle arrow keys
    switch(event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        newIndex = Math.min(this.dataPoints.length - 1, this.activeId + 1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        newIndex = Math.max(0, this.activeId - 1);
        break;
      case 'Enter':
      case ' ':
        this.onDataClick(this.dataPoints[this.activeId]);
        break;
    }

    if (typeof newIndex === 'number') {
      this.updateCurrentPoint(newIndex);
    }
  }

  updateCurrentPoint(newIndex) {
    this.rootEl.setAttribute('aria-activedescendant', `${this.idBase}${newIndex}`);

    this.dataPoints[this.activeId].classList.remove('focus');
    this.dataPoints[newIndex].classList.add('focus');

    this.activeId = newIndex;
  }
}