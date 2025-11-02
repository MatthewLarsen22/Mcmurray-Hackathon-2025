import css from '/css.mjs';
import { createNoise2D } from "/not_node/simplex-noise.mjs"
import "/not_node/alea.mjs"
import state from '/state.mjs';
import { signal, effect } from '/signals-core.mjs';

const TERRAIN_RANGE = .74; // The noise X used for terrain
const HOUSING_RANGE = .45; // The noise Y used for wind
const WIND_RANGE = .23; // The noise Y used for wind
const
  HILL_HEIGHT = 8,
  HILL_WIDTH = 1
  ;


function heightmap(noise, dimensions) {
    const _k = Array.from({ length: dimensions.w }).map((_, ix) => ix);
    const AIR_GAP = (dimensions.h * 0.2); // top 1/5 of the stage needs to be air
    const HILL_AREA = (dimensions.h * 0.7); // The area in which hills can exist, leaving some terrain always at the bottom
    const hillScale = (HILL_HEIGHT / 10);
    const _t = Object.fromEntries(_k.map((ix) => [
        ix.toFixed(0),
        (
            /*
                Noise ranges from [-1, 1], so we need to offset it and divide by two to get [0, 1]
                Scale that to 9/10 of the play area. Since we dray with y inverted, this leaves the bottom of the stage clear
                
            */
            AIR_GAP // Leave the top of the field empty
            + HILL_AREA // Go all the way to the "ground"
            - ( // Move back "up" the hill amount, scaled.
                ((noise(TERRAIN_RANGE, ix / dimensions.w * 4 / HILL_WIDTH) + 1) / 2) // Noise (converted from range [-1, 1] to range [0,1])
                * hillScale * HILL_AREA
            )
        )
    ]));
    return {
        get(x) {
            const _snapped = Math.round(x).toFixed(0)
            return _t[_snapped];
        },
        all() {
            return Object.entries(_t)
        }
    }
}


css(`
  tank-game-window{
    position: fixed;
    top: 0;
    left: 0;
  }
`);

customElements.define('tank-game-window', class extends HTMLElement {
    #me = null;
    #width = 800;
    #height = 600;
    inputBuffer = {};
    
    constructor() {
        super();
        let game = state.game.value;
        this.#me = game.players[state.me.id];
        const seed = window.Alea(game.id);
        const noise = createNoise2D(seed);
    this.heightmap = heightmap(noise, {w: this.#width, h: this.#height});

        console.log("Le Game:", game, state.me)

        this.assets = {};
        const tankImage = new Image();
        tankImage.src = "/assets/Tank.png";
        tankImage.onload = () => this.assets.tank = tankImage
        const barrelImage = new Image();
        barrelImage.src = "/assets/Barrel.png";
        barrelImage.onload = () => this.assets.barrel = barrelImage;
        const basicShotImage = new Image();
        basicShotImage.src = "/assets/Basic_Shot.png";
        basicShotImage.onload = () => this.assets.shot = basicShotImage;
        const house1Image = new Image();
        house1Image.src = "/assets/House_1.png";
        house1Image.onload = () => this.assets.house1 = house1Image;
        
        document.addEventListener('keydown', ev=>{
          this.processInputs(ev);
          state.game.value = game;
        });

        effect(_=> this.render(state.game.value) );
        //requestAnimationFrame(renderLoop);
    }

    renderLoop() {
        this.processInputs();
        this.render();
        requestAnimationFrame(renderLoop);
    }

    processInputs(ev) {
        console.log('keypress');
        switch (ev.key) {
            case 'a':
                state.ws.sendEvent('left');
                this.#me.x -= 0.01;
                break
            case 'd':
                state.ws.sendEvent('right');
                this.#me.x += 0.01;
                break;
        }

        this.#me.x = (this.#me.x + 1) % 1;
    }

    render(game) {
      console.log('rendering...');
        this.innerHTML = `<canvas id='mygame' width='${this.#width}' height='${this.#height}'></canvas>`;
        let ctx = this.firstElementChild.getContext('2d');
                
        ctx.clearRect(0, 0, this.#width, this.#height);

        if (this.assets.tank && this.assets.barrel && this.assets.shot) {
            const tankImg = this.assets.tank;
            const barrelImg = this.assets.barrel;
            const shotImg = this.assets.shot;

            // console.log('players', game.players);
            Object.keys(game.players).forEach((t, ix, arr) => {

                ctx.filter = `hue-rotate(${360 * ix / arr.length}deg)`;
                
                const { x: u_x } = game.players[t],
                    x = u_x * this.#width,
                    y = this.heightmap.get(x)
                    ;

                // Render Barrel
                ctx.save();
                ctx.translate(x, y - tankImg.height * .9);
                ctx.rotate((Date.now() / 1000 + 1 * ix) % (Math.PI * 2)); // Rotates CANVAS, not the image. So have to reverse it.
                ctx.drawImage(barrelImg, -8, -barrelImg.height / 2);
                ctx.restore();


                // Render Tank
                ctx.drawImage(tankImg, x - tankImg.width / 2, y - tankImg.height);

            });

            ctx.filter = 'none';
        }
    }
});

css(`
  tank-terrain {
    position: fixed;
    top: 0;
    left: 0;
  }
`);

customElements.define('tank-terrain', class extends HTMLElement {
  #context = null;
  #width = 800;
  #height = 600;

  constructor(){
    super();
    let seed = window.Alea(this.getAttribute('data-id'));
    let noise = createNoise2D(seed);
    this.heightmap = heightmap(noise, {w: this.#width, h: this.#height});
    this.render();
  }

  render(){
    this.innerHTML = `<canvas id='mygame' width='${this.#width}' height='${this.#height}'></canvas>`;
    let ctx = this.firstElementChild.getContext('2d');
    let fieldFill = ctx.createLinearGradient(0, this.#height, 0, 0);
    fieldFill.addColorStop(0, 'green');
    fieldFill.addColorStop(1, 'lightgreen');
    ctx.clearRect(0, 0, this.#width, this.#height);
    ctx.strokeStyle = "green";
    ctx.lineWidth = 4;
    ctx.fillStyle = fieldFill;
    ctx.beginPath();
    ctx.moveTo(0, this.#height);
    this.heightmap.all().forEach(([x, y]) => {
        console.log('x:', x, 'y:',y);
        ctx.lineTo(x, y)
    });
    ctx.lineTo(this.#width, this.#height);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
  }
});
