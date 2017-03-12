
module.exports = pkg => ({
    description: pkg.description,
    env: {
        pattern: {
            description: 'the matching pattern for Redis scan',
            example: '*'
        },
        command: {
            description: 'the command to perform',
            options: ['del', 'hkeys', 'hgetall', 'llen', 'hget', 'ttl', 'type', 'expire', 'persist'],
            default: 'none'
        },
        field: {
            description: 'the field name for hashes',
            requiredEnv: env => ['hget'].includes(env.command)
        },
        ttl: {
            description: 'the TTL for expire command',
            unit: 's',
            requiredEnv: env => ['expire'].includes(env.command)
        },
        limit: {
            description: 'the maximum number of keys to print',
            note: 'zero means unlimited',
            default: 30
        },
        port: {
            description: 'the Redis host port',
            default: 6379
        },
        host: {
            description: 'the Redis host address',
            default: 'localhost'
        },
        password: {
            description: 'the Redis host password',
            required: false
        },
        min: {
            description: 'the minimum value to filter keys e.g. TTL',
            type: 'integer',
            required: false
        },
        max: {
            description: 'the maximum value to filter keys e.g. TTL',
            type: 'integer',
            required: false
        },
        format: {
            description: 'the format to print the key and optional details',
            required: false,
            options: ['verbose', 'terse'],
            default: 'verbose',
        },
        hkeysLimit: {
            description: 'the maximum number of hkeys to print',
            note: 'zero means unlimited',
            default: 8
        },
        logging: {
            description: 'the logging level',
            default: 'info'
        }
    },
    development: {
        logging: 'debug'
    }
});
