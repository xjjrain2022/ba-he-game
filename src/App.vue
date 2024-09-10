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
const sliderValue = computed(() => teamScore.value.left + teamScore.value.right)
const formDiabled = ref(false)
const marks = reactive({
  0: '中点',
  [WIN_SCORE]: '右队胜',
  [-WIN_SCORE]: '左队胜'
})
// 从本地读取用户
const historyUser = localStorage.getItem('bahe_user')
if (historyUser) {
  const info = JSON.parse(historyUser)
  form.name = info.name
  form.team = info.team
  formDiabled.value = true
}
const onSubmit = () => {
  console.log('submit!')
  const user = JSON.stringify(form)
  localStorage.setItem('bahe_user', user)
  formDiabled.value = true
}
const addPower = team => {
  if (team === 'left') {
    teamScore.value.left -= POWER_ADD_SCORE
  }
  if (team === 'right') {
    teamScore.value.right += POWER_ADD_SCORE
  }
}
watch(sliderValue, () => {
  if (sliderValue.value > WIN_SCORE) {
    alert('右队获胜')
  }
  if (sliderValue.value < -WIN_SCORE) {
    alert('左队获胜')
  }
})
</script>

<template>
  <el-row>
    <el-col :span="24">
      <h1>拔河比赛</h1>
    </el-col>
  </el-row>
  <el-row :gutter="20">
    <el-col :span="12" :offset="6">
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
          <el-button>历史记录</el-button>
        </el-form-item>
      </el-form>
    </el-col>
  </el-row>
  
  <header>
    
  </header>
  <el-row>
    <el-col :span="24">
      <h1>比赛情况</h1>
      <div v-if="formDiabled">{{form.name}}加入了{{form.team === 'left' ? '左队' : '右队'}}</div>
    </el-col>
  </el-row>

  <main>
    <div class="game">
      <el-button type="primary" class="power-btn" circle @click="addPower('left')" v-if="formDiabled && form.team === 'left'">为左队加力</el-button>
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
      >为右队加力</el-button>
      <el-button type="info" class="power-btn" circle disabled v-else>右队</el-button>
    </div>
  </main>
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
</style>
