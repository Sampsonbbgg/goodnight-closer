const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname)));

// ============================================================
//  GAME DATA
// ============================================================

const WHEEL_OPTIONS = [
  { id:1, text:'今晚由 Sampson 负责收尾', closer:'sampson' },
  { id:2, text:'今晚由 Sharyn 负责收尾', closer:'sharyn' },
  { id:3, text:'再聊 3 分钟后由 Sampson 收尾', closer:'sampson', extraMinutes:3 },
  { id:4, text:'再聊 5 分钟后由 Sharyn 收尾', closer:'sharyn', extraMinutes:5 },
  { id:5, text:'互说一句晚安暗号后由 Sampson 收尾', closer:'sampson', extraTask:'互说一句晚安暗号' },
  { id:6, text:'说一句今天最舍不得的话后由 Sharyn 收尾', closer:'sharyn', extraTask:'说一句今天最舍不得的话' },
];

const CARD_OPTIONS = [
  { id:1, title:'Sampson 收尾牌', desc:'说一句最想对 Sharyn 说的话，然后由 Sampson 收尾', closer:'sampson', type:'closer', extraTask:'说一句最想对 Sharyn 说的话' },
  { id:2, title:'Sharyn 收尾牌', desc:'给 Sampson 留一句明天最想听的话，然后由 Sharyn 收尾', closer:'sharyn', type:'closer', extraTask:'留一句明天最想听的话' },
  { id:3, title:'甜蜜加时牌', desc:'再聊 2 分钟后由系统温柔指定', closer:'system', type:'bonus', extraMinutes:2 },
  { id:4, title:'倒数牌', desc:'互相说晚安后，一起倒数 5 秒', closer:'system', type:'countdown', extraTask:'互相说晚安后倒数 5 秒' },
  { id:5, title:'撒娇豁免牌', desc:'这一次不算，允许重新来一次', closer:'system', type:'exempt' },
];

const QUIZ_QUESTIONS = [
  { id:1, text:'今天谁更舍不得先说晚安？', options:['Sampson','Sharyn'], type:'person' },
  { id:2, text:'对方现在更想听到哪句话？', options:['早点睡','再陪我一下','我想你','明天见'], type:'feeling' },
  { id:3, text:'如果再聊 3 分钟，谁会先困？', options:['Sampson','Sharyn'], type:'person' },
  { id:4, text:'今天这通电话更像？', options:['安慰局','想念局','撒娇局','日常局'], type:'feeling' },
  { id:5, text:'你觉得对方现在心情更像？', options:['月亮','云朵','星星','晚风'], type:'feeling' },
  { id:6, text:'今天最想念对方的时刻是？', options:['早上醒来','午饭时','下午犯困','睡前此刻'], type:'feeling' },
  { id:7, text:'今晚最不想挂电话的原因是？', options:['太想听你声音','今天没说够','怕梦不到你','就是不想挂'], type:'feeling' },
  { id:8, text:'如果这通电话是一首歌，更像？', options:['温柔情歌','轻快小调','安静钢琴曲','甜蜜哼唱'], type:'feeling' },
  { id:9, text:'对方现在最适合的晚安方式是？', options:['一个飞吻','一句情话','一个拥抱','安静倒数'], type:'feeling' },
  { id:10, text:'对方此刻最想做的事是？', options:['继续聊天','安静听你呼吸','被你哄睡','互道晚安'], type:'feeling' },
  { id:11, text:'谁今天更需要一句"辛苦了"？', options:['Sampson','Sharyn'], type:'person' },
  { id:12, text:'对方现在嘴角是上扬的还是嘟着的？', options:['上扬的','嘟着的','假装严肃','困得眯着'], type:'feeling' },
];

const DICE_PERSON = ['Sampson','Sharyn','加时2分钟','Sampson','Sharyn','重投一次'];
const DICE_ACTION = ['立即收尾','说晚安暗号后收尾','飞吻后收尾','倒数5秒后收尾','交换一句最想说的话后收尾','给对方一个晚安称呼后收尾'];

