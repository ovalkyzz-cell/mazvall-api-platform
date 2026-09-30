import { deflateRawSync } from 'zlib';

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function readStr(buf: Buffer, start: number, len: number): string {
  return buf.subarray(start, start + len).toString('utf8').replace(/\0.*$/, '').trim();
}

export function parseTar(buf: Buffer): { name: string; data: Buffer }[] {
  const files: { name: string; data: Buffer }[] = [];
  let off = 0;
  let longName: string | null = null;
  while (off + 512 <= buf.length) {
    const header = buf.subarray(off, off + 512);
    if (header.every(b => b === 0)) break;
    const name = readStr(header, 0, 100);
    const prefix = readStr(header, 345, 155);
    const size = parseInt(readStr(header, 124, 12), 8) || 0;
    const typeflag = String.fromCharCode(header[156] || 48);
    const dataStart = off + 512;
    const dataEnd = Math.min(dataStart + size, buf.length);

    if (typeflag === 'L') {
      longName = buf.subarray(dataStart, dataEnd).toString('utf8').replace(/\0.*$/, '');
    } else if (typeflag === '0' || typeflag === '\0' || typeflag === '') {
      const fullName = longName || (prefix ? `${prefix}/${name}` : name);
      if (fullName) files.push({ name: fullName, data: Buffer.from(buf.subarray(dataStart, dataEnd)) });
      longName = null;
    } else {
      longName = null;
    }
    off = dataStart + Math.ceil(size / 512) * 512;
  }
  return files;
}

function dosDateTime(d: Date) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

export function buildZip(entries: { name: string; data: Buffer }[]): Buffer {
  const { time, date } = dosDateTime(new Date());
  const localChunks: Buffer[] = [];
  const centralChunks: Buffer[] = [];
  let offset = 0;

  for (const f of entries) {
    const nameBuf = Buffer.from(f.name, 'utf8');
    const crc = crc32(f.data);
    let stored: Buffer = deflateRawSync(f.data, { level: 9 });
    let method = 8;
    if (stored.length >= f.data.length) {
      stored = f.data;
      method = 0;
    }

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(stored.length, 18);
    local.writeUInt32LE(f.data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    localChunks.push(local, nameBuf, stored);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0x0800, 8);
    cd.writeUInt16LE(method, 10);
    cd.writeUInt16LE(time, 12);
    cd.writeUInt16LE(date, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(stored.length, 20);
    cd.writeUInt32LE(f.data.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt32LE((0o100644 << 16) >>> 0, 38);
    cd.writeUInt32LE(offset, 42);
    centralChunks.push(cd, nameBuf);

    offset += local.length + nameBuf.length + stored.length;
  }

  const centralBuf = Buffer.concat(centralChunks);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);

  return Buffer.concat([...localChunks, centralBuf, eocd]);
}
