/** Functionality related to chatting. */

// Room is an abstraction of a chat channel
const Room = require('./Room');

/** ChatUser is a individual connection from client -> server to chat. */

class ChatUser {
  /** make chat: store connection-device, rooom */

  constructor(send, roomName) {
    this._send = send; // "send" function for this user
    this.room = Room.get(roomName); // room user will be in
    this.name = null; // becomes the username of the visitor

    console.log(`created chat in ${this.room.name}`);
  }

  /** send msgs to this client using underlying connection-send-function */

  send(data) {
    try {
      console.log('we are in user send', data)
      this._send(data);
    } catch {
      // If trying to send to a user fails, ignore it
    }
  }

  /** handle joining: add to room members, announce join */

  handleJoin(name) {
    this.name = name;
    this.room.join(this);
    this.room.broadcast({
      type: 'note',
      text: `${this.name} joined "${this.room.name}".`
    });
  }

  /** handle a chat: broadcast to room. */

  handleChat(text) {
    this.room.broadcast({
      name: this.name,
      type: 'chat',
      text: text
    });
  }

  /** Handle messages from client:
   *
   * - {type: "join", name: username} : join
   * - {type: "chat", text: msg }     : chat
   */

  handleMessage(jsonData) {
    let msg = JSON.parse(jsonData);
    console.log('we are in handling message, jsondata is', jsonData)
    if (msg.type === 'join') this.handleJoin(msg.name);
    else if (msg.text === '/joke') {
      this.handleJoke("KnockKnock!")

    } else if (msg.type === 'displayAll') {
      this.displayMembers()
    } else if (msg.type === "private") {
      console.log('we are in private ')
      this.privateMsg(msg.text)
    }
    else if (msg.type === 'chat') this.handleChat(msg.text);

    else throw new Error(`bad message: ${msg.type}`);
  }

  privateMsg(text) {
    const msgArr = text.split(" ");
    const name = msgArr[0]
    const msg = msgArr[1]

    //get user 
    let result = this.room.find(name)
    if (result != 'none') {
      //member found

      result.send(JSON.stringify({
        name: this.name,
        type: 'chat',
        text: `private text: ${msg}`
      }))
    }
  }

  displayMembers() {
    console.log('in display members in user class')
    let memberList = ''
    for (let member of this.room.members) {
      console.log('name is', member.name)
      memberList += member.name + ', '
    }
    this.send(JSON.stringify({
      name: this.name,
      type: 'chat',
      text: memberList
    }))
  }

  handleJoke(text) {
    console.log('text is', text)
    this.send(JSON.stringify({
      name: this.name,
      type: 'chat',
      text: text
    }))
  }

  /** Connection was closed: leave room, announce exit to others */

  handleClose() {
    this.room.leave(this);
    this.room.broadcast({
      type: 'note',
      text: `${this.name} left ${this.room.name}.`
    });
  }
}

module.exports = ChatUser;
