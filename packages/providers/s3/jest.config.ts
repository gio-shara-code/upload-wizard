import config from 'test-config'

export default {
    ...config,
    setupFiles: [...(config.setupFiles ?? []), './__test__/setup-env-vars.ts'],
}
