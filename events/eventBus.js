// events/eventBus.js
// ONE shared EventEmitter for the whole application.
// Any file can announce ("emit") an event on it, and any file can listen ("on") for it.
// The code that emits an event does not know or care who is listening.

const EventEmitter = require('events');

const eventBus = new EventEmitter();

module.exports = eventBus;
