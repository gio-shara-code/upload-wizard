import { spawn, SpawnOptions } from 'child_process'

const childProcessWrapper = (
    command: string,
    args?: readonly string[],
    options?: SpawnOptions
) => {
    const childProcess = spawn(command, args, {
        cwd: __dirname,
        ...options,
    })

    return new Promise((resolve, reject) => {
        childProcess.stdout.on('data', (data) => {
            process.stdout.write(data.toString())
        })

        childProcess.stderr.on('data', (data) => {
            process.stdout.write(data.toString())
        })

        childProcess.on('close', (code) => {
            if (code === 0) {
                return resolve(void 0)
            } else {
                return reject(new Error(`exit code ${code}`))
            }
        })
    })
}

export const setupS3Mock = async () => {
    try {
        await childProcessWrapper('make', ['setup'], {
            timeout: 60 * 3 * 1000,
        })
    } catch (e) {
        throw new Error(`S3 mock setup failed, reason: ${e}`)
    }
}

export const teardownS3Mock = async () => {
    try {
        await childProcessWrapper('make', ['teardown'], {
            timeout: 60 * 1000,
        })
    } catch (e) {
        throw new Error(`S3 mock teardown failed, reason: ${e}`)
    }
}

export const resetS3Mock = async () => {
    try {
        await childProcessWrapper('make', ['reset-soft'], {
            timeout: 1000,
        })
    } catch (e) {
        throw new Error(`S3 mock reset failed, reason: ${e}`)
    }
}
