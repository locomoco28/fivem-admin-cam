// potential feature to see the spectated player's controls
// only controls relevant for driving used as this is intended for use on BUSTED
console.log('init control_ui')

setTick(liveControlsTickFunc)

let lastLiveData = {
  isKeyboard: true,
  playername: undefined,
  steering: 127,
  accelerate: 0,
  brake: 0,
}
function liveControlsTickFunc() {
  let isKeyboard = IsInputDisabled(2)
  let playername = GetPlayerName(PlayerPedId())
  let acceleration = GetControlValue(0, 71) - 127
  let braking = GetControlValue(0, 72) - 127
  let steering = GetControlValue(0, 30)

  let pushData = []
  if (lastLiveData.isKeyboard != isKeyboard) {
    pushData.push({ isKeyboard })
    lastLiveData.isKeyboard = isKeyboard
  }
  if (lastLiveData.playername != playername) {
    pushData.push({ playername })
    lastLiveData.playername = playername
  }
  if (lastLiveData.acceleration != acceleration) {
    pushData.push({ acceleration })
    lastLiveData.acceleration = acceleration
  }
  if (lastLiveData.braking != braking) {
    pushData.push({ braking })
    lastLiveData.braking = braking
  }
  if (lastLiveData.steering != steering) {
    pushData.push({ steering })
    lastLiveData.steering = steering
  }
  if (pushData.length > 0) {
    //console.log('New Data ' + JSON.stringify(Object.assign({}, ...pushData)))
    SendNuiMessage(
      JSON.stringify({
        type: 'data',
        data: Object.assign({}, ...pushData),
      })
    )
  }

  SetTextFont(0)
  SetTextProportional(1)
  SetTextScale(0.0, 0.3)
  SetTextColour(128, 128, 128, 255)
  SetTextDropshadow(0, 0, 0, 0, 255)
  SetTextEdge(1, 0, 0, 0, 255)
  SetTextDropShadow()
  SetTextOutline()
  SetTextEntry('STRING')
  AddTextComponentString(
    (isKeyboard ? 'Keyboard' : 'Gamepad') + ' User: ' + playername
  )
  DrawText(0.005, 0.35)

  Wait(500)
}
