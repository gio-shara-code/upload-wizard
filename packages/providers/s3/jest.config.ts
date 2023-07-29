import config from 'test-config'

export default {
    ...config,
    setupFiles: [...(config.setupFiles ?? []), './__test__/setup-env-vars.ts'],
    globalSetup: './__test__/global-setup.ts',
    globalTeardown: './__test__/global-teardown.ts',
}
