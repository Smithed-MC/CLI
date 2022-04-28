#!/usr/bin/env node

import clear from 'clear'
import chalk from 'chalk'
import figlet from 'figlet'
import { Command } from 'commander';
import HandleInstall from './commands/install.js';
import HandleUninstall from './commands/uninstall.js';
import HandleLogin from './commands/login.js';
import HandleInit from './commands/init.js';
const program = new Command()


// clear();
// console.log(
//     chalk.rgb(33, 107, 234)(
//         figlet.textSync('<SMITHED/>', { horizontalLayout: 'full' })
//     )
// );

program
    .version('0.0.1')
    .description('CLI for use with the Smithed eco-system')
    .addHelpText('before', chalk.rgb(33, 107, 234)(
        figlet.textSync('<SMITHED/>', { horizontalLayout: 'full' })
    ))

program
    .command('install')
    .alias('i')
    .argument('[packages...]', 'List of packages to install', [])
    .description('Install a new dependency. If none are specified, installs all dependencies')
    .action(HandleInstall)

program
    .command('uninstall')
    .alias('un')
    .argument('<packages...>', 'List of packages to uninstall')
    .description('Uninstall a dependency')
    .action(HandleUninstall)
program
    .command('login')
    .argument('<email>')
    .argument('<password>')
    .description('Login to the CLI')
    .action(HandleLogin)

program
    .command('init')
    .option('-t|--template <template>', 'Template to use for creation.\nTemplates:\n- default\n- beet\n- beet-versioned', 'default')
    .argument('[folderName]', 'Name of the folder to create')
    .description('Generate a pack setup for the CLI')
    .action(HandleInit)

program.parse(process.argv)