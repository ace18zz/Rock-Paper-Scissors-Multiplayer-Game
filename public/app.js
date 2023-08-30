const io = require('socket.io-client');

let socket = io.connect("http://localhost:3001");
let username;


function setUsername() {
    console.log("Setting username...");
    username = document.getElementById("username").value;
    socket.emit("setUsername", { username });
    document.getElementById("greeting").textContent = `Hello, ${username}! Ready to play?`;
    show("greeting");
}

function updateScoreboard(data) {
  console.log('Received scoreboard data:', data); 
  document.getElementById("winsCount").textContent = data.wins;
  document.getElementById("lossesCount").textContent = data.losses;
  document.getElementById("drawsCount").textContent = data.draws;
}


function playAgainstComputer() {
  show("computerOptions");
  show("choices");
}

function confirmComputerChoice() {
  const difficulty = document.getElementById("difficulty").value;
  const choice = document.getElementById("yourChoice").textContent;
  console.log(
    "Emitting playAgainstComputer event with difficulty:",
    difficulty,
    "and choice:",
    choice
  );
  socket.emit("playAgainstComputer", { difficulty, choice });
  show("results");
}

function makeChoice(choice) {
  document.getElementById("yourChoice").textContent = choice;
  confirmComputerChoice();
}

function playAgainstPlayer() {
  socket.emit("playAgainstPlayer");
  show("results");
}

function show(elementId) {
  document.getElementById(elementId).style.display = "block";
}

function hide(elementId) {
  document.getElementById(elementId).style.display = "none";
}


socket.on('updateScoreboard', updateScoreboard);


socket.on("matchFound", (data) => {
  alert(`You're matched against ${data.opponentName}! Make your choice.`);
});

socket.on("waitingForOpponent", () => {
  alert("Waiting for an opponent...");
});

socket.on("gameResult", (data) => {
  document.getElementById("opponentChoice").textContent = data.opponentChoice;
  document.getElementById("result").textContent = data.result;
});

socket.on("opponentLeft", () => {
  alert("Your opponent left the game.");
});

module.exports = {
  setUsername,
  updateScoreboard,
  playAgainstComputer,
  confirmComputerChoice,
  makeChoice,
  playAgainstPlayer,
  show,
  hide
};