const STORY_CARDS = [
  { id:1, title:'月光留声', desc:'互相说一句今晚最想留下的话', closer:'sampson', task:'互相说一句今晚最想留下的话' },
  { id:2, title:'晚风偏爱', desc:'再聊 3 分钟后，守住最后一句晚安', closer:'sharyn', task:null, extraMinutes:3 },
  { id:3, title:'星点延迟', desc:'双方都说出明天最期待的瞬间', closer:'system', task:'说出明天最期待的瞬间' },
  { id:4, title:'不许太快结束', desc:'自动延时 2 分钟后重新决定', closer:'delay', task:null, extraMinutes:2 },
  { id:5, title:'今天你更重要', desc:'本轮由另一方免挂，你负责守住最后的温柔', closer:'swap', task:null },
  { id:6, title:'梦的入口', desc:'各说一句"希望今晚梦到什么"', closer:'sampson', task:'各说一句希望今晚梦到什么' },
  { id:7, title:'最后的温度', desc:'用三个词形容此刻对对方的感觉', closer:'sharyn', task:'用三个词形容此刻对对方的感觉' },
  { id:8, title:'夜的收藏', desc:'互相说一个今天最值得收藏的瞬间', closer:'system', task:'说一个今天最值得收藏的瞬间' },
  { id:9, title:'偷来的两分钟', desc:'假装时间多了两分钟', closer:'sampson', task:null, extraMinutes:2 },
  { id:10, title:'星河入眠', desc:'一起安静 10 秒，然后温柔收尾', closer:'sharyn', task:'一起安静 10 秒' },
];

const TASK_POOL = [
  { id:1, text:'互相说一句今天最想念对方的瞬间' },
  { id:2, text:'用三个词形容今天的对方' },
  { id:3, text:'说一句"明天醒来最希望收到的话"' },
  { id:4, text:'互相给对方一个晚安称呼' },
  { id:5, text:'用一句很短的话哄对方睡觉' },
  { id:6, text:'模仿一下对方平时最可爱的语气' },
  { id:7, text:'各说一个下次见面最想做的事' },
  { id:8, text:'说一句平时不好意思说的话' },
  { id:9, text:'互相猜对方此刻在想什么' },
  { id:10, text:'给对方一个只有你们知道的暗号' },
  { id:11, text:'说出对方最让你心动的一个小习惯' },
  { id:12, text:'用一个表情形容此刻的心情' },
];

const BLINDBOX_ITEMS = [
  { id:1, type:'result', title:'今晚的答案', desc:'命运直接揭晓', closer:'sampson' },
  { id:2, type:'result', title:'月光指引', desc:'月光落在了你的名字上', closer:'sharyn' },
  { id:3, type:'task', title:'甜蜜任务', desc:'完成任务后揭晓结果', task:'互相说一句"我喜欢你的___"' },
  { id:4, type:'bonus', title:'甜蜜加时', desc:'再聊 2 分钟后重新开盒', extraMinutes:2 },
  { id:5, type:'reverse', title:'命运反转', desc:'触发反转保护！由原本结果的另一方收尾' },
  { id:6, type:'exempt', title:'豁免水晶', desc:'获得一次重新开盒的机会' },
  { id:7, type:'result', title:'星光裁决', desc:'星光选中了你', closer:'sampson' },
  { id:8, type:'result', title:'晚风传信', desc:'晚风把晚安交给了你', closer:'sharyn' },
  { id:9, type:'task', title:'秘密昵称', desc:'互说一个秘密昵称后揭晓', task:'互相说一个只有这个夜晚知道的昵称' },
  { id:10, type:'special', title:'偏爱时刻', desc:'今晚不讲公平，讲偏爱' },
];

const ACHIEVEMENTS = [
  { id:'first_sync', name:'默契初现', desc:'第一次默契测试答案一致', icon:'💫' },
  { id:'favor', name:'今晚偏爱你', desc:'首次触发偏爱时刻', icon:'💝' },
  { id:'collector_7', name:'夜晚收藏家', desc:'累计使用 7 次', icon:'🌙' },
  { id:'overtime_3', name:'不舍得专家', desc:'连续 3 次触发加时', icon:'⏰' },
  { id:'guardian_10', name:'月光守护员', desc:'累计担任收尾官 10 次', icon:'🛡️' },
  { id:'blindbox_5', name:'盲盒达人', desc:'累计开启 5 次盲盒', icon:'🎁' },
  { id:'perfect_sync', name:'完美同步', desc:'倒数同步差距小于 0.5 秒', icon:'✨' },
  { id:'all_modes', name:'全能探索家', desc:'尝试过所有玩法模式', icon:'🗺️' },
];

