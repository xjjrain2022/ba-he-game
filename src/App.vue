<script setup>
import { reactive, ref, computed, watch } from 'vue'
// 获胜分点
const WIN_SCORE = 1000
// 助力步长
const POWER_ADD_SCORE = 50
const form = reactive({
  name: '',
  team: '',
})
const teamScore = ref({
  left: 0,
  right: 0,
})

const formDiabled = ref(false)
const marks = reactive({
  0: '中点',
  [WIN_SCORE]: '右队胜',
  [-WIN_SCORE]: '左队胜'
})
const gameInfo = ref({
  isGameStarting: false,
  leftTeamMembers: [],
  rightTeamMembers: [],
  team: '',
  leftScore: 0,
  rightScore: 0,
})
const sliderValue = computed(() => {
  const {leftScore, rightScore} = gameInfo.value
  return rightScore - leftScore
})
const allowGameStart = computed(() => {
  const {isGameStarting, leftTeamMembers, rightTeamMembers} = gameInfo.value
  return isGameStarting === false && leftTeamMembers.length && rightTeamMembers.length
})

// 从本地读取用户
const historyUser = localStorage.getItem('bahe_user')
if (historyUser) {
  const info = JSON.parse(historyUser)
  form.name = info.name
  form.team = info.team
  formDiabled.value = true
}

const historyRecords = ref(null)

// 连接 websocket 服务器
const ws = ref(null)
ws.value = new WebSocket('ws://localhost:8080')

ws.value.onopen = function(event) {
  console.log('WebSocket connected: ', event);
  if (formDiabled.value) {
    joinTeam()
  }
};

ws.value.onerror = function(error) {
  console.error('WebSocket error: ', error);
};

ws.value.onmessage = function(event) {
  console.log('WebSocket message received: ', event.data);
  const {type, data} = JSON.parse(event.data)
  switch (type) {
    case 'init':
      gameInfo.value = data
      break
    case 'fetch-history-completed':
      fetchHistoryCompleted(data)
      break;
  
    default:
      gameInfo.value = data
      break;
  }
  
};

ws.value.onclose = function() {
  console.log('WebSocket disconnected');
  ws.value.send(JSON.stringify({
    type: 'member-leave',
    data: form
  }))
};

const onSubmit = () => {
  console.log('submit!')
  const user = JSON.stringify(form)
  localStorage.setItem('bahe_user', user)
  formDiabled.value = true
  joinTeam()
}
const onStartGame = () => {
  ws.value.send(JSON.stringify({
    type: 'start-game',
    data: null
  }))
}
const addPower = team => {
  console.log('gameInfo: ', gameInfo.value)
  if (!gameInfo.value.isGameStarting) {
    return
  }
  console.log('send...')
  ws.value.send(JSON.stringify({
    type: 'add-power',
    data: form
  }))
}
const fetchHistory = () => {
  ws.value.send(JSON.stringify({
    type: 'fetch-history',
    data: form
  }))
}
watch(sliderValue, () => {
  if (sliderValue.value > WIN_SCORE) {
    alert('右队获胜')
  }
  if (sliderValue.value < -WIN_SCORE) {
    alert('左队获胜')
  }
})

function joinTeam() {
  ws.value.send(JSON.stringify({
    type: 'join-team',
    data: form
  }))
}
function fetchHistoryCompleted(data) {
  historyRecords.value = data.map(item => {
    const { team, score, timestamp } = item
    const date = new Date(timestamp)
    return {
      score,
      team: team === 'left' ? '左队' : '右队',
      time: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    }
  })
}


</script>

<template>
  <el-row>
    <el-col :span="24">
      <h1>拔河比赛</h1>
    </el-col>
  </el-row>
  <el-divider />
  

  <el-card style="margin-top: 20px;">
    <template #header>
      <div class="card-header">
        <span>用户信息</span>
      </div>
    </template>
    <el-form :model="form" label-width="auto" style="max-width: 600px" :disabled="formDiabled">
        <el-form-item label="用户名">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="队伍">
          <el-radio-group v-model="form.team">
            <el-radio value="left">左队</el-radio>
            <el-radio value="right">右队</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSubmit">加入游戏</el-button>
          
        </el-form-item>
      </el-form>
  </el-card>

  

  <el-card style="margin-top: 20px;">
    <template #header>
      <div class="card-header">
        <span>比赛区</span>
        <div>
          <el-button type="success" @click="onStartGame" :disabled="!allowGameStart">开始比赛</el-button>
        </div>
      </div>
    </template>
    <div class="game">
      <el-button type="primary" 
        class="power-btn" circle 
        @click="addPower('left')" 
        v-if="formDiabled && form.team === 'left'"
        :disabled="!gameInfo.isGameStarting"
      >为左队加力</el-button>
      <el-button type="info" class="power-btn" circle disabled v-else>左队</el-button>
      <el-slider class="game-line" 
        v-model="sliderValue" 
        :show-tooltip="true" 
        :min="-2000" 
        :max="2000" 
        :marks="marks"
        :tooltip-class="'game-slider'"
      />
      <el-button type="danger" class="power-btn" circle @click="addPower('right')"
        v-if="formDiabled && form.team === 'right'"
        :disabled="!gameInfo.isGameStarting"
      >为右队加力</el-button>
      <el-button type="info" class="power-btn" circle disabled v-else>右队</el-button>
    </div>
  </el-card>

  <el-card style="margin-top: 20px;">
    <template #header>
      <div class="card-header">
        <span>历史记录</span>
        <el-button type="primary" @click="fetchHistory">获取历史记录</el-button>
      </div>
    </template>
    <el-table :data="historyRecords" style="width: 100%" v-if="historyRecords && historyRecords.length">
      <el-table-column prop="team" label="队伍" width="180" />
      <el-table-column prop="score" label="团队分" width="180" />
      <el-table-column prop="time" label="日期" />
    </el-table>
  </el-card>
  
  <!-- <div>
    <h1>比赛区</h1>
    <div v-if="formDiabled">{{form.name}}加入了{{form.team === 'left' ? '左队' : '右队'}}</div>
    <div>
      <el-button type="success" @click="onStartGame" :disabled="!allowGameStart">开始比赛</el-button>
    </div>
  </div>
  <el-divider />

  <main>
    
    
  </main> -->
</template>

<style scoped>
.power-btn {
  width: 100px;
  height: 100px;
}

.game {
  display: flex;
  align-items: center;
}
.game-line {
  flex: 1;
  margin: 0 20px;
}
.game-slider {
  background: yellow
}
.card-header {
  display: flex;
  justify-content: space-between;
}
</style>
