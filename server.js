const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const users = {};
const waitingPlayers = [];
const choices = ["rock", "paper", "scissors", "lizard", "spock"];

let lastUserChoice = null;

const getComputerChoice = (difficulty = "easy", userChoice) => {
    switch (difficulty) {
        case "easy":
            return choices[Math.floor(Math.random() * choices.length)];
        case "medium":
            lastUserChoice = userChoice || lastUserChoice;
            const index = choices.indexOf(lastUserChoice);
            return choices[(index + 1) % choices.length];
        case "hard":
            return choices[Math.floor(Math.random() * choices.length)]; 
        default:
            return choices[Math.floor(Math.random() * choices.length)];
    }
};

const determineWinner = (choice1, choice2) => {
    if (choice1 === choice2) return "draw";
    if ((choice1 === "rock" && (choice2 === "scissors" || choice2 === "lizard")) ||
        (choice1 === "paper" && (choice2 === "rock" || choice2 === "spock")) ||
        (choice1 === "scissors" && (choice2 === "paper" || choice2 === "lizard")) ||
        (choice1 === "lizard" && (choice2 === "spock" || choice2 === "paper")) ||
        (choice1 === "spock" && (choice2 === "scissors" || choice2 === "rock"))) {
        return "player1";
    } else {
        return "player2";
    }
};

const matchPlayers = (player1Socket, player2Socket) => {
    player1Socket.opponent = player2Socket.id;
    player2Socket.opponent = player1Socket.id;
    player1Socket.emit('matchFound', { opponentName: users[player2Socket.id].username });
    player2Socket.emit('matchFound', { opponentName: users[player1Socket.id].username });
};

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A user connected');
    users[socket.id] = {
        username: socket.id,
        wins: 0,
        losses: 0,
        draws: 0
    };

    socket.on('setUsername', (data) => {
        users[socket.id].username = data.username;
        socket.emit('greeting', `Hello, ${data.username}!`);
        socket.emit('updateScoreboard', users[socket.id]);
    });
    
    socket.on("greeting", (message) => {
        alert(message);  
    });
    

    socket.on('playAgainstPlayer', () => {
        if (waitingPlayers.length > 0) {
            const opponentSocket = waitingPlayers.pop();
            matchPlayers(socket, opponentSocket);
        } else {
            waitingPlayers.push(socket);
            socket.emit('waitingForOpponent');
        }
    });

    socket.on('playAgainstComputer', (data) => {
        const computerChoice = getComputerChoice(data.difficulty, data.choice); // Use data.choice instead of socket.choice
        const result = determineWinner(data.choice, computerChoice);
        if (result === "player1") {
            users[socket.id].wins++;
            socket.emit('gameResult', { result: "win", opponentChoice: computerChoice });
            socket.emit('updateScoreboard', users[socket.id]);
        } else if (result === "player2") {
            users[socket.id].losses++;
            socket.emit('gameResult', { result: "loss", opponentChoice: computerChoice });
            socket.emit('updateScoreboard', users[socket.id]);
        } else {
            users[socket.id].draws++;
            socket.emit('gameResult', { result: "draw", opponentChoice: computerChoice });
            socket.emit('updateScoreboard', users[socket.id]);
        }
        // console.log("User choice:", data.choice);
        // console.log("Computer choice:", computerChoice);
        // console.log("Determined result:", result);
    });
        
    socket.on('playerChoice', (data) => {
        if (socket.opponent) {
            const opponentSocket = io.sockets.connected[socket.opponent];
            if (opponentSocket && opponentSocket.choice) {
                const result = determineWinner(data.choice, opponentSocket.choice);
                if (result === "player1") {
                    users[socket.id].wins++;
                    users[opponentSocket.id].losses++;
                    socket.emit('gameResult', { result: "win", opponentChoice: opponentSocket.choice });
                    opponentSocket.emit('gameResult', { result: "loss", opponentChoice: data.choice });
                    socket.emit('updateScoreboard', users[socket.id]);
                } else if (result === "player2") {
                    users[socket.id].losses++;
                    users[opponentSocket.id].wins++;
                    socket.emit('gameResult', { result: "loss", opponentChoice: opponentSocket.choice });
                    opponentSocket.emit('gameResult', { result: "win", opponentChoice: data.choice });
                    socket.emit('updateScoreboard', users[socket.id]);
                } else {
                    users[socket.id].draws++;
                    users[opponentSocket.id].draws++;
                    socket.emit('gameResult', { result: "draw", opponentChoice: opponentSocket.choice });
                    opponentSocket.emit('gameResult', { result: "draw", opponentChoice: data.choice });
                    socket.emit('updateScoreboard', users[socket.id]);

                }

                delete opponentSocket.choice;
                delete socket.choice;
                delete opponentSocket.opponent;
                delete socket.opponent;
            } else {
                socket.choice = data.choice;
            }
        }
    });

    socket.on('disconnect', () => {
        const index = waitingPlayers.indexOf(socket);
        if (index !== -1) {
            waitingPlayers.splice(index, 1);
        }
        if (socket.opponent) {
            const opponentSocket = io.sockets.connected[socket.opponent];
            opponentSocket.emit('opponentLeft');
            delete opponentSocket.opponent;
        }
        console.log(`User ${users[socket.id]?.username || socket.id} disconnected`);
        delete users[socket.id];
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = { server, io };
