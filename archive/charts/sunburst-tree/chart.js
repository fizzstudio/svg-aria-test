// if we were using Typescript, both of these would be defined as enums
const TreeActions = {
  Close: 'close',
  First: 'first',
  Last: 'last',
  Next: 'next',
  Open: 'open',
  Previous: 'prev',
  Select: 'select',
  UpLevel: 'up'
}

const Keys = {
  Backspace: 'Backspace',
  Clear: 'Clear',
  Down: 'ArrowDown',
  End: 'End',
  Enter: 'Enter',
  Escape: 'Escape',
  Home: 'Home',
  Left: 'ArrowLeft',
  PageDown: 'PageDown',
  PageUp: 'PageUp',
  Right: 'ArrowRight',
  Space: ' ',
  Tab: 'Tab',
  Up: 'ArrowUp'
}

class Chart {
  constructor(chartEl, options = {}) {
    this.rootEl = chartEl;
    this.options = options;
    this.items = this.getProcessedTreeItems(chartEl);
    // maintain a flat list of currently "visible" items, starting with only top-level items
    this.flatItemList = this.items.map((item) => (item));
    this.activeIndex = 0;
    this.expandedItems = new WeakMap();
  }

  getFlatChildren(item) {
    if (!item.children) {
      return [];
    }

    const children = [];
    item.children.forEach((child) => {
      children.push(child);
      if (child.children && this.expandedItems.get(child)) {
        children.push([ ...this.getFlatChildren(child) ]);
      }
    });

    return children;
  }

  /* Returns an array of type:
   * {
   *  ref: HTMLElement;
   *  id: string;
   *  children: [
   *    { ref: HTMLElement; id: string; children [...etc] }
   *  ]
   * }
   * and also attaches events/etc to the nodes
   */
  getProcessedTreeItems(rootEl, level) {
    const allItems = [...rootEl.querySelectorAll('[role=treeitem]')];
    const items = [];

    const removeItem = (item) => {
      const itemIndex = allItems.indexOf(item);
      if(itemIndex > -1) {
        allItems.splice(itemIndex, 1);
      }
    }

    allItems.forEach((itemEl, index) => {
      const itemId = typeof level === 'string' ? `${level}-${index}` : `${index}`;
      const item = { ref: itemEl, id: itemId };
      console.log('adding item with id', itemId);

      // attach events
      itemEl.addEventListener('click', (event) => this.onDataClick(event.target));
      itemEl.addEventListener('keydown', (event) => this.onDataKeyDown(event, item));

      // process children
      const children = [...itemEl.querySelectorAll('[role=treeitem]')];
      if (children.length > 0) {
        // start off with all items collapsed
        itemEl.setAttribute('aria-expanded', 'false');
        // remove children from allItems
        children.forEach((childEl) => removeItem(childEl));
        // add children to item
        item.children = this.getProcessedTreeItems(itemEl, itemId);
      }
      items.push(item);
    });

    return items;
  }

  /*
  * Get the type of action based on the key pressed
  * returns an action in the TreeActions object
  */
  getTreeActionFromKey(event, treeitem, expanded, level) {
    const { key } = event;

    switch(key) {
      case Keys.Down:
        event.preventDefault();
        event.stopPropagation();
        return TreeActions.Next;
      case Keys.Up:
        event.preventDefault();
        event.stopPropagation();
        return TreeActions.Previous;
      case Keys.Right:
        event.preventDefault();
        event.stopPropagation();
        if (treeitem.children) {
          return expanded ? TreeActions.Next : TreeActions.Open;
        }
        break;
      case Keys.Left:
        event.preventDefault();
        event.stopPropagation();
        if (expanded) {
          return TreeActions.Close;
        }
        else if (level > 1) {
          return TreeActions.UpLevel;
        }
        break;
      case Keys.Home:
        event.preventDefault();
        event.stopPropagation();
        return TreeActions.First;
      case Keys.End:
        event.preventDefault();
        event.stopPropagation();
        return TreeActions.Last;
      case Keys.Enter:
      case Keys.Space:
        event.stopPropagation();
        return TreeActions.Select;
    }
  }

  // get new active item index based TreeAction
  getUpdatedIndex(action) {
    switch(action) {
      case TreeActions.First:
        return 0;
      case TreeActions.Last:
        return this.flatItemList.length - 1;
      case TreeActions.Previous:
        if (this.activeIndex > 0) {
          return this.activeIndex - 1;
        }
        break;
      case TreeActions.Next:
        if (this.activeIndex < this.flatItemList.length - 1) {
          return this.activeIndex + 1;
        }
        break;
      case TreeActions.UpLevel:
        const itemID = this.flatItemList[this.activeIndex].id;
        if (itemID.length > 1) {
          const newID = itemID.slice(0, itemID.length - 2);
          const newItem = this.flatItemList.find((item) => item.id === newID);
          return this.flatItemList.indexOf(newItem);
        }
        break;
    }
  }

  collapseChildren(item) {
    // update expanded state
    this.expandedItems.set(item, false);
    item.ref.setAttribute('aria-expanded', 'false');

    // update flat item list
    const children = this.getFlatChildren(item);
    const startIndex = this.flatItemList.indexOf(item);
    this.flatItemList.splice(startIndex + 1, children.length);
    console.log(this.flatItemList);
  }

  expandChildren(item) {
    // update expanded state
    this.expandedItems.set(item, true);
    item.ref.setAttribute('aria-expanded', 'true');

    // update flat item list
    const children = this.getFlatChildren(item);
    const startIndex = this.flatItemList.indexOf(item);
    this.flatItemList.splice(startIndex + 1, 0, ...children);
    console.log(this.flatItemList);
  }

  onDataClick(data) {
    if (this.options.onClick) {
      this.options.onClick(data);
    }
  }

  onDataKeyDown(event, item) {
    const isExpanded = this.expandedItems.get(item);
    const level = item.id.split('-').length;
    const action = this.getTreeActionFromKey(event, item, isExpanded, level);

    switch (action) {
      case TreeActions.First:
      case TreeActions.Last:
      case TreeActions.Next:
      case TreeActions.Previous:
      case TreeActions.UpLevel:
        const newIndex = this.getUpdatedIndex(action);
        console.log('new index is', newIndex);
        if (typeof newIndex === 'number') {
          this.updateCurrentPoint(newIndex);
        }
        break;
      case TreeActions.Close:
        this.collapseChildren(item);
        break;
      case TreeActions.Open:
        this.expandChildren(item);
        break;
      case TreeActions.Select:
        item.onClick && item.onClick(item);
        break;
    }
  }

  updateCurrentPoint(newIndex) {
    this.flatItemList[this.activeIndex].ref.tabIndex = -1;
    this.flatItemList[newIndex].ref.tabIndex = 0;
    this.flatItemList[newIndex].ref.focus();
    this.activeIndex = newIndex;
  }
}