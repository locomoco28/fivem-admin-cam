/*
 * FiveM admin-cam
 * Client code
 */

// TODO: create external config file
const Config = {
  'mouse-look-sens': {
    uxName: 'Mouse Sensitivity',
    type: 'float',
    value: 0.1,
  },
  'gamepad-look-sens': {
    uxName: 'Gamepad Look Sensitivity',
    type: 'float',
    value: 0.03,
  },
  'movement-factor': { uxName: 'Movement Factor', type: 'float', value: 0.01 },
}

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

RegisterCommand('acam-getconfig', (src, args, raw) => {
  sendInfo('Current configuration:', { color: [255, 180, 0] })
  sendInfo(
    'Sensitivity Factor Mouse: ' +
      (
        GetResourceKvpFloat('MOUSELOOKSENS') || Config['mouse-look-sens'].value
      ).toFixed(3),
    { color: [255, 180, 0] }
  )
  sendInfo(
    'Sensitivity Factor Gamepad: ' +
      (
        GetResourceKvpFloat('GAMEPADLOOKSENS') ||
        Config['gamepad-look-sens'].value
      ).toFixed(3),
    { color: [255, 180, 0] }
  )
  sendInfo(
    'Sensitivity Factor Movement: ' +
      (
        GetResourceKvpFloat('MOVEMENTFACTOR') || Config['movement-factor'].value
      ).toFixed(3),
    { color: [255, 180, 0] }
  )
})
RegisterCommand('acam-setconfig', (src, args, raw) => {
  if (args.length == 0) {
    return sendInfo(
      'Format: acam-setconfig <' +
        Object.keys(Config).join(' | ') +
        '> <new value>'
    )
  }
  if (!(args[0] in Config))
    return sendError(
      'Unkown config, please use one of the following: ' +
        Object.keys(Config).join(', ')
    )

  const confObj = Config[args[0]]

  if (args.length < 2)
    return sendError(
      'Please provide a value to be set as config (value type: ' +
        confObj.type +
        ')'
    )

  let value = args[1]
  // not sure if I'll need integer config, I'll just add it just in case
  if (confObj.type == 'float' || confObj.type == 'int') {
    value = +args[1]
    // I don't think there will ever be a negative value required
    // in the config so I'll just go ahead and hardcode the < 0 rule
    // instead of adding another property into the config file
    if (value < 0 || Number.isNaN(value))
      return sendError('You have to provide a numerical sensitivity above 0')

    if (confObj.type == 'float')
      SetResourceKvpFloat(args[0].split('-').join('').toUpperCase(), value)
    else SetResourceKvpInt(args[0].split('-').join('').toUpperCase(), value)

    sendInfo(
      'Setted config ' +
        args[0] +
        ' to ' +
        value.toFixed(3) +
        '.' +
        (cam != null && IsCamActive(cam)
          ? " Changes will take effect after you've stopped watching the current player."
          : '')
    )
    return
  }

  SetResourceKvp(args[0].split('-').join('').toUpperCase(), args[1])
  sendInfo(
    'Setted config ' +
      args[0] +
      ' to ' +
      args[1] +
      '.' +
      (cam != null && IsCamActive(cam)
        ? " Changes will take effect after you've stopped watching the current player."
        : '')
  )
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

function sendInfo(txt, options = {}) {
  emit('chat:addMessage', {
    ...options,
    multiline: true,
    args: ['[i] Admin Watch', txt],
  })
}

function sendError(txt, options = {}) {
  emit('chat:addMessage', {
    ...options,
    args: ['[!] Admin Watch', txt],
  })
}
function log(txt) {
  console.log(txt)
  /**
  emit('chat:addMessage', {
    args: [txt],
  })
  /**/
}

let playerLastLocation = [0, 0, 0]
function playerInvisible() {
  let playerPed = GetPlayerPed(-1)
  let oldpLoc = playerLastLocation
  playerLastLocation = GetEntityCoords(playerPed)
  Wait(1000)
  log(
    'Logged player last location from ' +
      JSON.stringify(oldpLoc) +
      ' to ' +
      JSON.stringify(playerLastLocation)
  )
  FreezeEntityPosition(playerPed, true)
  NetworkConcealEntity(playerPed, true)
  SetEntityHeading(playerPed, 0)
}

function playerVisible() {
  let playerPed = GetPlayerPed(-1)
  log('Recovering player with location ' + JSON.stringify(playerLastLocation))
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

let mouseSensFactor = Config['mouse-look-sens'].value
let gamepadSensFactor = Config['gamepad-look-sens'].value
let movementFactor = Config['movement-factor'].value
function setTickTimer() {
  if (camControlTick != null) clearTickTimer()

  mouseSensFactor =
    GetResourceKvpFloat('MOUSELOOKSENS') || Config['mouse-look-sens'].value
  gamepadSensFactor =
    GetResourceKvpFloat('GAMEPADLOOKSENS') || Config['gamepad-look-sens'].value
  movementFactor =
    GetResourceKvpFloat('MOVEMENTFACTOR') || Config['movement-factor'].value

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
      camOffset.fov -= GetControlValue(0, 71) / 60
      if (camOffset.fov < camCoordRanges.fov.min)
        camOffset.fov = camCoordRanges.fov.min
    } else if (IsControlPressed(0, 72)) {
      // Zoom Out
      camOffset.fov += GetControlValue(0, 72) / 60
      if (camOffset.fov > camCoordRanges.fov.max)
        camOffset.fov = camCoordRanges.fov.max
    }
  } else {
    // 180 > rotation > -180
    const cameraRot = GetCamRot(cam, 2)[2]
    const cameraRotNormalize = cameraRot + 90 // normalize (only positive) and turn 90 deg (make rotation start on positive X axis)

    // Move Left/Right
    camOffset.coords[0] -=
      Cos(cameraRotNormalize + 90) *
      (GetControlValue(0, 30) - 127) *
      movementFactor
    camOffset.coords[1] -=
      Sin(cameraRotNormalize + 90) *
      (GetControlValue(0, 30) - 127) *
      movementFactor

    // Move Up
    camOffset.coords[0] -=
      Cos(cameraRotNormalize) * (GetControlValue(0, 31) - 127) * movementFactor
    camOffset.coords[1] -=
      Sin(cameraRotNormalize) * (GetControlValue(0, 31) - 127) * movementFactor

    if (camOffset.coords[0] < camCoordRanges.x.min)
      camOffset.coords[0] = camCoordRanges.x.min
    else if (camOffset.coords[0] > camCoordRanges.x.max)
      camOffset.coords[0] = camCoordRanges.x.max
    if (camOffset.coords[1] < camCoordRanges.y.min)
      camOffset.coords[1] = camCoordRanges.y.min
    else if (camOffset.coords[1] > camCoordRanges.y.max)
      camOffset.coords[1] = camCoordRanges.y.max

    // Move Up
    if (IsControlPressed(0, 36)) {
      camOffset.coords[2] += 70 * movementFactor
      if (camOffset.coords[2] > camCoordRanges.z.max)
        camOffset.coords[2] = camCoordRanges.z.max
    }
    // Move Down
    else if (IsControlPressed(0, 26)) {
      camOffset.coords[2] -= 100 * movementFactor
      if (camOffset.coords[2] < camCoordRanges.z.min)
        camOffset.coords[2] = camCoordRanges.z.min
    }
  }

  // higher sens for mouse
  lookaroundSens = IsInputDisabled(2) ? mouseSensFactor : gamepadSensFactor

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
