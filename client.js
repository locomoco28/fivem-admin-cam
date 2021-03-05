/*
 * FiveM admin-cam
 * Client code
 */

let activePlayers = []
emitNet('getAllPlayers')
onNet('updateAllPlayers', (playerList) => {
  activePlayers = playerList
})

let spawnedPed = null
let spawnedPedVeh = null

let cam = null
let isSpectate = false

const camCoordRanges = {
  x: { max: 10, min: -10 },
  y: { max: 15, min: -15 },
  z: { min: 2, max: 15 },
  fov: { min: 10, max: 140 },
}

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

    let eCoords = GetEntityCoords(ped),
      eRot = GetGameplayCamRot(2)

    if (!DoesCamExist(cam)) {
      cam = CreateCameraWithParams(
        'DEFAULT_SCRIPTED_CAMERA',
        eCoords,
        eRot,
        100,
        true,
        2
      )
    }
    playerInvisible()

    AttachCamToEntity(cam, ped, 0, 0, 12, false)

    SetCamActive(cam, true)
    RenderScriptCams(true, 1, 500, true, false, false)

    // important to call after player invisible so the last location gets cached
    setTickTimer()
  },
  false
)

RegisterCommand(
  'setCamFov',
  (src, args, raw) => {
    if (args.length < 1) SetCamFov(cam, 100)
    else SetCamFov(cam, Number(args[0]))
  },
  false
)

RegisterCommand(
  'stopWatch',
  (src, args, raw) => {
    clearTickTimer()

    Wait(1)

    if (DoesCamExist(cam)) {
      // destroy cam
      SetCamActive(cam, false)
      DestroyCam(cam, false)
      cam = null
    }

    playerVisible()
    RenderScriptCams(false, 1, 500, true, false, false)
  },
  false
)

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

let playerLastLocation = [0, 0, 0]
function playerInvisible() {
  let playerPed = GetPlayerPed(-1)
  let oldpLoc = playerLastLocation
  playerLastLocation = GetEntityCoords(playerPed)
  console.log(
    'Logged player last location from ' +
      JSON.stringify(oldpLoc) +
      ' to ' +
      JSON.stringify(playerLastLocation)
  )
  FreezeEntityPosition(playerPed, true)
  NetworkConcealEntity(playerPed, true)
}

function playerVisible() {
  let playerPed = GetPlayerPed(-1)
  console.log(
    'Recovering player with location ' + JSON.stringify(playerLastLocation)
  )
  Wait(1000)
  let safeCoord = GetSafeCoordForPed(
    playerLastLocation[0],
    playerLastLocation[1],
    playerLastLocation[2],
    true,
    0
  )
  SetEntityCoords(
    playerPed,
    safeCoord[0],
    safeCoord[1],
    safeCoord[2],
    false,
    false,
    false,
    false
  )
  NetworkConcealEntity(playerPed, false)
  FreezeEntityPosition(playerPed, false)
  playerLastLocation = [0, 0, 0]
}

let camControlTick = null
function setTickTimer() {
  if (camControlTick != null) clearTickTimer()
  camControlTick = setTick(adminTickFunc)
}
function clearTickTimer() {
  clearTick(camControlTick)
  camControlTick = null
}

let camOffset = {
  coords: [0, 0, camCoordRanges.z.min],
  rot: [0, 0, 0],
  fov: 100,
}
function adminTickFunc() {
  let playerPed = GetPlayerPed(-1)

  if (!DoesCamExist(cam)) {
    return
  }

  //let newCamLoc = { ...camOffset }
  const fovRelativeSensRatio = 90 // smaller = quicker look-around

  let drawData = []

  // + special key 45 used for fov/zoom
  if (IsControlPressed(0, 45)) {
    if (IsControlPressed(0, 71)) {
      // Zoom In
      camOffset.fov -= GetControlValue(0, 71) / 30
      if (camOffset.fov < camCoordRanges.fov.min)
        camOffset.fov = camCoordRanges.fov.min
    } else if (IsControlPressed(0, 72)) {
      // Zoom Out
      camOffset.fov += GetControlValue(0, 72) / 30
      if (camOffset.fov > camCoordRanges.fov.max)
        camOffset.fov = camCoordRanges.fov.max
    }
  } else {
    // Move Left/Right
    camOffset.coords[0] += (GetControlValue(0, 30) - 127) * 0.01
    if (camOffset.coords[0] < camCoordRanges.x.min)
      camOffset.coords[0] = camCoordRanges.x.min
    else if (camOffset.coords[0] > camCoordRanges.x.max)
      camOffset.coords[0] = camCoordRanges.x.max
    // Move Forward/Backward
    camOffset.coords[1] -= (GetControlValue(0, 31) - 127) * 0.01
    if (camOffset.coords[1] < camCoordRanges.y.min)
      camOffset.coords[1] = camCoordRanges.y.min
    else if (camOffset.coords[1] > camCoordRanges.y.max)
      camOffset.coords[1] = camCoordRanges.y.max

    // Move Up
    if (IsControlPressed(0, 36)) {
      camOffset.coords[2] += 0.7
      if (camOffset.coords[2] > camCoordRanges.z.max)
        camOffset.coords[2] = camCoordRanges.z.max
    }
    // Move Down
    else if (IsControlPressed(0, 26)) {
      camOffset.coords[2] -= 0.7
      if (camOffset.coords[2] < camCoordRanges.z.min)
        camOffset.coords[2] = camCoordRanges.z.min
    }
  }

  // higher sens for mouse
  lookaroundSens = IsInputDisabled(2) ? 0.1 : 0.03

  // Look Left/Right
  camOffset.rot[2] -=
    (((GetControlValue(0, 1) - 127) * camOffset.fov) / 180) * lookaroundSens
  if (camOffset.rot[2] < -360 || camOffset.rot[2] > 360) camOffset.rot[2] = 0
  // Look Up/Down
  camOffset.rot[0] -=
    (((GetControlValue(0, 2) - 127) * camOffset.fov) / 180) * lookaroundSens
  if (camOffset.rot[0] < -89) camOffset.rot[0] = -89
  else if (camOffset.rot[0] > 89) camOffset.rot[0] = 89

  // update coords
  AttachCamToEntity(
    cam,
    spawnedPed,
    camOffset.coords[0],
    camOffset.coords[1],
    camOffset.coords[2],
    false
  )

  // didn't work with the selected ped coord smh
  let playerPedCoords = GetCamCoord(cam)

  SetEntityCoords(
    playerPed,
    playerPedCoords[0],
    playerPedCoords[1],
    playerPedCoords[2],
    false,
    false,
    false,
    false
  )

  // update rot
  SetCamRot(cam, camOffset.rot[0], camOffset.rot[1], camOffset.rot[2], 2)
  // update fov
  SetCamFov(cam, camOffset.fov)

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
    Object.keys(camOffset)
      .map(
        (x) =>
          `${x}:${
            x == 'fov'
              ? camOffset[x]
              : ` ${Object.keys(camOffset[x]).map(
                  (y) => `${y}: ${camOffset[x][y].toFixed(2)}`
                )}`
          }`
      )
      .join(', ')
  )
  DrawText(0.005, 0.15)
}

function quickArrCompare(a1, a2) {
  if (!Array.isArray(a1) || !Array.isArray(a2))
    throw new Error('Plesae give 2 arrays in the parameters')

  // https://stackoverflow.com/questions/7837456/how-to-compare-arrays-in-javascript/7837725#7837725
  var i = a1.length
  while (i--) {
    if (a1[i] !== a2[i]) return false
  }
  return true
}