// ============================================================
//  ROOM MANAGEMENT
// ============================================================

const rooms = new Map();

function rid() { return Math.floor(100000+Math.random()*900000).toString(); }
function uid() { return Date.now().toString(36)+Math.random().toString(36).substr(2,5); }
function pick(arr) { return arr[Math.floor(Math.random()*arr.length)]; }

function createRoom() {
  let id = rid(); while(rooms.has(id)) id = rid();
  const room = {
    id,
    phase: 'waiting',
    players: { sampson:null, sharyn:null },
    selectedMode: null,
    modeSelectedBy: null,
    result: null,
    history: [],
    createdAt: Date.now(),
    // Interactive mode state
    currentQuestion: null,
    answers: { sampson:null, sharyn:null },
    revealedAnswers: null,
    // Countdown mode state
    countdownTarget: null,
    countdownPresses: { sampson:null, sharyn:null },
    // Stats & systems
    stats: { totalGames:0, modesUsed:[] },
    achievements: [],
    exemptions: { sampson:1, sharyn:1 },
  };
  rooms.set(id, room);
  return room;
}

function getRoom(id) { return rooms.get(id); }

function joinRoom(roomId, role, socketId) {
  const room = rooms.get(roomId);
  if(!room) return { success:false, error:'房间不存在或已过期' };
  const ex = room.players[role];
  if(ex && ex.connected && ex.socketId !== socketId)
    return { success:false, error:`${role==='sampson'?'Sampson':'Sharyn'} 已在房间中` };
  room.players[role] = {
    role, socketId, connected:true,
    ready: ex?.ready ?? false,
    answered: false,
    joinedAt: ex?.joinedAt ?? Date.now(),
  };
  if(room.players.sampson?.connected && room.players.sharyn?.connected && room.phase==='waiting')
    room.phase = 'both_joined';
  return { success:true, room };
}

function leaveRoom(socketId) {
  for(const [roomId, room] of rooms.entries()) {
    for(const role of ['sampson','sharyn']) {
      const p = room.players[role];
      if(p && p.socketId === socketId) {
        p.connected = false; p.ready = false;
        const other = role==='sampson'?'sharyn':'sampson';
        if(!room.players[other]?.connected)
          setTimeout(()=>{ const r=rooms.get(roomId); if(r&&!r.players.sampson?.connected&&!r.players.sharyn?.connected) rooms.delete(roomId); }, 30*60*1000);
        if(['mode_selecting','both_ready','answering'].includes(room.phase)) {
          room.phase = 'both_joined';
          if(room.players.sampson) room.players.sampson.ready = false;
          if(room.players.sharyn) room.players.sharyn.ready = false;
        }
        return { roomId, role };
      }
    }
  }
  return null;
}

function selectMode(roomId, mode, role) {
  const room = rooms.get(roomId);
  if(!room) return false;
  if(!['both_joined','mode_selecting','both_ready'].includes(room.phase)) return false;
  room.selectedMode = mode;
  room.modeSelectedBy = role;
  room.phase = 'mode_selecting';
  if(room.players.sampson) room.players.sampson.ready = false;
  if(room.players.sharyn) room.players.sharyn.ready = false;
  return true;
}

function toggleReady(roomId, socketId) {
  const room = rooms.get(roomId);
  if(!room || !['mode_selecting','both_ready'].includes(room.phase) || !room.selectedMode) return null;
  for(const role of ['sampson','sharyn']) {
    const p = room.players[role];
    if(p && p.socketId === socketId) {
      p.ready = !p.ready;
      const both = room.players.sampson?.ready && room.players.sharyn?.ready;
      room.phase = both ? 'both_ready' : 'mode_selecting';
      return { role, ready:p.ready };
    }
  }
  return null;
}

function findBySocket(socketId) {
  for(const room of rooms.values())
    for(const role of ['sampson','sharyn'])
      if(room.players[role]?.socketId === socketId) return { room, role };
  return null;
}

