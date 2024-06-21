window.onload = () => new Game();

const ROWS = 14;
const COLS = 14;
const MINE_COUNT = 30;
const BOMB_ICON = "💣";

const COLORS: Record<number, string> = {
  1: "blue",
  2: "green",
  3: "red",
  4: "darkblue",
  5: "darkred",
  6: "teal",
  7: "black",
  8: "grey",
};

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

    for (let idx = 0; idx < ROWS * COLS; idx++) {
      const cell = document.createElement("div");
      cell.addEventListener("click", () => this.handleClick(idx));
      this.cells.push(cell);
      container.appendChild(cell);
    }
  }

  private toCoord(idx: number): [number, number] {
    const y = Math.floor(idx / COLS);
    const x = idx - y * COLS;
    return [x, y];
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
          c.style.color = COLORS[value];
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
      .filter((c) => c[0] >= 0 && c[1] >= 0 && c[0] < COLS && c[1] < ROWS) // Remove off board.
      .map((c) => c[1] * COLS + c[0]); // Back to index format.
  }

  private updateCell(idx: number, visited: Set<number>) {
    visited.add(idx);
    const neighbours = this.getNeighbours(idx);
    const minelessNeighbours = neighbours.filter((i) => !this.mines[i]);
    const mineCount = neighbours.filter((i) => this.mines[i]).length;
    this.cellValues[idx] = mineCount;

    // If there's no mines, recurse.
    if (mineCount === 0) {
      minelessNeighbours.filter((n) => !visited.has(n)).forEach((n) => this.updateCell(n, visited));
    }
  }

  private handleClick(idx: number) {
    // Don't play once game ends.
    if (this.state === "gameover") {
      return;
    }

    // Spawn mines.
    if (!this.mines.length) {
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

    // Recursively update cell and neighbours. Track visited to prevent infinite recursion.
    this.updateCell(idx, new Set());

    // Hit a mine or found every mine?
    if (this.mines[idx] || this.cellValues.filter((v) => v === null).length === MINE_COUNT) {
      this.state = "gameover";
    }

    this.renderBoard();
  }
}
