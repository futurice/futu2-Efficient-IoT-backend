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
      this.client = redis.createClient(6379, 'localhost');
    }
    this.client.on('error', error => console.error(`Redis error: cache connection error: ${error}`));
  }

  get(key) {
    const observable = Rx.Observable.fromNodeCallback(this.client.get, this.client);
    return observable(key)
      .map(val => {
        console.log(`Redis: Cache.get fetched "${key}"`);
        return JSON.parse(val);
      })
      .doOnError(error => console.error(`Redis error: Cache.get(${key}) -> ${error}`));
  }

  expire(key, seconds) {
    const observable = Rx.Observable.fromNodeCallback(this.client.expire, this.client);
    return observable(key, seconds)
      .map(val => {
        console.log(`Redis: Cache.expire ${seconds} seconds for "${key}"`);
        return val;
      })
      .doOnError(error => console.error(`Redis error: Cache.expires(${key},${seconds}) -> ${error}`));
  }

  set(message) {
    const expiresInSeconds = MESSAGE_TTL[message.type] || MESSAGE_TTL.default;
    const observable = Rx.Observable.fromNodeCallback(this.client.set, this.client);
    const key = `${message.type}:${message.id}`;
    return observable(key, JSON.stringify(message))
      .map(status => {
        console.log(`Redis: Cache.set saved "${key}"`);
        return status;
      })
      .zip(this.expire(key, expiresInSeconds))
      .zip(this.get(key))
      .map(([statusAndExpire, dbValue]) => {
        console.log(`Redis: Cache.set got "${key}"`);
        return dbValue;
      })
      .doOnError(error => console.error(`Redis error: Cache.set(${key}) -> ${error}`));
  }

  keys() {
    return Rx.Observable.fromNodeCallback(this.client.keys, this.client)('*')
      .map(keys => {
        console.log(`Redis: Cache.keys fetched -> ${keys}`);
        return keys;
      })
      .doOnError(error => console.error(`Redis error: Cache.keys -> ${error}`));
  }

  getAll() {  // TODO: needs improvements -- ugly code
    const keys =
      this.keys()
        .flatMap(keys => keys.map(key => this.get(key)));

    return Rx.Observable.combineLatest(
      keys,
      values => values
      )
      .flatMap(vals => vals)
      .bufferWithCount(1000)
      .doOnError(error => console.error(`Redis error: Cache.getAll -> ${error}`));
  }
}

module.exports = Cache;
