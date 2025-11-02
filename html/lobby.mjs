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
	#list = [];

	constructor(){
		super();
		document.addEventListener('ws-connect', ev=>{
			state.me = ev.detail;
			this.render();
		});
		document.addEventListener('ws-lobby', ev=>{
			this.#list = ev.detail.games;
			this.render();
		});
	}
	
	render() {
		this.innerHTML = `
			<div class="flex">Name: <span class="flex-1 px-2">${state.me.name || ''}</span><button>🖉</button></div>
			<div>Games:</div>
			<div>
				${this.#list.map(g=>`<tank-game data-id="${g.id}">${g.id} (${g.players})</tank-game>`).join('\n')}
			</div>
			<button>New</button>
		`;

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
			state.ws.sendEvent('join', { game: this.getAttribute('data-id')});
		});
	}
});
