const rootDir = './html';

let players = {};
let games = {};

function msg(type){
  return {
    header: {
      from: 'broker',
      ts: Date.now(),
      type
    }
  };
}

const server = Bun.serve({
  hostname: Bun.argv[2],
  port: Bun.argv[3],
  websocket: {
    data: {},
    open(ws){
      let id = Math.floor(10000 * Math.random());
      while ( Object.values(players).includes(id)){
        id = Math.floor(10000 * Math.random());
      }
      ws.data = {id, name: id};

      ws.send(JSON.stringify(Object.assign(msg('connect'), ws.data)));
      ws.subscribe('lobby');
      lobby();
    },

    close(ws){
      if (ws.data.game){
        ws.unsubscribe(ws.data.game);
        let game = games[ws.data.game];
        delete game.players[ws.data.id];
        console.log('players', Object.keys(game.players));
        if (! Object.keys(game.players).length) delete games[ws.data.game];
      }
    },

    message(ws, m){
      let data = JSON.parse(m);
      console.log('**** ws message ********', data);
      let x;

      switch (data.header.type) {
        case 'rename':
          ws.data.name = data.name;
          break;
        case 'create':
          const alphabet = 'ABCDEFGHIJKMNOPRSTUVXYZ';
          let id = '';
          for (let i=0; i<5; i++){
            let r = Math.floor(Math.random()*alphabet.length);
            id += alphabet[r];
          }
          ws.data.game = id;
          games[id] = {
            id,
            players: {[ws.data.id]: {
              name: ws.data.name,
              x: Math.random()
            }}
          };
          ws.unsubscribe('lobby');
          ws.subscribe(id);
          lobby();
          break;
        case 'join':
          if ( Object.keys(games).includes(data.game) ){
            ws.unsubscribe('lobby');
            ws.subscribe(data.game);
            ws.data.game = data.game;
            games[data.game].players[ws.data.id] = {
              name: ws.data.name,
              x: Math.random()
            };
            lobby();
          }
          break;
        case 'left':
          x = games[ws.data.game].players[ws.data.id].x - 0.01;
          games[ws.data.game].players[ws.data.id].x = (x+1) % 1;
          break;
        case 'right':
          x = games[ws.data.game].players[ws.data.id].x + 0.01;
          games[ws.data.game].players[ws.data.id].x = (x+1) % 1;
          break;
      }
    }
  },
  
  async fetch(req) {
    let url = new URL(req.url);
    if (server.upgrade(req)){
        return;
    }
    let path = new URL(req.url).pathname;
    //path.replace(/\.\.+/, '.')
    let file = Bun.file(rootDir+path);
    file = await file.stat()
      .then(stat => stat.isDirectory()
        ? Bun.file(rootDir + path + '/index.html')
        : file
      );
    return new Response(file);
  }
});

console.log(`Listening on ${server.hostname}:${server.port}`);

function lobby(){
  let keys = Object.keys(games);
  if (keys) {
    server.publish('lobby', JSON.stringify(Object.assign(msg('lobby'), {
      games: keys.map(id=>({
        id,
        players: Object.keys(games[id].players).length
      }))
    })));
  }
}
setInterval(_=>{
  for (let id of Object.keys(games)) {
    server.publish(id, JSON.stringify(Object.assign(msg('game'), games[id])));
  }
}, 200);
