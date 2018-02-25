import { StringAnyMap } from './ts-helpers/common-interfaces';

export class Storage {
    currentGame: string;
    gameKey: string;

    saveQueued: StringAnyMap;

    constructor() {
        this.saveQueued = {};
    }

    setGame(name: string) {
        this.currentGame = name;
        this.gameKey = name.toLowerCase().split(' ').join('-');
    }

    setItem(key: string, value: Object, useGameKey = false) {
        const lsKey = this.getLSKey(key, useGameKey);
        localStorage.setItem(lsKey, JSON.stringify(value));
    }

    getItem(key: string, useGameKey = false) {
        const lsKey = this.getLSKey(key, useGameKey);
        const value = localStorage.getItem(lsKey);
        return JSON.parse(value);
    }

    // Advanced methods
    queueSave(key: string, value: Object, timeout = 1000, useGameKey = false) {
        const lsKey = this.getLSKey(key, useGameKey);
        const currentValue = this.saveQueued[lsKey];
        this.saveQueued[lsKey] = value;
        if (currentValue === undefined) {
            setTimeout((e) => this.queuedSaveExecute(e), timeout, lsKey);
        }
    }

    queuedSaveExecute(key: string) {
        this.setItem(key, this.saveQueued[key], false);
        delete this.saveQueued[key];
    }

    restoreSave(key: string, defaultValue = null, useGameKey = false) {
        const value = this.getItem(key, useGameKey);
        if (value === null) {
            return defaultValue;
        } else {
            return value;
        }
    }

    private getLSKey(key: string, useGameKey: boolean) {
        return (useGameKey ? this.gameKey + '-' : '') + key;
    }

}

export let storage = new Storage();