export default class {
    #ws = null;
    #playerId = null;

    constructor(ws) {
        this.#ws = ws;
        this.#ws.addEventListener('message', e=> {
			let event = JSON.parse(e.data);
            if (event.header?.type === "connect") {
                this.#playerId = event.id;
            }
			document.dispatchEvent(new CustomEvent(`ws-${event.header?.type}`, {detail: event}));
		});
    }

    sendEvent(messageType, content) {
        let message = content;
        message.header = {
            from: this.#playerId,
            type: messageType,
            ts: Date.now()
        };

        this.#ws.send(JSON.stringify(msg));
    }
};