function toClient(room) {
  return {
    id: room.id,
    phase: room.phase,
    players: {
      sampson: room.players.sampson ? { connected:room.players.sampson.connected, ready:room.players.sampson.ready, answered:room.players.sampson.answered||false } : null,
      sharyn: room.players.sharyn ? { connected:room.players.sharyn.connected, ready:room.players.sharyn.ready, answered:room.players.sharyn.answered||false } : null,
    },
    selectedMode: room.selectedMode,
    modeSelectedBy: room.modeSelectedBy,
    currentQuestion: room.currentQuestion,
    revealedAnswers: room.revealedAnswers,
    result: room.result,
    history: room.history.slice(-30),
    stats: room.stats,
    achievements: room.achievements,
    exemptions: room.exemptions,
  };
}

// ============================================================
//  ANTI-STREAK & EASTER EGG
// ============================================================

function antiStreak(room, proposed) {
  const recent = room.history.slice(-2);
  if(recent.length < 2) return { triggered:false, closer:proposed };
  if(recent.every(h=>h.result.closer===proposed))
    return { triggered:true, closer: proposed==='sampson'?'sharyn':'sampson' };
  return { triggered:false, closer:proposed };
}

function checkEasterEgg(room) {
  const total = room.stats.totalGames + 1;
  const d = new Date();
  const md = `${d.getMonth()+1}-${d.getDate()}`;
  if(total === 1) return { type:'first', text:'这是你们的第一次晚安仪式，格外珍贵' };
  if(total === 7) return { type:'milestone', text:'第 7 次晚安——一周的想念，被温柔记住' };
  if(total === 30) return { type:'milestone', text:'第 30 次晚安——一整月的陪伴，值得庆祝' };
  if(total % 50 === 0) return { type:'milestone', text:`第 ${total} 次晚安——每一次都是礼物` };
  if(md === '2-14') return { type:'valentine', text:'情人节快乐，今晚不讲公平，只讲偏爱' };
  if(md === '12-24') return { type:'christmas', text:'平安夜的晚安，格外温暖' };
  if(md === '1-1') return { type:'newyear', text:'新年的第一句晚安，献给最重要的人' };
  return null;
}

// ============================================================
//  GAME MODE LOGIC
// ============================================================

function playWheel(room) {
  const idx = Math.floor(Math.random()*WHEEL_OPTIONS.length);
  const opt = WHEEL_OPTIONS[idx];
  let closer = opt.closer === 'either' ? pick(['sampson','sharyn']) : opt.closer;
  const as = antiStreak(room, closer);
  if(as.triggered) closer = as.closer;
  return { mode:'wheel', closer, title:'命运转盘已揭晓', desc:opt.text, extraTask:opt.extraTask, extraMinutes:opt.extraMinutes, wheelIndex:idx, antiStreak:as.triggered, ts:Date.now() };
}

function playCard(room) {
  const card = pick(CARD_OPTIONS);
  if(card.type==='exempt') return { mode:'card', closer:'sampson', title:card.title, desc:card.desc, cardId:card.id, isExempt:true, ts:Date.now() };
  let closer = card.closer==='system' ? pick(['sampson','sharyn']) : card.closer;
  const as = antiStreak(room, closer);
  if(as.triggered) closer = as.closer;
  return { mode:'card', closer, title:card.title, desc:card.desc, extraTask:card.extraTask, extraMinutes:card.extraMinutes, cardId:card.id, antiStreak:as.triggered, ts:Date.now() };
}

function playFair(room) {
  const h = room.history;
  const sc = h.filter(e=>e.result.closer==='sampson').length;
  const yc = h.filter(e=>e.result.closer==='sharyn').length;
  let closer, reason;
  const rec = h.slice(-2).map(e=>e.result.closer);
  const streak = rec.length>=2 && rec.every(c=>c===rec[0]);
  if(streak && rec[0]) {
    closer = rec[0]==='sampson'?'sharyn':'sampson';
    reason = `${rec[0]==='sampson'?'Sampson':'Sharyn'} 已连续担任，这次换一换`;
  } else if(sc===yc) {
    closer = new Date().getDate()%2===0 ? 'sampson' : 'sharyn';
    reason = '双方次数相同，按今日约定轮值';
  } else {
    closer = sc < yc ? 'sampson' : 'sharyn';
    reason = '为了让想念被平均收藏';
  }
  return { mode:'fair', closer, title:'公平轮值已决定', desc:`${reason}，今晚由 ${closer==='sampson'?'Sampson':'Sharyn'} 收尾`, fairReason:reason, antiStreak:streak, sampsonCount:sc, sharynCount:yc, ts:Date.now() };
}

