const { server, io } = require('../server.js'); // adjust the path
const socketIoClient = require('socket.io-client');
const http = require('http');
const PORT = 3001; 
const choices = ["rock", "paper", "scissors", "lizard", "spock"];

describe('Socket.io Server', () => {
    let clientSocket;
    let clientSocket2;

    beforeAll((done) => {
        clientSocket = socketIoClient.connect(`http://localhost:${PORT}`, {
            'reconnection delay': 0,
            'reopen delay': 0,
            'force new connection': true,
            transports: ['websocket']
        });

        clientSocket.on('connect', done);
        clientSocket.on('connect_error', (error) => {
            console.error("Connect Error: ", error);
        });
    });

    afterAll(() => {
        if (clientSocket.connected) {
            clientSocket.disconnect();
        }
        if (clientSocket2 && clientSocket2.connected) {
            clientSocket2.disconnect();
        }
        if (io) {
            io.close();
        }
    });

    test('should set username correctly', (done) => {
        const testUsername = 'testUser';

        clientSocket.emit('setUsername', { username: testUsername });

        clientSocket.once('greeting', (message) => {
            expect(message).toBe(`Hello, ${testUsername}!`);
            done();
        });
    });

    test('should play against computer correctly', (done) => {
        const testChoice = 'rock'; 
    
        clientSocket.emit('playAgainstComputer', { difficulty: 'easy', choice: testChoice });
    
        clientSocket.once('gameResult', (data) => {
            expect(['win', 'loss', 'draw']).toContain(data.result);
            expect(choices).toContain(data.opponentChoice);  
            done();
        });
    });
    
    test('should match players and determine winner in PvP', (done) => {
        clientSocket2 = socketIoClient.connect(`http://localhost:${PORT}`, {
            'reconnection delay': 0,
            'reopen delay': 0,
            'force new connection': true,
            transports: ['websocket']
        });

        clientSocket2.on('connect_error', (error) => {
            console.error("ClientSocket2 Connect Error: ", error);
        });
        
        clientSocket.emit('playAgainstPlayer');
        clientSocket2.emit('playAgainstPlayer');
    
        clientSocket.once('matchFound', (data) => {
            expect(data.opponentName).toBeTruthy();
            clientSocket.emit('playerChoice', { choice: 'rock' });
        });
    
        clientSocket2.once('matchFound', (data) => {
            expect(data.opponentName).toBeTruthy();
            clientSocket2.emit('playerChoice', { choice: 'scissors' }); 
        });
    
        clientSocket2.once('gameResult', (data) => {
            expect(data.result).toBe('loss');
            expect(data.opponentChoice).toBe('rock');
            done();
        });
    }, 10000); 
    
});
