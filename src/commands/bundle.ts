import chalk from "chalk";
import { existsSync, fstat, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import path from "path";
import { PackageJSON } from "../util/package.js";
import { WeldDatapackBuilder } from 'smithed-weld/out/datapack.js'
import { PackBuilder } from 'slimeball/out/util.js'
import DefaultResourcepackBuilder from 'slimeball/out/resourcepack.js'
import semver from "semver";
import { exec } from "child_process";

async function build(json: PackageJSON, packBuilder: PackBuilder, folder: string, mode: string) {
    let packs: [string, Buffer][] = []

    const zipName = `${json.id}-${mode}.zip`
    const zipPath = path.join(process.cwd(), '.smithed', zipName);
    await new Promise<void>((resolve) => { exec(`cd ${json.datapack} && zip -r ${zipPath} ./*`).on('exit', () => { resolve() }) })
    const buff = readFileSync(zipPath)
    rmSync(zipPath)
    packs.push([zipName, buff])

    for (let f of readdirSync(folder)) {
        const buff = readFileSync(path.join(folder, f))
        packs.push([f, buff])
    }
    await packBuilder.loadBuffers(packs)

    try {
        const result = await packBuilder.build((m) => { })
        const finalZip = (await result.zip.close()) as Blob

        writeFileSync(`${json.id}-${json.version}-${mode}.zip`, Buffer.from(await finalZip.arrayBuffer()))
    } catch (e) {
        console.log(e)
    }

}

export async function HandleBundle() {
    const packageFile = path.join(process.cwd(), 'package.json')
    if (!existsSync(packageFile)) {
        console.log(chalk.red('ERROR:'), 'Directory has not been initialized! Run', chalk.gray('smd init'), 'to initialize')
        return;
    }

    const text = readFileSync(packageFile, 'utf8')
    const json = JSON.parse(text) as PackageJSON

    const smithedFolder = path.join(process.cwd(), '.smithed')
    const dpFolder = path.join(smithedFolder, 'dp')
    const rpFolder = path.join(smithedFolder, 'rp')

    if (!existsSync(smithedFolder)) mkdirSync(smithedFolder)
    if (!existsSync(dpFolder)) mkdirSync(dpFolder)
    if (!existsSync(rpFolder)) mkdirSync(rpFolder)

    const dpb = new WeldDatapackBuilder(json.supports.sort((a, b) => {
        return semver.cmp(a, '>=', b) ? 1 : -1
    })[0])
    console.log(chalk.yellow('Bundling:'), 'Datapack')
    await build(json, dpb, dpFolder, 'dp')
    console.log(chalk.green('Done Bundling:'), 'Datapack')

    const rpb = new DefaultResourcepackBuilder()
    console.log(chalk.yellow('Bundling:'), 'Resourcepack')
    await build(json, rpb, rpFolder, 'rp')
    console.log(chalk.green('Done Bundling:'), 'Resourcepack')

}