function startQuiz(room) {
  const q = pick(QUIZ_QUESTIONS);
  room.currentQuestion = { id:q.id, text:q.text, options:q.options, type:q.type };
  room.answers = { sampson:null, sharyn:null };
  room.revealedAnswers = null;
  room.phase = 'answering';
  if(room.players.sampson) room.players.sampson.answered = false;
  if(room.players.sharyn) room.players.sharyn.answered = false;
}

function resolveQuiz(room) {
  const sa = room.answers.sampson;
  const ya = room.answers.sharyn;
  const match = sa === ya;
  room.revealedAnswers = { sampson:sa, sharyn:ya, match };
  let closer, desc;
  if(match) {
    closer = pick(['sampson','sharyn']);
    desc = '默契达成！答案完全一致，命运温柔指定';
  } else {
    if(room.currentQuestion.type === 'person') {
      closer = pick(['sampson','sharyn']);
    } else {
      closer = pick(['sampson','sharyn']);
    }
    desc = '答案不同，但理解从不完美，命运已替你们决定';
  }
  const as = antiStreak(room, closer);
  if(as.triggered) closer = as.closer;
  return { mode:'quiz', closer, title: match?'默契达成':'命运已揭晓', desc, quizMatch:match, quizQuestion:room.currentQuestion.text, quizAnswers:{ sampson:sa, sharyn:ya }, antiStreak:as.triggered, ts:Date.now() };
}

function playDice(room) {
  const pi = Math.floor(Math.random()*DICE_PERSON.length);
  const ai = Math.floor(Math.random()*DICE_ACTION.length);
  const person = DICE_PERSON[pi];
  const action = DICE_ACTION[ai];
  if(person === '重投一次') return { mode:'dice', closer:'sampson', title:'命运骰子', desc:'骰子说：重投一次！', isReroll:true, dicePersonIdx:pi, diceActionIdx:ai, ts:Date.now() };
  let closer, extraMinutes;
  if(person === '加时2分钟') {
    closer = pick(['sampson','sharyn']);
    extraMinutes = 2;
  } else {
    closer = person.toLowerCase() === 'sampson' ? 'sampson' : 'sharyn';
  }
  const as = antiStreak(room, closer);
  if(as.triggered) closer = as.closer;
  return { mode:'dice', closer, title:'命运骰子已落定', desc:`${person} · ${action}`, extraTask: action!=='立即收尾'? action.replace('后收尾',''):undefined, extraMinutes, dicePersonIdx:pi, diceActionIdx:ai, antiStreak:as.triggered, ts:Date.now() };
}

function playStory(room) {
  const card = pick(STORY_CARDS);
  let closer;
  if(card.closer === 'system') closer = pick(['sampson','sharyn']);
  else if(card.closer === 'delay') closer = pick(['sampson','sharyn']);
  else if(card.closer === 'swap') {
    const lastCloser = room.history.length > 0 ? room.history[room.history.length-1].result.closer : 'sampson';
    closer = lastCloser === 'sampson' ? 'sharyn' : 'sampson';
  } else closer = card.closer;
  const as = antiStreak(room, closer);
  if(as.triggered) closer = as.closer;
  return { mode:'story', closer, title:card.title, desc:card.desc, extraTask:card.task, extraMinutes:card.extraMinutes, storyId:card.id, antiStreak:as.triggered, ts:Date.now() };
}

function playTask(room) {
  const task = pick(TASK_POOL);
  let closer = pick(['sampson','sharyn']);
  const as = antiStreak(room, closer);
  if(as.triggered) closer = as.closer;
  return { mode:'task', closer, title:'心动任务', desc:`完成任务后由 ${closer==='sampson'?'Sampson':'Sharyn'} 温柔收尾`, extraTask:task.text, taskId:task.id, antiStreak:as.triggered, ts:Date.now() };
}

