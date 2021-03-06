# fivem-admin-cam

Free cam for administrators with the option to fix to players.

# V0.3 Preview Video

[Example video (V0.3.3)](https://streamable.com/wrg91e)

## V0.3.3

- Camera is moving relative to its heading
  - Huge UX impact, finally usable! :D

# Commands

| Command         | Arguments                 | Description                 |
| --------------- | ------------------------- | --------------------------- |
| /acam-getconfig |                           | Show current config in chat |
| /acam-setconfig | <config type> <new value> | Update a config             |

Available config types so far:

| Config Name       | Default Value | Description                                   |
| ----------------- | ------------- | --------------------------------------------- |
| mouse-look-sens   | 0.1           | Lookaround sensitivity for keyboard and mouse |
| gamepad-look-sens | 0.03          | Lookaround sensitivity for controllers        |
| movement-factor   | 0.001         | Movement speed factor                         |

# Controls

| Action     | Keycode | Key Name             | Keyboard    | Gamepad     | Comment       |
| ---------- | ------- | -------------------- | ----------- | ----------- | ------------- |
|            |         |                      |             |             |
| Left       | 30      | INPUT_MOVE_LR        | A           | LEFT STICK  | Val < 127     |
| Right      | 30      | INPUT_MOVE_LR        | D           | LEFT STICK  | Val > 127     |
| Forward    | 31      | INPUT_MOVE_UD        | W           | LEFT STICK  | Val < 127     |
| Backward   | 31      | INPUT_MOVE_UD        | S           | LEFT STICK  | Val > 127     |
|            |         |                      |             |             |
| Move Down  | 26      | INPUT_LOOK_BEHIND    | C           | R3          |               |
| Move Up    | 36      | INPUT_DUCK           | LEFT CTRL   | L3          |               |
|            |         |                      |             |             |
| Look Left  | 1       | INPUT_LOOK_LR        | MOUSE RIGHT | RIGHT STICK | Val < 127     |
| Look Right | 1       | INPUT_LOOK_LR        | MOUSE RIGHT | RIGHT STICK | Val > 127     |
| Look Up    | 2       | INPUT_LOOK_UD        | MOUSE DOWN  | RIGHT STICK | Val < 127     |
| Look Down  | 2       | INPUT_LOOK_UD        | MOUSE DOWN  | RIGHT STICK | Val > 127     |
|            |         |                      |             |             |
| Zoom In    | 71      | INPUT_VEH_ACCELERATE | W           | RT          | Trigger: Zoom |
| Zoom Out   | 72      | INPUT_VEH_BRAKE      | S           | LT          | Trigger: Zoom |

| Trigger Type | Keycode | Key Name     | Keyboard | Gamepad |
| ------------ | ------- | ------------ | -------- | ------- |
| Zoom         | 45      | INPUT_RELOAD | R        | B       |

_Trigger type = button to hold for referenced movement_

# TODO

- ~~Make free movable cam~~
- Create GUI to select players to watch (instead of using command)
- Test with players

Currently I'm only spawning a test ped inside a cop car which drives around. I need to attach it to actual players which should be as easy as selecting the player ped by id, so I want to wait until I get everything working properly since I can't just easily start up a second GTA instance to try it out on real players ^^

# control_ui

There is a `control_ui.js` file in the root of the project. This is a potential feature for the future, showing the controls the spectated player is pressing. Requires a little more work, but I am worried abt the resource usage as input data would need to be streamed to the server from all clients. Of course, the server could trigger the client to stream the data, I'm not quite sure if the client can detect it which could be abused by players.
