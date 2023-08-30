const { WebSocket, Server } = require("mock-socket");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const mockEmit = jest.fn();

jest.mock('socket.io-client', () => ({
  connect: jest.fn(() => ({
    emit: mockEmit,
    on: jest.fn(),
  })),
}));

let dom;
let container;
const mockServer = new Server("http://localhost:3001");

const {
  setUsername,
  updateScoreboard,
  playAgainstComputer,
  confirmComputerChoice,
  makeChoice,
  playAgainstPlayer,
  show,
  hide,
} = require("../public/app");

beforeAll(() => {
  global.io = require("socket.io-client");
  global.socket = global.io.connect("http://localhost:3001");
  global.alert = jest.fn();
});


beforeEach(() => {
  console.log = jest.fn();
  dom = new JSDOM(`
        <html>
            <body>
                <input id="username" value="Alice">
                <div id="greeting"></div>
                <div id="winsCount"></div>
                <div id="lossesCount"></div>
                <div id="drawsCount"></div>
            <select id="difficulty">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
            </select>
            <div id="yourChoice"></div>
            <div id="opponentChoice"></div>
            <div id="result"></div>
            </body>
        </html>
        `);
  container = dom.window.document;
  global.document = dom.window.document;
  global.window = dom.window;
});

afterAll(() => {
  mockServer.stop();
});

describe("app functions", () => {
  test("setUsername updates greeting correctly", () => {
    setUsername();
    const greeting = container.getElementById("greeting").textContent;
    expect(greeting).toBe("Hello, Alice! Ready to play?");
  });

  test("updateScoreboard updates scores correctly", () => {
    const data = { wins: 5, losses: 3, draws: 2 };
    updateScoreboard(data);

    const wins = container.getElementById("winsCount").textContent;
    const losses = container.getElementById("lossesCount").textContent;
    const draws = container.getElementById("drawsCount").textContent;

    expect(wins).toBe("5");
    expect(losses).toBe("3");
    expect(draws).toBe("2");
  });


  test("show displays element correctly", () => {
    const mockId = "testElement";
    const div = document.createElement("div");
    div.id = mockId;
    div.style.display = "none";
    container.body.appendChild(div);

    show(mockId);

    expect(container.getElementById(mockId).style.display).toBe("block");
  });

  test("hide hides element correctly", () => {
    const mockId = "testElement";
    const div = document.createElement("div");
    div.id = mockId;
    div.style.display = "block";
    container.body.appendChild(div);

    hide(mockId);

    expect(container.getElementById(mockId).style.display).toBe("none");
  });

});
