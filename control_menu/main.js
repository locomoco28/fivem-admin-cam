let app = new Vue({
  el: 'main',
  data: {
    playername: undefined,
    isKeyboard: true,
    steering: 127,
    acceleration: 0,
    braking: 0,
  },
  methods: {
    valToPercent: function (val, maxVal = 127) {
      return (val / maxVal) * 100
    },
  },
})

let tog = false
window.addEventListener('message', (event) => {
  if (event.data.type === 'data') {
    Object.keys(event.data.data).forEach((key) => {
      Object.assign(app, event.data.data)
    })
  }
})
