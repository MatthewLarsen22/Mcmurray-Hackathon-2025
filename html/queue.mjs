// Ping times to Logan, UT run 30-50ms
// Ping times to Chicago, IL run 60-75ms
// broker → Chicago → broker → me should be less than 200ms
const timeout = 200;

export default class {
  #me = null;
  #players = new Set();
  #q = [];
  #seen = [];
  #ws = null;

  constructor(ws){
    this.#ws = ws;
    ws.addEventListener('message', ev=> {
      let data = JSON.parse(ev.data);
      if ('connect' == data.type){
        this.#me = ev.data.id;
        document.dispatchEvent(new CustomEvent('ws-connect'))
      }
      ws.addEventListener('message', ev=>this.rx(ev));
    }, {once: true});
  }
  
  dispatch(msg){
    document.dispatchEvent(new CustomEvent(`ws-${msg.type}`, {detail: msg}));
  }

  rx(ev){
    let data = {
      event: JSON.parse(ev.data),
      ack: {
        required: this.#players,
        received: new Set()
      }
    };

    //prune seen events beyond timeout
    this.#seen.reduce((p,c, idx)=>{
      if (timeout < Date.now() - c.event.ts) {
        p.push(idx);
      }
      return p;
    }, []).forEach(idx=>this.#seen.splice(idx, 1));

    // ignore events that have timed out
    if (timeout < Date.now() - ev.data.ts) return;

    // ignore replay events
    if (this.#seen.find(e=>
      e.event.from == data.event.from
      && e.event.ts == data.event.ts
      && e.event.type == data.event.type
    )) return;
         
    // don't require originator to acknowledge
    // actually, nevermind. They should also acknowledge
    // data.ack.required.remove(data.event.from);

    switch (data.event.type){
      /*
      case 'games':
        this.dispatch(data.event);
        return;
      */
      case 'join':
        this.#players.add(data.event.from);
        this.#q.push(data);
        break;
      case 'exit':
        this.#players.remove(data.event.from);
        this.#q.forEach(msg=>{
          msg.ack.required.delete(data.event.from);
        })
        break;
      case 'ack':
        let found = this.#q.find(e=>
          e.event.from == data.event.from
          && e.event.ts == data.event.ts
          && e.event.type == data.event.type
        );
        if (-1 < found){ found.ack.received = data.event.from; }
        else { data = null; }
    }

    // Check if there is an ack waiting for this event
    let found = this.#q.findIndex(e=>
      'ack' == e.event.type
      && e.event.event.from == data.event.from
      && e.event.event.ts == data.event.ts
      && e.event.event.type == data.event.type
    );
    if (-1 < found) {
      data.ack.received.add(this.#q[found].event.event.from);
      this.#q.splice(found, 1);
    }
        
    // put event in queue
    if (data) {
      this.#q.push(data);
    }

    // shift all eligible items from queue
    while (this.#q.length){
      let candidate = this.#q[0];
      if (timeout < Date.now() - candidate.event.ts){
        this.#q.shift();
        continue;
      }
      else if (candidate.ack.required.values().every(r=>candidate.ack.received.has(e))){
        let success = this.#q.shift();
        this.#seen.push(success);
        document.dispatchEvent(new CustomEvent(`ws-${success.event.type}`, {detail: success.event}));
      }
      else {
        break;
      }
    }

    // resend items that are left
    this.#q.forEach(e=>{
      if (this.#me == e.event.from){
        this.tx(e.event);
      }
    });
  }

  tx(msg){
    this.#ws.send(JSON.stringify(msg));
  }
};
