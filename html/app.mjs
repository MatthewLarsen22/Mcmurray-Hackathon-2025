import { signal, effect, untracked } from '/signals-core.mjs';
import css from '/css.mjs';
import state from '/state.mjs';
import ServerInterface from '/server-interface.mjs';
import '/lobby.mjs';
import '/game.mjs';

let stage = signal('lobby');
state.game = signal(null);

css(`
	tank-app{
		display: flex;
		align-items: stretch;
		height: 100vh;
	}
`);

customElements.define('tank-app', class extends HTMLElement {
	constructor(){
		super();
		state.ws = new ServerInterface( new WebSocket('/'));
		effect(_=> {
			const s = stage.value;
			untracked(_=> this.render(s));
		});
	}
	
	render(stage) {
		this.innerHTML = 'lobby' == stage
			? '<tank-lobby></tank-lobby>'
			: `
				<tank-terrain data-id="${stage}"></tank-terrain>
				<tank-game-window></tank-game-window>
			`;
	}
});

document.addEventListener('ws-game', ev=>{
	state.game.value = ev.detail;
	stage.value = ev.detail.id;
});