function playBlindbox(room) {
  const item = pick(BLINDBOX_ITEMS);
  let closer, desc = item.desc, extraTask, extraMinutes, isExempt=false, isReverse=false, isSpecial=false;
  switch(item.type) {
    case 'result':
      closer = item.closer;
      break;
    case 'task':
      closer = pick(['sampson','sharyn']);
      extraTask = item.task;
      break;
    case 'bonus':
      closer = pick(['sampson','sharyn']);
      extraMinutes = item.extraMinutes;
      break;
    case 'reverse':
      const last = room.history.length > 0 ? room.history[room.history.length-1].result.closer : 'sampson';
      closer = last === 'sampson' ? 'sharyn' : 'sampson';
      isReverse = true;
      break;
    case 'exempt':
      closer = 'sampson';
      isExempt = true;
      break;
    case 'special':
      const sc = room.history.filter(e=>e.result.closer==='sampson').length;
      const yc = room.history.filter(e=>e.result.closer==='sharyn').length;
      closer = sc <= yc ? 'sharyn' : 'sampson';
      isSpecial = true;
      desc = '今晚不讲公平，讲偏爱——偏爱更辛苦的那个人';
      break;
    default:
      closer = pick(['sampson','sharyn']);
  }
  if(!isExempt && !isReverse) {
    const as = antiStreak(room, closer);
    if(as.triggered) closer = as.closer;
  }
  return { mode:'blindbox', closer, title:item.title, desc, extraTask, extraMinutes, isExempt, isReverse, isSpecial, blindboxType:item.type, blindboxId:item.id, ts:Date.now() };
}

function playStarTrail(room) {
  let closer = pick(['sampson','sharyn']);
  const as = antiStreak(room, closer);
  if(as.triggered) closer = as.closer;
  const wishes = ['今晚的星轨划向了你','星光为你停留了一秒','流星在你的名字旁落定','星河尽头写着你的名字'];
  return { mode:'startrail', closer, title:'星轨已落定', desc: pick(wishes), antiStreak:as.triggered, ts:Date.now() };
}

function startCountdown(room) {
  room.phase = 'answering';
  room.countdownTarget = Date.now() + 5000;
  room.countdownPresses = { sampson:null, sharyn:null };
  if(room.players.sampson) room.players.sampson.answered = false;
  if(room.players.sharyn) room.players.sharyn.answered = false;
}

function resolveCountdown(room) {
  const sp = room.countdownPresses.sampson;
  const yp = room.countdownPresses.sharyn;
  const target = room.countdownTarget;
  let closer, desc, perfectSync = false;
  if(!sp && !yp) {
    closer = pick(['sampson','sharyn']);
    desc = '都没有按下按钮，命运随机决定';
  } else if(!sp) {
    closer = 'sampson';
    desc = 'Sampson 没有按下按钮，由 Sampson 收尾';
  } else if(!yp) {
    closer = 'sharyn';
    desc = 'Sharyn 没有按下按钮，由 Sharyn 收尾';
  } else {
    const sd = Math.abs(sp - target);
    const yd = Math.abs(yp - target);
    const diff = Math.abs(sp - yp);
    if(diff < 500) {
      perfectSync = true;
      closer = pick(['sampson','sharyn']);
      desc = `完美同步！差距仅 ${diff} 毫秒，命运温柔指定`;
    } else {
      closer = sd > yd ? 'sampson' : 'sharyn';
      desc = `${closer==='sampson'?'Sampson':'Sharyn'} 的节奏慢了一拍，负责今晚的收尾`;
    }
  }
  const as = antiStreak(room, closer);
  if(as.triggered) closer = as.closer;
  return { mode:'countdown', closer, title: perfectSync?'完美同步':'倒数已揭晓', desc, perfectSync, syncDiff: sp&&yp ? Math.abs(sp-yp) : null, antiStreak:as.triggered, ts:Date.now() };
}

// ============================================================
//  GAME FLOW
// ============================================================

