/*
@title: The Floor is Lava
@description: A fast-paced survival game where you must navigate through a room while avoiding the spreading lava. Jump between furniture, collect snacks, and manage your time wisely as you try to reach the goal. Watch out for debris and use time power-ups strategically!
@author: Knaifu0030
@tags: []
@addedOn: 2024-12-18
*/
// Define sprites
const player = "p";
const lava = "l";
const preLava = "r"; // Lava warning state
const couch = "c";
const table = "t";
const snack = "s";
const goal = "g";
const addTime = "a"; // Adds 2 seconds
const removeTime = "t"; // Removes 3 seconds
const debris = "d"; // Temporary obstacle

setLegend(
  [player, bitmap`
.3333...........
CCC206..........
CCCCC6..........
.CCCC...........
................
................
................
................
................
................
................
................
................
................
................
................`],
  [lava, bitmap`
.9999...........
999999..........
.9999...........
999999..........
................
................
................
................
................
................
................
................
................
................
................
................`],
  [preLava, bitmap`
1.1.1...........
.1.1............
1.1.1...........
.1.1............
................
................
................
................
................
................
................
................
................
................
................
................`],
  [couch, bitmap`
CCCCCC..........
CCCCCC..........
CCLLCC..........
CCLLCC..........
................
................
................
................
................
................
................
................
................
................
................
................`],
  [table, bitmap`
CCCCCC..........
CFFFFC..........
CFFFFC..........
CCCCCC..........
................
................
................
................
................
................
................
................
................
................
................
................`],
  [snack, bitmap`
    .555.
    55555
    .555.
  `],
  [goal, bitmap`
363636..........
636363..........
363636..........
636363..........
................
................
................
................
................
................
................
................
................
................
................
................`],
  [addTime, bitmap`
    .....
    .333.
    .323.
    .333.
    .....
  `],
  [removeTime, bitmap`
    .....
    .444.
    .424.
    .444.
    .....
  `],
  [debris, bitmap`
    99999
    99999
    99999
    99999
  `]
);

// Game reset function with random furniture and levels
let currentLevel = 1;
let gameWon = false;
let gameOver = false;
let goalUnlocked = false;
let furnitureTimers = {};
let timeLeft = 30;

function resetGame() {
  clearText();
  gameWon = false;
  gameOver = false;
  goalUnlocked = false;
  furnitureTimers = {};
  timeLeft = 30;

  // Remove any existing timed items
  tilesWith(addTime).forEach(([item]) => item.remove());
  tilesWith(removeTime).forEach(([item]) => item.remove());

  // Randomly place furniture
  function placeFurniture(furnitureType, count) {
    let placed = 0;
    while (placed < count) {
      const x = Math.floor(Math.random() * width());
      const y = Math.floor(Math.random() * height());
      if (getTile(x, y).length === 0) {
        addSprite(x, y, furnitureType);
        placed++;
      }
    }
  }

  // Load Level 1 or 2
  if (currentLevel === 1) {
    setMap(map`
      llllllll
      l....l.l
      l......l
      l....l.l
      llll....
    `);
    placeFurniture(couch, 2);
    placeFurniture(table, 2);
  } else if (currentLevel === 2) {
    setMap(map`
      llllllll
      l..c....
      l.t....l
      l....t.l
      l.c....l
      llllllll
    `);
    placeFurniture(couch, 3);
    placeFurniture(table, 3);
  }

  addSprite(3, 3, player);
}
// Player movement
onInput("w", () => {
  if (!gameWon && !gameOver && getFirst(player)) getFirst(player).y -= 1;
});
onInput("s", () => {
  if (!gameWon && !gameOver && getFirst(player)) getFirst(player).y += 1;
});
onInput("a", () => {
  if (!gameWon && !gameOver && getFirst(player)) getFirst(player).x -= 1;
});
onInput("d", () => {
  if (!gameWon && !gameOver && getFirst(player)) getFirst(player).x += 1;
});

// Lava spreading mechanics with warning phase
function spreadLava() {
  const maxLavaTiles = Math.floor((width() * height()) * 0.5); // Max 50% of the map can be lava
  const currentLavaTiles = tilesWith(lava).length + tilesWith(preLava).length;

  let newLavaCount = 0;
  while (newLavaCount < 3 && currentLavaTiles + newLavaCount < maxLavaTiles) {
    const x = Math.floor(Math.random() * width());
    const y = Math.floor(Math.random() * height());
    const tile = getTile(x, y);
    const hasFurnitureOrGoal = tile.some(t => t.type === couch || t.type === table);

    if (!hasFurnitureOrGoal && tile.every(t => t.type !== lava && t.type !== preLava)) {
      addSprite(x, y, preLava);
      newLavaCount++;
      setTimeout(() => {
        const preLavaTile = getTile(x, y).find(t => t.type === preLava);
        if (preLavaTile) {
          preLavaTile.remove();
          addSprite(x, y, lava);

          // Check if the player is on the lava tile
          const playerTile = getTile(x, y).find(t => t.type === player);
          if (playerTile) {
            gameOver = true;
            addText("Game Over! Press I to reset", { x: 2, y: 4 });
          }
        }
      }, 800); // Lava warning duration
    }
  }

  let removedLavaCount = 0;
  const lavaTiles = tilesWith(lava);
  while (removedLavaCount < 3 && lavaTiles.length > 0) {
    const randomLava = lavaTiles[Math.floor(Math.random() * lavaTiles.length)];
    if (randomLava) {
      randomLava[0].remove();
      removedLavaCount++;
    }
  }
}
setInterval(spreadLava, 1000); // Spread lava every second

