import chalk from "chalk"
import { clear } from "console"
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "fs"
import path from "path"
import readLineSync from "readline-sync"
import { PackageJSON } from "../util/package"



function make(parentPath: string, obj: any) {
    for (let f in obj) {
        const filePath = path.join(parentPath, f)
        console.log(chalk.green('Creating:'), filePath)
        if (typeof (obj[f]) === 'string')
            writeFileSync(filePath, obj[f])
        else {
            mkdirSync(filePath)
            make(filePath, obj[f])
        }
    }
}

function buildDefaultMap(projectId: string, projectName: string, version: string, supports: string[], parentPath: string) {
    const packMcMeta = `
    {
        "pack": {
            "pack_format": 9,
            "description": ""
        }
    }
    `
    const defaultMap = {
        "package.json": JSON.stringify({
            id: projectId,
            name: projectName,
            version: version,
            description: "",
            datapack: "./datapack",
            resourcepack: "./resourcepack",
            dependencies: {},
            supports: supports
        } as PackageJSON, null, 2),
        '.smithed': {
            'dp': {},
            'rp': {}
        },
        'datapack': {
            'data': {
            },
            'pack.mcmeta': packMcMeta
        },
        'resourcepack': {
            'assets': {
            },
            'pack.mcmeta': packMcMeta
        }
    }
    clear()
    make(parentPath, defaultMap)
}


export default function HandleInit(folderName: string, options: { template: string }) {
    folderName = folderName ?? ''
    
    const parentPath = folderName === '' ? process.cwd() : path.join(process.cwd(), folderName)
    if (existsSync(parentPath) && readdirSync(parentPath).length > 0) {
        console.log(chalk.red('ERROR:'), chalk('The folder already exists and is not empty'))
        return
    }

    const projectName = readLineSync.question('Enter a name for your project: ')
    let tempProjId = projectName.toLowerCase().replace(' ', '-')
    let userProjId = readLineSync.question(`Enter an id for your project ${chalk.rgb(148, 148, 148)(`(default: ${tempProjId})`)}: `)
    const projectId = userProjId === '' ? tempProjId : userProjId
    const version = readLineSync.question('Enter a version for your project: ')
    const supports = (() => {
        let supports: string[] = []
        console.log(`Enter game versions your pack supports ${chalk.rgb(148,148,148)('(enter \'done\' to stop)')}:`)
        readLineSync.promptLoop((v => {
            if(v.toLowerCase() !== 'done') {
                if(supports.includes(v)) {
                    console.log(chalk.yellow('WARN:'), 'Already added', v)
                } else {
                    supports.push(v)
                }

                return false
            } else {
                if(supports.length > 0)
                    return true;
                console.log(chalk.red('ERROR:'), 'Must support atleast one version')
                return false
            }
        }))

        return supports
    })()
    const template = options.template




    if (folderName !== '') mkdirSync(parentPath)
    switch (template) {
        case 'default':
            buildDefaultMap(projectId, projectName, version, supports, parentPath)
            break
        default:
            buildDefaultMap(projectId, projectName, version, supports, parentPath)
            break
    }

    clear()
    console.log(chalk.green('Success:'), 'Project created, use',chalk.gray('smd install'),'to install dependencies')

}