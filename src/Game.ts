const ROWS = 14;
const COLS = 14;
const MINE_COUNT = 40;
const BOMB_ICON = "💣";

export class Game {
  private cells: HTMLDivElement[] = [];
  private mines: boolean[] = []; // Generated on start.
  private cellValues: (number | null)[];
  private state: "gameover" | "running" = "running";

  constructor() {
    const container = document.querySelector<HTMLDivElement>("#container")!;
    container.style.gridTemplateRows = `repeat(${ROWS}, 1fr)`;
    container.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
    this.cellValues = new Array(ROWS * COLS).fill(null);

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cell = document.createElement("div");
        cell.addEventListener("click", () => this.handleClick(this.toIdx(x, y)));
        this.cells.push(cell);
        container.appendChild(cell);
      }
    }
  }

  private toIdx(x: number, y: number): number {
    return y * COLS + x;
  }

  private toCoord(idx: number): [number, number] {
    const y = Math.floor(idx / COLS);
    const x = idx - y * COLS;
    return [x, y];
  }

  private generateMines(idx: number) {
    let added = 0;
    while (added < MINE_COUNT) {
      const newMineIdx = Math.floor(Math.random() * COLS * ROWS);
      // Don't spawn a mine on the first clicked cell.
      if (newMineIdx !== idx) {
        this.mines[newMineIdx] = true;
        added++;
      }
    }
  }

  private renderBoard() {
    this.cells.forEach((c, idx) => {
      const value = this.cellValues[idx];
      const hasMine = this.mines[idx];

      if (value !== null) {
        c.classList.add("revealed");

        if (hasMine) {
          c.innerText = BOMB_ICON;
        } else if (value > 0) {
          c.innerText = value.toString();
        }
      }
    });
  }

  private getNeighbours(idx: number): number[] {
    const [x, y] = this.toCoord(idx);
    return [
      [x - 1, y],
      [x + 1, y],
      [x - 1, y + 1],
      [x, y + 1],
      [x + 1, y + 1],
      [x - 1, y - 1],
      [x, y - 1],
      [x + 1, y - 1],
    ]
      .filter((c) => c[0] >= 0 && c[1] >= 0 && c[0] < COLS && c[1] < ROWS)
      .map((c) => this.toIdx(c[0], c[1]));
  }

  private updateCell(idx: number, visited: Set<number>) {
    visited.add(idx);
    const neighbours = this.getNeighbours(idx);
    const minelessNeighbours = neighbours.filter((i) => !this.mines[i]);
    const mineCount = neighbours.filter((i) => this.mines[i]).length;

    // If there's no mines, recurse.
    if (mineCount === 0) {
      minelessNeighbours.filter((n) => !visited.has(n)).forEach((n) => this.updateCell(n, visited));
    }
    this.cellValues[idx] = mineCount;
  }

  private handleClick(idx: number) {
    // Don't play once game ends.
    if (this.state === "gameover") {
      return;
    }

    // Spawn mines.
    if (!this.mines.length) {
      this.generateMines(idx);
    }

    // Recursively update cell and neighbours. Track visited to prevent infinite recursion.
    this.updateCell(idx, new Set());

    // Hit a mine?
    if (this.mines[idx]) {
      this.state = "gameover";
    }

    this.renderBoard();
  }
}