// Prevent camping on furniture
function checkFurniture() {
  tilesWith(player, couch).forEach(([playerTile, couchTile]) => {
    const key = `${couchTile.x}-${couchTile.y}`;
    if (!furnitureTimers[key]) {
      furnitureTimers[key] = setTimeout(() => {
        couchTile.remove();
        delete furnitureTimers[key];
      }, 2000); // Sink furniture after 2 seconds
    }
  });

  tilesWith(player, table).forEach(([playerTile, tableTile]) => {
    const key = `${tableTile.x}-${tableTile.y}`;
    if (!furnitureTimers[key]) {
      furnitureTimers[key] = setTimeout(() => {
        tableTile.remove();
        delete furnitureTimers[key];
      }, 2000);
    }
  });
}
setInterval(checkFurniture, 1000);

// Goal spawning logic
function spawnGoal() {
  let placed = false;
  while (!placed) {
    const x = Math.floor(Math.random() * width());
    const y = Math.floor(Math.random() * height());
    const tile = getTile(x, y);
    if (tile.every(t => t.type !== lava && t.type !== preLava && t.type !== player && t.type !== couch && t.type !== table)) {
      addSprite(x, y, goal);
      placed = true;
    }
  }
}

// Live timer in bottom left corner
function updateTimer() {
  if (!gameWon && !gameOver) {
    clearText();
    addText(`Time: ${timeLeft}s`, { x: 0, y: 13 });

    if (timeLeft > 0) {
      timeLeft -= 1;
    } else if (!goalUnlocked) {
      goalUnlocked = true; // Unlock the goal
      spawnGoal(); // Spawn the goal at a random location
      addText("Goal spawned!", { x: 2, y: 2 });
    }
  }
}
setInterval(updateTimer, 1000);

// Random timed items
function spawnTimedItems() {
  if (Math.random() < 0.25) { // Adjusted spawn rate: favor addTime
    const x = Math.floor(Math.random() * width());
    const y = Math.floor(Math.random() * height());
    const tile = getTile(x, y);
    if (tile.every(t => t.type !== lava && t.type !== preLava)) {
      const itemType = Math.random() < 0.7 ? addTime : removeTime; // 70% chance for addTime
      addSprite(x, y, itemType);
      setTimeout(() => {
        const itemTile = getTile(x, y).find(t => t.type === itemType);
        if (itemTile) itemTile.remove();
      }, 3000); // Item disappears after 3 seconds
    }
  }
}
setInterval(spawnTimedItems, 5000);

// Falling debris
function spawnDebris() {
  const x = Math.floor(Math.random() * width());
  const y = Math.floor(Math.random() * height());
  if (getTile(x, y).every(t => t.type !== lava && t.type !== preLava)) {
    addSprite(x, y, debris);
    setTimeout(() => {
      const debrisTile = getTile(x, y).find(t => t.type === debris);
      if (debrisTile) debrisTile.remove();
    }, 3000); // Debris disappears after 3 seconds
  }
}
setInterval(spawnDebris, 7000);

// Collect snacks and detect timed items and lava collisions
afterInput(() => {
  if (gameWon || gameOver) return;

  const goalTile = tilesWith(player, goal);
  if (goalTile.length && goalUnlocked) {
    if (currentLevel === 1) {
      currentLevel = 2;
      resetGame();
      return;
    } else {
      gameWon = true;
      addText("You Win! Press I to reset", { x: 2, y: 4 });
      return;
    }
  }

  const lavaTiles = tilesWith(player, lava);
  if (lavaTiles.length) {
    gameOver = true;
    addText("Game Over! Press I to reset", { x: 2, y: 4 });
    return;
  }

  const addTimeTiles = tilesWith(player, addTime);
  addTimeTiles.forEach((tile) => {
    const item = tile.find(t => t.type === addTime);
    if (item) {
      timeLeft += 2;
      item.remove();
      addText("+2 Seconds!", { x: 2, y: 2, color: color`5` });
    }
  });

  const removeTimeTiles = tilesWith(player, removeTime);
  removeTimeTiles.forEach((tile) => {
    const item = tile.find(t => t.type === removeTime);
    if (item) {
      timeLeft = Math.max(0, timeLeft - 3);
      item.remove();
      addText("-3 Seconds!", { x: 2, y: 2, color: color`5` });
    }
  });
});

// Restart game
onInput("i", () => {
  if (gameWon || gameOver) {
    resetGame();
  }
});

// Start the game
resetGame();




