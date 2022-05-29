import { json2matrix } from './json2matrix.js';

window.addEventListener('load', () => new main());

export class main {
  constructor() {
    // console.log("main");
    const json2matrix_processor = new json2matrix('./data/svg-a11y-tests.json');
  }
}
