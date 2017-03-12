
const clc = require('cli-color');

const redisTypes = ['hash', 'list', 'set', 'string', 'zset'];

const anyType = 'key';

const filterKeysType = async (keys, type) => {
    if (type === anyType) {
        return keys;
    }
    const types = await multiExecAsync(client, multi => {
        keys.forEach(key => multi.type(key));
    });
    return keys.filter((key, index) => (
        types[index] === type
    ));
}

const getTypeCommand = command => {
    if (['del', 'type', 'ttl', 'persist', 'expire', 'none'].includes(command)) {
        return anyType;
    }
    if (command[0] === 'l') {
        return 'list';
    }
    if (command[0] === 'h') {
        return 'hash';
    }
    if (command[0] === 'z') {
        return 'zset';
    }
    if (['scard'].includes(command)) {
        return 'set';
    }
    throw new Error(`Missing type for command ${command}`);
}

const getCommand = config => {
    if (config.command === 'none') {
        if (config.field) {
            return 'hget';
        }
    }
    return config.command;
}

module.exports = async context => {
    let count = 0;
    let scanCount = 0;
    let cursor;
    let command = getCommand(config);
    const type = config.type || getTypeCommand(command);
    while (true) {
        const [result] = await multiExecAsync(client, multi => {
            multi.scan(cursor || 0, 'match', config.pattern);
        });
        cursor = parseInt(result[0]);
        const scannedKeys = result[1];
        scanCount += scannedKeys.length;
        const keys = await filterKeysType(scannedKeys, type);
        count += keys.length;
        if (config.field) {
            const results = await multiExecAsync(client, multi => {
                keys.forEach(key => multi.hget(key, config.field));
            });
            keys.forEach((key, index) => {
                const hvalue = results[index];
                if (hvalue !== null) {
                    console.log([clc.cyan(key), hvalue].join(' '));
                }
            });
        } else if (command === 'del') {
            const results = await multiExecAsync(client, multi => {
                keys.forEach(key => {
                    console.log(clc.blue(key));
                    multi.del(key);
                });
            });
        } else if (config.command === 'hkeys') {
            const results = await multiExecAsync(client, multi => {
                keys.forEach(key => multi.hkeys(key));
            });
            keys.forEach((key, index) => {
                const hkeys = results[index];
                if (hkeys.length > config.hkeysLimit) {
                    console.log([hkeys.length, clc.cyan(key), hkeys.slice(0, config.hkeysLimit).join(' '), '...'].join(' '));
                } else {
                    console.log([hkeys.length, clc.cyan(key), hkeys.join(' ')].join(' '));
                }
            });
        } else if (config.command === 'hgetall') {
            const results = await multiExecAsync(client, multi => {
                keys.forEach(key => multi.hgetall(key));
            });
            keys.forEach((key, index) => {
                const hgetall = results[index];
                console.log(clc.cyan.bold(key));
                Object.keys(hgetall).forEach(hkey => {
                    const hvalue = hgetall[hkey];
                    console.log([clc.cyan(hkey), hvalue].join(' '));
                });
            });
        } else if (config.command === 'llen') {
            const results = await multiExecAsync(client, multi => {
                keys.forEach(key => multi.llen(key));
            });
            keys.forEach((key, index) => {
                const llen = results[index];
                console.log([llen, clc.cyan(key)].join(' '));
            });
        } else if (config.command === 'type') {
            const results = await multiExecAsync(client, multi => {
                keys.forEach(key => multi.type(key));
            });
            keys.forEach((key, index) => {
                const type = results[index];
                console.log([type, clc.cyan(key)].join(' '));
            });
        } else if (config.command === 'expire') {
            const results = await multiExecAsync(client, multi => {
                keys.forEach(key => multi.expire(key, config.ttl));
            });
            keys.forEach((key, index) => {
                const res = results[index];
                console.log([res, clc.cyan(key)].join(' '));
            });
        } else if (config.command === 'persist') {
            const results = await multiExecAsync(client, multi => {
                keys.forEach(key => multi.persist(key));
            });
            keys.forEach((key, index) => {
                const res = results[index];
                console.log([res, clc.cyan(key)].join(' '));
            });
        } else if (config.command === 'ttl') {
            const results = await multiExecAsync(client, multi => {
                keys.forEach(key => multi.ttl(key));
            });
            keys.forEach((key, index) => {
                const ttl = results[index];
                if (config.min >= 0 && ttl < config.min) {
                } else if (config.max && ttl > config.max) {
                } else {
                    console.log([ttl, key].join(' '));
                }
            });
        } else {
            await multiExecAsync(client, multi => {
                keys.forEach(key => {
                    console.log(clc.cyan(key));
                });
            });
        }
        if (config.limit > 0 && count > config.limit) {
            console.error([
                clc.yellowBright.bold(`Limit ${config.limit} exceeded, having counted ${count} keys.`),
                clc.yellow(`Try: limit=0`)
            ].join(' '));
            break;
        }
        if (cursor === 0) {
            console.error([
                clc.blackBright(`Scan of ${scanCount} keys completed. Counted ${count} matching keys.`)
            ].join(' '));
            break;
        }
    }
}
