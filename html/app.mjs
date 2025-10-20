import { signal, effect } from '/signals-core.mjs';
import css from '/css.mjs';
import state from '/state.mjs';
import '/games.mjs';

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
		state.ws = new WebSocket('/');
		state.ws.addEventListener('open', ev=>{
			effect($_=>this.render(state.game.value))
		});
	}
	
	render(game) {
		this.innerHTML = 'lobby' == state.game
			? '<tank-games></tank-games>'
			: `<tank-game data-id="${game}"></tank-game>`;
	}
});
