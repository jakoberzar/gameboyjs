import * as _ from 'es6-promise';

import { Rom } from './rom';

export class ByteFileReader {
    /**
     * Reads the Rom from a file given
     * @param  {string} filename Path to the file.
     * @returns {Promise<Rom>}
     */
    static loadFile(filename: string): Promise<Rom> {
        return new Promise<Rom>((resolve, reject) => {
            let oReq = new XMLHttpRequest();
            oReq.open('GET', filename, true);
            oReq.responseType = 'arraybuffer';
            oReq.onload = (oEvent) => {
                let arrayBuffer = oReq.response;
                if (arrayBuffer) {
                    resolve(new Rom(new Uint8Array(arrayBuffer)));
                } else {
                    reject('File is empty or does not exist!');
                }
            };
            oReq.onerror = (oEvent) => {
                reject({
                    event: oEvent,
                    message: 'There was an AJAX error!',
                    oreq: oReq,
                });
            };
            oReq.send(null);
        });
    }
}