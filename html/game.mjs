
import css from '/css.mjs';
import { createNoise2D } from "/not_node/simplex-noise.mjs"
import "/not_node/alea.mjs"
import state from '/state.mjs';
import { signal, effect } from '/signals-core.mjs';

const PLAY_WIDTH = window.innerWidth,
    PLAY_HEIGHT = window.innerHeight,
    HILL_HEIGHT = 8,
    HILL_WIDTH = 1
;


css(`
	tank-game-window{
        width: ${PLAY_WIDTH}px;
        height: ${PLAY_HEIGHT}px;
	}
`);


function heightmap(noise){
    const TERRAIN_RANGE = .74;
    const _k = Array.from({length: PLAY_WIDTH}).map((_, ix) => ix);
    const AIR_GAP = (PLAY_HEIGHT * 0.2); // top 1/5 of the stage needs to be air
    const HILL_AREA = (PLAY_HEIGHT * 0.7); // The area in which hills can exist, leaving some terrain always at the bottom
    const hillScale = (HILL_HEIGHT / 10);
    const _t = Object.fromEntries(_k.map((ix) => [
        ix,
        /*
            Noise ranges from [-1, 1], so we need to offset it and divide by two to get [0, 1]
            Scale that to 9/10 of the play area. Since we dray with y inverted, this leaves the bottom of the stage clear
            
        */
        AIR_GAP // Leave the top of the field empty
        + HILL_AREA // Go all the way to the "ground"
        - ( // Move back "up" the hill amount, scaled.
            ((noise(TERRAIN_RANGE, ix / PLAY_WIDTH * 4 / HILL_WIDTH) + 1) / 2 ) // Noise (converted from range [-1, 1] to range [0,1])
            * hillScale * HILL_AREA
        )
    ]));
    return {
        get(x){
            const u = Math.round(x * PLAY_WIDTH);
            return _t[u];
        },
        all(){
            return Object.entries(_t)
        }
    }

}

customElements.define('tank-game-window', class extends HTMLElement {
	constructor(){
		super();
        this._seed = null;
        this.terrain = null;

        effect(
            () => {
                this._seed = window.Alea(state.game.value);
                this._noise = createNoise2D(this._seed);
                this.innerHTML=`<canvas id='mygame' width='${PLAY_WIDTH}' height='${PLAY_HEIGHT}'></canvas>`;
                this.canvas = document.querySelector("canvas#mygame");
                this.context = this.canvas.getContext('2d');
                this.fieldFill = this.context.createLinearGradient(0, PLAY_HEIGHT, 0, 0);
                this.fieldFill.addColorStop(0, 'green');
                this.fieldFill.addColorStop(1, 'lightgreen');
                this.heightmap = heightmap(this._noise);
            }
        )

        const renderLoop = () => {
            this.render();
            requestAnimationFrame(renderLoop);
        }


        requestAnimationFrame(renderLoop);
	}
	
	render() {
        this.context.strokeStyle="green";
        this.context.lineWidth=4;
        this.context.fillStyle=this.fieldFill;
        this.context.beginPath();
        this.context.moveTo(0, PLAY_HEIGHT);
        this.heightmap.all().forEach(([x,y]) => {
            this.context.lineTo(x,y)
        })
        this.context.lineTo(PLAY_WIDTH, PLAY_HEIGHT);
        this.context.closePath();
        this.context.stroke();
        this.context.fill();
	}
});