function startGame(room) {
  const mode = room.selectedMode;
  room.result = null;
  room.revealedAnswers = null;
  room.currentQuestion = null;
  // Interactive modes handle their own phase transitions
  if(mode === 'quiz') { startQuiz(room); return null; }
  if(mode === 'countdown') { startCountdown(room); return null; }
  // Direct result modes
  room.phase = 'playing';
  let result;
  switch(mode) {
    case 'wheel': result = playWheel(room); break;
    case 'card': result = playCard(room); break;
    case 'fair': result = playFair(room); break;
    case 'dice': result = playDice(room); break;
    case 'story': result = playStory(room); break;
    case 'task': result = playTask(room); break;
    case 'blindbox': result = playBlindbox(room); break;
    case 'startrail': result = playStarTrail(room); break;
    default: return null;
  }
  return result;
}

function finalizeResult(room, result) {
  const egg = checkEasterEgg(room);
  if(egg) result.easterEgg = egg;
  room.result = result;
  room.phase = 'result';
  room.history.push({ id:uid(), result, date:new Date().toLocaleDateString('zh-CN'), ts:Date.now() });
  // Update stats
  room.stats.totalGames++;
  if(!room.stats.modesUsed.includes(result.mode)) room.stats.modesUsed.push(result.mode);
  // Check achievements
  checkAchievements(room, result);
}

function checkAchievements(room, result) {
  const a = room.achievements;
  const has = id => a.includes(id);
  if(!has('first_sync') && result.mode==='quiz' && result.quizMatch) a.push('first_sync');
  if(!has('favor') && result.isSpecial) a.push('favor');
  if(!has('collector_7') && room.stats.totalGames >= 7) a.push('collector_7');
  if(!has('guardian_10')) {
    const sc = room.history.filter(e=>e.result.closer==='sampson').length;
    const yc = room.history.filter(e=>e.result.closer==='sharyn').length;
    if(sc >= 10 || yc >= 10) a.push('guardian_10');
  }
  if(!has('blindbox_5') && room.history.filter(e=>e.result.mode==='blindbox').length >= 5) a.push('blindbox_5');
  if(!has('perfect_sync') && result.mode==='countdown' && result.perfectSync) a.push('perfect_sync');
  if(!has('all_modes') && room.stats.modesUsed.length >= 10) a.push('all_modes');
  // Check overtime streak
  if(!has('overtime_3')) {
    const last3 = room.history.slice(-3);
    if(last3.length >= 3 && last3.every(e=>e.result.extraMinutes)) a.push('overtime_3');
  }
}

function resetGame(roomId) {
  const room = rooms.get(roomId);
  if(!room) return false;
  room.phase = 'both_joined';
  room.selectedMode = null;
  room.modeSelectedBy = null;
  room.result = null;
  room.currentQuestion = null;
  room.answers = { sampson:null, sharyn:null };
  room.revealedAnswers = null;
  room.countdownTarget = null;
  room.countdownPresses = { sampson:null, sharyn:null };
  if(room.players.sampson) { room.players.sampson.ready = false; room.players.sampson.answered = false; }
  if(room.players.sharyn) { room.players.sharyn.ready = false; room.players.sharyn.answered = false; }
  return true;
}

// ============================================================
//  SOCKET.IO
// ============================================================

