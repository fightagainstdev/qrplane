import { promises as fs } from 'fs';

export async function logFileSize(path: string, maxSize: number) {
    const stat = await fs.stat(path);

    const progress = stat.size / maxSize;

    const meterSize = 50;
    let meter = '[';
    for(var i = 0 ; i < meterSize ; i++){
        meter += (i / meterSize) < progress ? '#' : ' ';
    }
    meter += '] ' + Math.round(progress * 100) + '%';

    console.log(meter);
    console.log(path + ': ' + stat.size + ' bytes (' + (maxSize - stat.size) + ' bytes remaining)');
}
