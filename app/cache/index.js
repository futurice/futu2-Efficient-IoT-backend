'use strict';
const Rx = require('rx');
const redis = require('redis');
const url = require('url');
const { MESSAGE_TTL } = require('config');

class Cache {

  constructor() {
    this.createConnection();
  }

  createConnection() {
    let redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      this.client = redis.createClient(redisUrl);
    } else {
      this.client = redis.createClient();
    }
    this.client.on('error', logError(error => `Redis error: cache connection error: ${error}`));
  }

  set(message) {
    const expiresInSeconds = MESSAGE_TTL[message.type] || MESSAGE_TTL.default;
    const key = `${message.type}:${message.id}`;
    const multi = this.client
      .multi()
      .set(key, JSON.stringify(message), redis.print)
      .expire(key, expiresInSeconds)
      .get(key);
    const observable = Rx.Observable.fromNodeCallback(multi.exec, multi);
    return observable()
      .map(([setStatus, ttlStatus, message]) => JSON.parse(message))
      .doOnError(logError(error => `Redis error: Cache.set(${key}): ${error}`));
  }

  getInitData() {
    const keys =
      this.keys()
        .flatMap(keys => keys.map(this.get.bind(this)));

    return keys
      .flatMap(values => values)
      .bufferWithCount(1000)
      .doOnError(logError(error => `Redis error: Cache.getAll -> ${error}`));
  }

  keys() {
    const observable = Rx.Observable.fromNodeCallback(this.client.keys, this.client);
    return observable('*')
      .map(log(`Redis: Cache.keys fetched`))
      .doOnError(logError(error => `Redis error: Cache.keys(): ${error}`));
  }

  get(key) {
    const observable = Rx.Observable.fromNodeCallback(this.client.get, this.client);
    return observable(key)
      .map(JSON.parse)
      .map(log(`Redis: Cache.get fetched "${key}"`))
      .doOnError(logError(error => `Redis error: Cache.get(${key}): ${error}`));
  }
}

function log(message) {
  return function (values) {
    console.log(message);
    return values;
  };
}

function logError(func) {
  return function (error) {
    console.error(func(error));
    return error;
  };
}

module.exports = Cache;
