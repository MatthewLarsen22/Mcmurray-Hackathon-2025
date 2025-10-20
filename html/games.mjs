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
		state.ws.addEventListener('message', ev=>{
			console.log('websocket message', ev.data);
			const [cmd, list] = ev.data.split(' ',2);
			if ('games'==cmd) {
				this.#list = JSON.parse(list);
				this.render();
			}
		})
		state.ws.send("list");
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
		this.addEventListener('click', ev => state.game.value = this.innerHTML );
	}
});
