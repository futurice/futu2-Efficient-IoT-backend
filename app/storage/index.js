'use strict';
const Rx = require('rx');
const redis = require('redis');
const url = require('url');

class Storage {
  constructor() {
    this.client = connect();
    this.client.on('error', error => console.error(`Redis error: cache connection error: ${error}`));

    function connect(){
      let client;
      if (process.env.REDISTOGO_URL) {
        let prodRedis = url.parse(process.env.REDISTOGO_URL);
        client = redis.createClient(prodRedis.port, prodRedis.hostname);
        client.auth(prodRedis.auth.split(":")[1]);
      } else {
        client = redis.createClient();
      }
      return client;
    };

    this.set = message => {
      const observable = Rx.Observable.fromNodeCallback(this.client.set, this.client);
      const key = `${message.type}:${message.id}`;
      const value = JSON.stringify(message);
      return observable(key, value)
          .map(x => {
            console.log(`Redis: saved ${key}`);
            return message; // return original message
          })
          .doOnError(error => console.error(`Redis error: Storage.set(${key}) -> ${error}`));
    };

    this.keys = () => {
      const observable = Rx.Observable.fromNodeCallback(this.client.keys, this.client);
      return observable('*')
        .doOnError(error => console.error(`Redis error: Storage.keys -> ${error}`));
    };

    this.get = key => {
      const observable = Rx.Observable.fromNodeCallback(this.client.get, this.client);
      return observable(key)
        .doOnError(error => console.error(`Redis error: Storage.get(${key}) -> ${error}`));
    };

    this.getAll = () => {  // TODO: needs improvements -- ugly code
      const keys =
        this.keys()
          .flatMap(keys => {
            return keys
              .map(
                key => this.get(key).map(val => {
                  console.error(`Redis: Storage.getAll fetched ${key}`);
                  return JSON.parse(val);
                })
              );
          });

      return Rx.Observable.combineLatest(
        keys,
        (vals) => vals
        )
        .flatMap(vals => vals)
        .bufferWithCount(100)
        .doOnError(error => console.error(`Redis error: Storage.getAll(${key}) -> ${error}`));
    };
  }
}


module.exports = Storage;

