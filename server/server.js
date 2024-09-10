import { WebSocketServer, WebSocket } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

let isGameStarting = false;
let leftTeamMembers = [];
let rightTeamMembers = [];
let records = [];
let leftScore = 0;
let rightScore = 0;
const POWER_ADD_SCORE = 50
const WIN_SCORE = 1000


wss.on('connection', function connection(ws) {
    ws.on('error', console.error);

    ws.on('message', function message(msg) {
        console.log('received: %s', msg);
        const { type, data } = JSON.parse(msg)
        switch(type) {
            case 'join-team':
                joinTeamHandler(ws, data);
                break;
            case 'member-leave':
                memberLeaveHandler(ws, data);
                break;
            case 'start-game':
                startGameHandler(ws, data);
                break;
            case 'add-power':
                addPowerHandler(ws, data);
                break;
            case 'fetch-history':
                fetchHistoryHandler(ws, data);
                break;
            
            default:
                break;
        }
    });

    //ws.send('something');
    initConnectionHandler(ws);
});

console.log('服务已启动，ws地址: ws://localhost:8080')

// 初始链接到服务
function initConnectionHandler(ws) {
    const payload = createPayload('init')
    ws.send(payload)
}
function joinTeamHandler(ws, data) {
    const { name, team } = data;
    const members = team === 'left' ? leftTeamMembers : rightTeamMembers;
    if (!members.includes(name)) {
        members.push(name)
    }
    sendToAllMembers(createPayload('join-team-completed'))
}
// 处理人员离开情况
function memberLeaveHandler(ws, data) {
    const { name, team } = data;
    if (name === '' && team === '') {
        return
    }
    const members = team === 'left' ? leftTeamMembers : rightTeamMembers;
    const idx = members.findIndex(item => item === name)
    if (idx !== -1) {
        members.splice(idx, 1)
    }
    // 如果一方没人了，另一方获胜游戏结束
    if (members.length === 0) {
        isGameStarting = false;
        sendToAllMembers(createGameOverPayload('member-leave-completed', team === 'left' ? 'right' : 'left'))
    }
    sendToAllMembers(createPayload('member-leave-completed'))
}
// 开始游戏
function startGameHandler(ws, data) {
    isGameStarting = true
    leftScore = 0;
    rightScore = 0;
    sendToAllMembers(createPayload('start-game-completed'))
}

// 为队伍加力
function addPowerHandler(ws, data) {
    const { name, team } = data;
    const members = team === 'left' ? leftScore : rightTeamMembers;
    if (team === 'left') {
        leftScore += POWER_ADD_SCORE;
    } else {
        rightScore += POWER_ADD_SCORE
    }
    if (leftScore - rightScore > WIN_SCORE) {
        sendToAllMembers(createGameOverPayload('add-power-completed', 'left'))
        return;
    }
    if (rightScore - leftScore > WIN_SCORE) {
        sendToAllMembers(createGameOverPayload('add-power-completed', 'right'))
        return;
    }

    sendToAllMembers(createPayload('add-power-completed'))
}
// 获取历史记录
function fetchHistoryHandler(ws, data) {
    const { name, team } = data;
    const datas = records.filter(item => item.team === team && item.members.includes(name))
    ws.send(JSON.stringify({
        type: 'fetch-history-completed',
        data: datas
    }))
}

// 创建消息体
function createPayload(type, team = '') {
    const payload = {
        type,
        data: {
            isGameStarting,
            leftTeamMembers,
            rightTeamMembers,
            team,
            leftScore,
            rightScore,
        }
    }
    return JSON.stringify(payload)
}

//创建结束消息体
function createGameOverPayload(type, team = '') {
    const record = {
        members: team === 'left' ? leftTeamMembers : rightTeamMembers,
        timestamp: Date.now(),
        team,
        score: team === 'left' ? leftScore : rightScore,
    }
    records.push(record)
    isGameStarting = false;
    return createPayload(type, team)
}

// 发送消息给所有人
function sendToAllMembers(payload) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    })
}