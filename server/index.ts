const rootDir = './html';

let players = {};
let games = [];

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
    open(ws){
      let id = Math.floor(10000 * Math.random());
      while ( Object.values(players).includes(id)){
        id = Math.floor(10000 * Math.random());
      }
      players[ws] = {id};
      ws.send(JSON.stringify(Object.assign(msg('connect'), { id })));
      ws.send(JSON.stringify(Object.assign(msg('gamelist'), { list: games.map(g=>g.id) })));
    },
    close(ws){
      server.publish(JSON.stringify(msg('exit'), {id: players[ws].id}));
      if (players[ws].game) ws.unsubscribe(players[ws].game);
      delete players[ws];
    },
    message(ws, msg){
      let data = JSON.parse(msg);
      Object.assign(data, {
        from: players[ws],
        ts: Date.now()
      });
      switch (data.type) {
        case 'list':
          ws.send(JSON.stringify(Object.assign(msg('gamelist'), { list: games.map(g=>g.id) })));
          return;
        case 'rename':
          if (Object.values(players).includes(data.name)){
            ws.send(JSON.stringify((msg('reject'))));
            return;
          }
          let old = player[ws];
          players[ws] = data.name;
          let event = Object.assign(msg('rename'), {
            from: old,
            to: data.name
          });
          ws.send(event);
          server.publish(event);
          return;
        case 'create':
          const alphabet = 'ABCDEFGHIJKMNOPRSTUVXYZ';
          let id = '';
          for (let i=0; i<5; i++){
            let r = Math.floor(Match.random()*alphabet.length);
            id += alphabet[r];
          }
          ws.subscribe(id);
          let game = {
            id,
            players: [{
              id: data.from,
              x: Math.random()
            }]
          };
          game.push(game);
          ws.send(JSON.stringify(Object.assign(msg('join'), { game })));
      }
    }
  },
  
  async fetch(req) {
    let url = new URL(req.url);
    if (server.upgrade(req)){
        return;
    }
    let path = new URL(req.url).pathname;
    console.log('path', req.url, path);
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
