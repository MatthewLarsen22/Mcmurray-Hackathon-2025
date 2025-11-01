import css from '/css.mjs';
import state from '/state.mjs';

css(`
	tank-lobby {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		margin: auto;
	}

	tank-lobby > div:nth-child(3) {
		flex: 1;
		padding: 0.5rem;
		overflow-y: auto;
		border: thin solid  gray;
		border-radius: 0.5rem;
		min-height: 2rem;
	}

	tank-lobby .flex { display: flex }
	tank-lobby .flex-1 { flex: 1 }
	tank-lobby .px-2 { padding: 0 0.5rem }
`);

customElements.define('tank-lobby', class extends HTMLElement {
	#name = null;
	#list = [];

	constructor(){
		super();
		document.addEventListener('ws-connect', ev=>{
			console.log('ws-connect', ev.detail);
			this.#name = ev.detail.id;
			this.render();
		});
		document.addEventListener('ws-gamelist', ev=>{
			console.log('ws-gamelist', ev.detail);
			this.#list = ev.detail.list;
			this.render();
		});
	}
	
	render() {
		this.innerHTML = `
			<div class="flex">Name: <span class="flex-1 px-2">${this.#name || ''}</span><button>🖉</button></div>
			<div>Games:</div>
			<div>
				${this.#list.map(g=>`<tank-game>${g}</tank-game>`).join('\n')}
			</div>
			<button>New</button>
		`;

		document.addEventListener('ws-join', ev=>{
			console.log('ws-join', ev.detail);
			state.me = ev.detail.game.players[0].id;
			state.game.value = ev.detail.game;
		})
 		this.lastElementChild.addEventListener('click', _=> state.ws.sendEvent( 'create' ) );
	}
});

css(`
	tank-game {
		display: block;
		cursor: default;
		padding: 0 0.5rem;
	}

	tank-game:hover {
		background-color: #DDD;
	}
`);

customElements.define('tank-game', class extends HTMLElement {
	constructor(){
		super();
		this.addEventListener('click', ev => {
			state.game.value = this.innerHTML;

			state.game.inputBuffer = {};
			document.addEventListener('keydown', ev=> {
				state.game.inputBuffer[ev.key] = new Date(Date.now()).toJSON();
			});
			document.addEventListener('keyup', ev=> {
				delete state.game.inputBuffer[ev.key];
			});
		});
	}
});
