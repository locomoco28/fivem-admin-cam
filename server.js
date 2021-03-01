/*
 * FiveM admin-cam
 * Server code
 */

RegisterNetEvent('playerJoining')

const getAllPlayers = () => {
  let players = []
  Array.from(Array(GetNumPlayerIndices()), (_, i) =>
    players.push(Number(GetPlayerFromIndex(i)))
  )
  return players
}

onNet('getAllPlayers', () => {
  emitNet('updateAllPlayers', source, getAllPlayers())
})

on('playerJoining', (...args) => {
  emitNet('updateAllPlayers', -1, getAllPlayers())
})
on('playerDropped', (...args) => {
  emitNet('updateAllPlayers', -1, getAllPlayers())
})
