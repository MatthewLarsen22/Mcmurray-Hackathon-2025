import state from '/state.mjs';

export default class {
    #ws = null;

    constructor(ws) {
        this.#ws = ws;
        this.#ws.addEventListener('message', e=> {
            const event = JSON.parse(e.data);
            console.log('ws message event', event);
            document.dispatchEvent(new CustomEvent(`ws-${event.header?.type}`, {detail: event}));
    		});
    }

    sendEvent(messageType, content) {
        const message = Object.assign({}, content, {
            header: {
                from: state.me.id,
                type: messageType,
                ts: Date.now()
            }
        });

        this.#ws.send(JSON.stringify(message));
    }
};
