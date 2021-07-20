class Chart {
  constructor(chartEl, options = {}) {
    this.rootEl = chartEl;
    this.options = options;
    this.dataPoints = [...chartEl.querySelectorAll('[role=treeitem]')];

    // attach events
    this.dataPoints.forEach((el) => {
      el.addEventListener('click', (event) => this.onDataClick(event.target));
      el.addEventListener('keydown', this.onDataKeyDown.bind(this));
    });
  }

  onDataClick(data) {
    if (this.options.onClick) {
      this.options.onClick(data);
    }
  }

  onDataKeyDown(event) {
    const dataIndex = this.dataPoints.indexOf(event.target);

    // this shouldn't happen, but in the future we might handle dynamically
    // inserting/removing data points
    if (dataIndex < 0) {
      return;
    }

    let newIndex;

    // handle arrow keys
    switch(event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        newIndex = Math.min(this.dataPoints.length - 1, dataIndex + 1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        newIndex = Math.max(0, dataIndex - 1);
        break;
      case 'Enter':
      case ' ':
        this.onDataClick(event.target);
        break;
    }

    if (typeof newIndex === 'number') {
      this.updateCurrentPoint(event.target, this.dataPoints[newIndex]);
    }
  }

  updateCurrentPoint(prevEl, nextEl) {
    prevEl.tabIndex = -1;
    nextEl.tabIndex = 0;
    nextEl.focus();
  }
}