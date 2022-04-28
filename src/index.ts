#!/usr/bin/env node
import { Blob } from 'blob-polyfill';
import Worker from 'web-worker'

globalThis.Blob = Blob
globalThis.Worker = Worker

// clear();
// console.log(
//     chalk.rgb(33, 107, 234)(
//         figlet.textSync('<SMITHED/>', { horizontalLayout: 'full' })
//     )
// );

import ('./cli.js')