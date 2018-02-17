import { CPU } from './cpu';
import { ByteFileReader } from './file';
import { Memory } from './memory';
import { Registers } from './registers';
import { Rom, RomInstruction } from './rom';

// const gbROM = './test_roms/pokemon_red.gb';
// const gbROM = './test_roms/dr_mario_usa.gb';
// const gbROM = './test_roms/tetris.gb';
const gbROM = './test_roms/blargg/cpu_instrs/cpu_instrs.gb';
// const gbROM = './test_roms/boot_rom.gb';
// const gbROM = './test_roms/bgbtest.gb';

export let cpu: CPU = new CPU();

export async function main() {
    return new Promise<CPU>((resolve, reject) => {
        ByteFileReader.loadFile(gbROM).then((val) => {
            let rom: Rom = val;
            cpu.setRom(val);
            // while (rom.instAt(cpu.registers.pc) == null) {
            //     cpu.registers.pc++;
            // }

            // let startTime = performance.now();
            // let instructionN = 500000;
            // for (let j = 0; j < instructionN; j++) {
            //     cpu.readNext();
            // }
            // let endTime = performance.now();
            // let msSpent = endTime - startTime;
            // console.log('Executed ' + instructionN +
            //     ' in ' + (endTime - startTime) + ' => ' +
            //     instructionN / msSpent / 1000 + ' mHz');
            // console.log('done');
            // cpu.debugging = true;
            // cpu.step();
            // console.log(cpu.executedLog);
            resolve(cpu);
        });

    });

}
