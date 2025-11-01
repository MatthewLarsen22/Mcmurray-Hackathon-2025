import css from '/css.mjs';
import state from '/state.mjs';

css(`
	tank-games {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		margin: auto;
	}

	tank-games > div:nth-child(2) {
		flex: 1;
		padding: 0.5rem;
		overflow-y: auto;
		border: thin solid  gray;
		border-radius: 0.5rem;
	}
`);

customElements.define('tank-games', class extends HTMLElement {
	#list = [];

	constructor(){
		super();
		document.addEventListener('ws-games', ev=>{
			this.#list = ev.detail.list;
			this.render();
		});
		state.queue.tx({ type: 'list' });
	}
	
	render() {
		this.innerHTML = `
			<div>Games:</div>
			<div>
				${this.#list.map(g=>`<tank-game>${g}</tank-game>`).join('\n')}
			</div>
			<button>New</button>
		`;
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
