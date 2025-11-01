import { signal, effect } from '/signals-core.mjs';
import css from '/css.mjs';
import state from '/state.mjs';
import Queue from '/queue.mjs';
import '/games.mjs';
import '/game.mjs';

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
		state.game = signal('lobby');
		document.addEventListener('ws-connect', ev=> effect($_=>
			this.render(state.game.value))
		);
		state.queue = new Queue(new WebSocket('/'));
	}
	
	render(game) {
		this.innerHTML = 'lobby' == state.game
			? '<tank-games></tank-games>'
			: `<tank-game-window data-id="${game}"></tank-game-window>`;
	}
});
