/*
 * FiveM admin-cam
 * Client code
 */
log('starting admin cam')

let activePlayers = []
emitNet('getAllPlayers')
onNet('updateAllPlayers', (playerList) => {
  activePlayers = playerList
})
log('a-cam: player list update handler')

let spawnedPed = null
let spawnedPedVeh = null

let cam = null
let isSpectate = false

let camControlTick = setTick(() => {
  if (IsControlPressed(0, 71))
    console.log('Accelerate RT val: ' + GetControlUnboundNormal(0, 71))
  if (IsControlPressed(0, 72))
    console.log('Deccelerate LT val: ' + GetControlUnboundNormal(0, 72))
  if (IsControlPressed(0, 278))
    console.log('Move L val: ' + GetControlValue(0, 278))
  if (IsControlPressed(0, 279))
    console.log('Move R val: ' + GetControlValue(0, 279))
  if (IsControlPressed(0, 280))
    console.log('Move Up val: ' + GetControlValue(0, 280))
  if (IsControlPressed(0, 281))
    console.log('Move Down val: ' + GetControlValue(0, 281))

  if (!DoesCamExist(cam)) {
    DisableControlAction(0, 1, false)
    DisableControlAction(0, 2, false)
    DisableControlAction(0, 3, false)
    DisableControlAction(0, 5, false)
    DisableControlAction(0, 79, false)
    DisableControlAction(0, 86, false)
  } else {
    DisableControlAction(0, 1, true)
    DisableControlAction(0, 2, true)
    DisableControlAction(0, 3, true)
    DisableControlAction(0, 5, true)
    DisableControlAction(0, 79, true)
    DisableControlAction(0, 86, true)
    DisableControlAction(0, 26, true)
    DisableControlAction(0, 36, true)
    let [camX, camY, camZ] = GetCamRot(cam, 2)
    let camFov = GetCamFov(cam)
    const fovRelativeSensRatio = 90 // smaller = quicker look-around
    if (IsDisabledControlPressed(0, 3)) {
      // look Up
      camX += 1.3 * (camFov / fovRelativeSensRatio)
      if (camX > 90) camX = 89
      else if (camX < -90) camX = -89
    } else if (IsDisabledControlPressed(0, 2)) {
      // look Down
      camX -= 1.3 * (camFov / fovRelativeSensRatio)
      if (camX > 90) camX = 89
      else if (camX < -90) camX = -89
    }
    if (IsDisabledControlPressed(0, 1)) {
      // look Right
      camZ -= 1.8 * (camFov / fovRelativeSensRatio)
    } else if (IsDisabledControlPressed(0, 5)) {
      // look Left
      camZ += 1.8 * (camFov / fovRelativeSensRatio)
    }
    if (IsDisabledControlPressed(0, 26) || IsDisabledControlPressed(0, 79)) {
      if (
        IsDisabledControlJustPressed(0, 26) ||
        IsDisabledControlJustPressed(0, 79)
      ) {
        //Right Stick
        camFov += 10
        if (camFov > 140) camFov = 140
      } else if (IsControlPressed(0, 71)) {
        camFov += GetControlUnboundNormal(0, 71) * 1.4
        if (camFov > 140) camFov = 140
      } else if (IsControlPressed(0, 72)) {
        camFov -= GetControlUnboundNormal(0, 72) * 1.4
        if (camFov < 10) camFov = 10
      }
    } else if (
      IsDisabledControlJustPressed(0, 36) ||
      IsDisabledControlJustPressed(0, 86)
    ) {
      //Left Stick
      camFov -= IsControlPressed(0, 71)
        ? GetControlUnboundNormal(0, 71) * 10
        : 10
      if (camFov < 10) camFov = 10
      console.log('FOV: ' + camFov)
    }

    SetCamRot(cam, camX, 0, camZ, 2)
    SetCamFov(cam, camFov)
  }
})

RegisterCommand(
  'fixCamToPed',
  (src, args, raw) => {
    let ped = null
    if (args.length < 1) {
      if (spawnedPed == null)
        return sendError('Please specify an ID or spawn a ped (/spawnped)')

      ped = spawnedPed
    } else {
      let tmpPed = PlayerPedId(args[0])
      if (!IsEntityAPed(tmpPed))
        return sendError('Specified ID is not a player')
      ped = tmpPed
    }

    if (!DoesCamExist(cam)) {
      cam = CreateCameraWithParams(
        'DEFAULT_SCRIPTED_CAMERA',
        GetGameplayCamCoord(),
        GetGameplayCamRot(2),
        100,
        true,
        2
      )
    }

    AttachCamToEntity(cam, ped, 0, 0, 14, true)
    SetCamFov(cam, 100)

    SetCamActive(cam, true)
    RenderScriptCams(true, 1, 500, true, false, false)
  },
  false
)
log('a-cam: fix to player')

RegisterCommand(
  'setCamFov',
  (src, args, raw) => {
    if (args.length < 1) SetCamFov(cam, 100)
    else SetCamFov(cam, Number(args[0]))
  },
  false
)
log('a-cam: set fov')

RegisterCommand(
  'stopWatch',
  (src, args, raw) => {
    if (DoesCamExist(cam)) {
      // destroy cam
      SetCamActive(cam, false)
      DestroyCam(cam, false)
      cam = null
    }

    RenderScriptCams(false, 1, 500, true, false, false)
  },
  false
)
log('a-cam: stopwatch')

RegisterCommand(
  'spawnRandomPed',
  (src, args, raw) => {
    if (DoesEntityExist(spawnedPed)) {
      SetEntityAsNoLongerNeeded(spawnedPed)
      spawnedPed = null
    }
    if (DoesEntityExist(spawnedPedVeh)) {
      SetEntityAsNoLongerNeeded(spawnedPed)
      spawnedPedVeh = null
    }

    const pedHash = GetHashKey('a_m_m_socenlat_01')
    const carHash = GetHashKey('police3')

    RequestModel(pedHash)
    RequestModel(carHash)

    let loadCnt = 0
    let cancel = false

    while (!HasModelLoaded(pedHash) && !HasModelLoaded(carHash) && !cancel) {
      loadCnt++
      if (loadCnt > 10) {
        cancel = true
        return
      }
      Wait(500)
    }

    if (cancel) {
      sendInfo('Could not load model within 5s')
      return
    }

    const [pX, pY, pZ] = GetGameplayCamCoord()

    spawnedPedVeh = CreateVehicle(carHash, pX, pY, pZ, 0, true, false)
    SetVehicleOnGroundProperly(spawnedPedVeh)
    SetVehicleEngineOn(spawnedPedVeh, true, true, false)

    spawnedPed = CreatePedInsideVehicle(
      spawnedPedVeh,
      4,
      pedHash,
      -1,
      true,
      false
    )

    SetBlockingOfNonTemporaryEvents(spawnedPed)
    TaskVehicleDriveWander(spawnedPed, spawnedPedVeh, 65, 2883636)
  },
  false
)
log('a-cam: spawn')

log('started admin cam')

function sendInfo(txt) {
  emit('chat:addMessage', {
    args: ['[i]Admin Watch: ' + txt],
  })
}

function sendError(txt) {
  emit('chat:addMessage', {
    args: ['[!]Admin Watch: ' + txt],
  })
}
function log(txt) {
  console.log(txt)
  emit('chat:addMessage', {
    args: [txt],
  })
}
