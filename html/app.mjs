import { signal, effect } from '/signals-core.mjs';
import css from '/css.mjs';
import state from '/state.mjs';
import ServerInterface from '/server-interface.mjs';
import '/lobby.mjs';
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
		state.ws = new ServerInterface( new WebSocket('/'));
		this.render(state.game.value);
	}
	
	render(game) {
		this.innerHTML = 'lobby' == state.game
			? '<tank-lobby></tank-lobby>'
			: `<tank-game-window data-id="${game}"></tank-game-window>`;
	}
});
