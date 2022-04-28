import chalk from "chalk";
import { clear } from "console";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { PackageJSON, ValidateId } from "../util/package.js";
import fetch, { Response } from 'node-fetch'
import semver from 'semver'
async function getProgress(resp: Response) {
    return new Promise<Buffer | undefined>((resolve, reject) => {
        const contentLength = +(resp.headers.get('Content-Length') ?? 0)
        let recv = 0;
        let chunks: Uint8Array[] = []
        const barLength = 40;
        resp.body?.on('data', (chunk) => {
            recv += chunk.length;
            const percentDone = recv / contentLength
            const partsDone = Math.floor((barLength * percentDone));
            if (partsDone !== Infinity) {
                process.stdout.write(`\rDownloading: ${(percentDone * 100).toPrecision(3)}% [${chalk.green('#').repeat(partsDone)}${' '.repeat(barLength - partsDone)}]`)
                chunks.push(chunk)
            }
        })

        resp.body?.on('end', () => {
            if (chunks.length === 0) {
                resolve(undefined)
                return;
            }

            let chunksAll = new Uint8Array(recv); // (4.1)
            let position = 0;
            for (let chunk of chunks) {
                chunksAll.set(chunk, position); // (4.2)
                position += chunk.length;
            }
            console.log('')
            resolve(Buffer.from(chunksAll))
        })


    })

}

async function installPack(p: string, packageJson: PackageJSON) {
    if (!ValidateId(p)) {
        console.log(
            chalk.red('ERROR:'),
            chalk('Invalid formatting for package \'' + p + '\' should be in format owner:id[@version]')
        )
        return;
    }

    console.log(chalk.yellow('Installing Pack:'), p)

    const smithedFolder = path.join(process.cwd(), '.smithed')

    if (!existsSync(smithedFolder)) mkdirSync(smithedFolder)
    if (!existsSync(path.join(smithedFolder, 'dp'))) mkdirSync(path.join(smithedFolder, 'dp'))
    if (!existsSync(path.join(smithedFolder, 'rp'))) mkdirSync(path.join(smithedFolder, 'rp'))

    let success = 0
    for (let mode of ['datapack', 'resourcepack']) {
        console.log(chalk.yellow('Installing:'), mode)
        const url = `https://smithed.dev/api/download?mode=${mode}&pack=${p}&version=${(() => {
            const supports = packageJson.supports;
            return supports.sort((a,b) => {
                return semver.cmp(a, '>=', b) ? 1 : -1
            })[0]
        })()}`
        const resp = await fetch(url)
        const buff = await getProgress(resp as Response)
        if (!resp.ok || !buff) {
            // console.log(chalk.red('ERROR:'), chalk.yellow(resp.status), resp.statusText)
            continue;
        }

        if (buff.byteLength === 0) continue;
        success++;

        const filePath = path.join(smithedFolder, mode[0] + 'p', p + '.zip')
        writeFileSync(filePath, Buffer.from(buff))
        console.log(chalk.green('Installed:'), mode)
    }

    if (success === 0) {
        console.log(chalk.red('ERROR:'), `Failed to install pack ${p}! Pack may not exist, check spelling!`)
        return;
    }
    console.log(chalk.green('Installed Pack:'), p)

    const [id, version] = p.split('@')

    if (version !== undefined) {
        packageJson.dependencies[id] = version
    } else {
        packageJson.dependencies[id] = '*'
    }

}

export default async function HandleInstall(packages: string[]) {
    const packageFile = path.join(process.cwd(), 'package.json')
    if (!existsSync(packageFile)) {
        console.log(chalk.red('ERROR:'), 'Directory has not been initialized! Run', chalk.gray('smd init'), 'to initialize')
    }

    const text = readFileSync(packageFile, 'utf8')
    const json = JSON.parse(text) as PackageJSON

    if (packages.length === 0) {
        for (let id in json.dependencies) {
            const version = json.dependencies[id]
            if (version !== '*')
                await installPack(id + '@' + version, json)
            else
                await installPack(id, json)
        }
    } else {
        for (let p of packages) {
            await installPack(p, json)
        }
    }
    writeFileSync(packageFile, JSON.stringify(json, null, 2))
}