import * as _ from "es6-promise";

export class MyFileReader {
    /**
     * Loads the file into the file field.
     */
    static loadFile(filename: string): Promise<Rom> {
        return new Promise<Rom>((resolve, reject) => {
            let oReq = new XMLHttpRequest();
            oReq.open("GET", filename, true);
            oReq.responseType = "arraybuffer";
            oReq.onload = (oEvent) => {
                let arrayBuffer = oReq.response;
                if (arrayBuffer) {
                    resolve(new Rom(new Uint8Array(arrayBuffer)));
                }
            };
            oReq.send(null);
        });
    }
}

export class Rom {
    // private file: Uint8Array;

    constructor(private file: Uint8Array) {
        // this.file = file;
    }

    at(index: number): number {
        return this.file[index];
    }

    take(index: number, amount: number): number[] {
        let bytes: number[] = [];
        this.file.slice(index, index + amount).forEach((x) => {bytes.push(x)});
        return bytes;
    }
}