export function ValidateId(pack: string) {
    return pack.match(/([\S]+):([\S]+)(@[\S]+)?/g)
}

export interface PackageJSON {
    id: string,
    name: string,
    version: string,
    description: string,
    datapack: string,
    resourcepack: string,
    dependencies: {[key: string]: string},
    supports: string[]
}