const rootDir = './html';

let players = {};
let games = [
  {
    id: 'RSOTN',
    players: []
  },
  {
    id: 'YAGOT',
    players: []
  }
];

const server = Bun.serve({
  hostname: Bun.argv[2],
  port: Bun.argv[3],
  websocket: {
    open(ws){
      let id = Math.floor(10000 * Math.random());
      while ( Object.values(players).includes(id)){
        id = Math.floor(10000 * Math.random());
      }
      players[ws] = id;
      ws.send(JSON.stringify({
        from: 'broker',
        type: 'connect',
        ts: Date.now(),
        id
      }));
    },
    message(ws, msg){
      let data = JSON.parse(msg);
      Object.assign(data, {
        from: players[ws],
        ts: data.ts || Date.now()
      });
      switch (data.type) {
        case 'list':
          let list = {
            from: 'broker',
            type: 'games',
            ts: Date.now(),
            list: games.map(g=>g.id)
          };
          ws.send(JSON.stringify(list));
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
