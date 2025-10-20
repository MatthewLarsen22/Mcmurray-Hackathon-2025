const rootDir = './html';

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
  websocket: {
    open(ws){
      console.log('Open Websocket');
      ws.send("hello");
    },
    message(ws, msg){
      console.log('message', msg);
      let [verb, data] = msg.split(' ', 2);
      switch (verb) {
        case 'list':
          console.log('send game list');
          let list = games.map(g=>g.id);
          ws.send(`games ${JSON.stringify(list)}`);
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
