# Event Data

Event data can be serialized as Protobuf, TOML, JSON, or whatever. For our purposes, JSON makes sense.

## Event headers

Each event needs to have a header. The header will contain common properties required to process any event. Two obvious properties are `from` and `type`.

### Event origin

Each event will have a `from` property. This is the player who spawned the event.

### Event tick

Each event will have a `tick` property. This will indicate the game tick in which it was spawned by the originating client. This allows us to marshall events and process them in the same order on each client.

### Event type

Each event will have a `type` property. For instance, when a new player enters a game, the server should send a `join` event to all existing players. Players might spawn `missile` or `shield` events.

One event type will be `ack`. Each client will send an `ack` event whenever it receives a non-`ack` event.

# Event Queue

All events will be queued by each client. This includes locally-generated events. Events remain in the queue until they have been acknowledged by all players. Once they have been universally acknowledged, they are released from the queue into gameplay. `ack` events themselves are not released into gameplay. Three event types affect queue management.

- `ack`
- `join`
- `exit`

These will be explained later.

## Queue wrapper

Each event is wrapped when it is placed in the queue. A queued event contains two root properties.

- `ack`
- `event`

The `event` property contains the event as it was received.

The `ack` property includes the following sub-properties:

- `expect`
- `received`

The `expect` property is a list of players at the time theh event was received. The `received` property is a list of players that have acknowledged the event.

### Expected acknowledgements

Each client will keep track of the list of active players. When a client receives a `join` event, it immediately adds the originating player of the `join` event to its list of active players. It does not wait for the `join` event to be acknowledged before adding the player to the list of players for the queue. Any event queued after a player joins must be acknowleged by that player to be released from the queue.

When a client receives an `exit` event, it immediately removes the originating player from the list of active players for the queue. Additionally, it removes the player from the `ack.expect` property of all queued events.

### Received acknowledgements

An `ack` event includes an `event` property that identifies the event being acknowledged. The event property contains three sub-properties cloned from the originl event.

- `from`
- `tick`
- `type`

When a client receives an `ack` event, it will search its queue for existing events that match these properties. For any matching events, the list of received acknowlegements will be amended.

When the event with the oldest tick in the queue has received an `ack` from each entry of its

## Resending events

When a client receives an event it resends any queued event that originated from itself that is older than the incoming event.

## Avoiding replay

Events that leave the queue must be remembered until they would have naturally timed out. This is necessary to avoid replaying the event. Events that have already entered gameplay should not be re-queued. Events that have timed out before they arrive should not be queued.

## Leaving the queue

Events leave the queue according to age. With the exception of `ack` events, no event can leave the queue before an older event. The oldest event in the queue leaves the queue under the following conditions:

### Universal acknowlegment

All players in the event's `expect` property are present in the event's `received` property. An `ack` is sent for the event. The event is moved to the remembered list. The event is entered into gameplay on the tick.

### Timed out

The event's age exceeds the remember window and it has not been universally acknowledged. In this case the event is discarded without entering gameplay.

### `ack` events

`ack` events are not queued if they arrive after the event they acknowledge. If they arrive before the original event, they are queued until that event arrives. They are removed immediately when the original event arrives. `ack` events are the only event that can leave the queue out of order. They are not remembered after they are removed.
