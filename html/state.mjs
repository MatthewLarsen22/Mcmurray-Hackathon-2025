let msg = [];

export const bus = {
  send(obj){
    let id = '' + Date.now() + Math.floor(10000 * Math.random());
    msg[id] = obj;
    return id;
  },

  consume(id){
    let val = msg[id];
    delete msg[id];
    return val;
  }
};

export default {};