io.on('connection', (socket) => {
  console.log(`[连接] ${socket.id}`);

  socket.on('create_room', (cb) => {
    if(typeof cb !== 'function') return;
    const room = createRoom();
    console.log(`[创建] ${room.id}`);
    cb({ roomId: room.id });
  });

  socket.on('join_room', (data, cb) => {
    if(typeof cb !== 'function' || !data) return;
    const res = joinRoom(data.roomId, data.role, socket.id);
    if(!res.success) return cb({ success:false, error:res.error });
    socket.join(data.roomId);
    const st = toClient(res.room);
    cb({ success:true, state:st });
    socket.to(data.roomId).emit('player_joined', { role:data.role });
    io.to(data.roomId).emit('room_state', st);
    console.log(`[加入] ${data.role} -> ${data.roomId}`);
  });

  socket.on('select_mode', (data) => {
    const f = findBySocket(socket.id);
    if(!f) return;
    if(!selectMode(f.room.id, data.mode, f.role)) return;
    io.to(f.room.id).emit('mode_changed', { mode:data.mode, by:f.role });
    io.to(f.room.id).emit('room_state', toClient(f.room));
  });

  socket.on('toggle_ready', () => {
    const f = findBySocket(socket.id);
    if(!f) return;
    const res = toggleReady(f.room.id, socket.id);
    if(!res) return;
    io.to(f.room.id).emit('ready_changed', { role:res.role, ready:res.ready });
    io.to(f.room.id).emit('room_state', toClient(f.room));
  });

  socket.on('start_game', () => {
    const f = findBySocket(socket.id);
    if(!f || f.room.phase !== 'both_ready') return;
    const room = f.room;
    const result = startGame(room);
    if(result === null) {
      // Interactive mode - just broadcast the new state
      io.to(room.id).emit('room_state', toClient(room));
      return;
    }
    // Direct result mode - broadcast with delay for animation
    io.to(room.id).emit('game_starting', { mode:room.selectedMode });
    io.to(room.id).emit('room_state', toClient(room));
    setTimeout(() => {
      finalizeResult(room, result);
      io.to(room.id).emit('game_result', { result:room.result });
      io.to(room.id).emit('room_state', toClient(room));
    }, 500);
  });

  socket.on('submit_answer', (data) => {
    const f = findBySocket(socket.id);
    if(!f || f.room.phase !== 'answering') return;
    const room = f.room;
    const role = f.role;
    room.answers[role] = data.answer;
    room.players[role].answered = true;
    io.to(room.id).emit('player_answered', { role });
    io.to(room.id).emit('room_state', toClient(room));
    // Check if both answered
    if(room.answers.sampson !== null && room.answers.sharyn !== null) {
      if(room.selectedMode === 'quiz') {
        const result = resolveQuiz(room);
        setTimeout(() => {
          // First reveal answers
          io.to(room.id).emit('answers_revealed', { sampson:room.answers.sampson, sharyn:room.answers.sharyn, match:result.quizMatch });
          io.to(room.id).emit('room_state', toClient(room));
          // Then finalize result
          setTimeout(() => {
            finalizeResult(room, result);
            io.to(room.id).emit('game_result', { result:room.result });
            io.to(room.id).emit('room_state', toClient(room));
          }, 2500);
        }, 500);
      }
    }
  });

  socket.on('countdown_press', () => {
    const f = findBySocket(socket.id);
    if(!f || f.room.phase !== 'answering' || f.room.selectedMode !== 'countdown') return;
    const room = f.room;
    const role = f.role;
    if(room.countdownPresses[role] !== null) return;
    room.countdownPresses[role] = Date.now();
    room.players[role].answered = true;
    io.to(room.id).emit('player_answered', { role });
    io.to(room.id).emit('room_state', toClient(room));
    if(room.countdownPresses.sampson !== null && room.countdownPresses.sharyn !== null) {
      const result = resolveCountdown(room);
      setTimeout(() => {
        finalizeResult(room, result);
        io.to(room.id).emit('game_result', { result:room.result });
        io.to(room.id).emit('room_state', toClient(room));
      }, 1000);
    }
  });

  socket.on('reset_game', () => {
    const f = findBySocket(socket.id);
    if(!f) return;
    resetGame(f.room.id);
    io.to(f.room.id).emit('game_reset');
    io.to(f.room.id).emit('room_state', toClient(f.room));
  });

  socket.on('leave_room', () => {
    const res = leaveRoom(socket.id);
    if(!res) return;
    socket.leave(res.roomId);
    const room = getRoom(res.roomId);
    if(room) {
      socket.to(res.roomId).emit('player_left', { role:res.role });
      io.to(res.roomId).emit('room_state', toClient(room));
    }
  });

  socket.on('request_state', () => {
    const f = findBySocket(socket.id);
    if(!f) return;
    socket.emit('room_state', toClient(f.room));
  });

  socket.on('disconnect', (reason) => {
    const res = leaveRoom(socket.id);
    if(!res) return;
    const room = getRoom(res.roomId);
    if(room) {
      io.to(res.roomId).emit('player_left', { role:res.role });
      io.to(res.roomId).emit('room_state', toClient(room));
    }
  });
});

// Cleanup
setInterval(() => {
  const now = Date.now();
  for(const [id, room] of rooms.entries())
    if(now - room.createdAt > 3*60*60*1000 && !room.players.sampson?.connected && !room.players.sharyn?.connected)
      rooms.delete(id);
}, 10*60*1000);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`🌙 晚安收尾官 v2 已启动: http://localhost:${PORT}`));
