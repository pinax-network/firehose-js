import * as jsonl from "node-jsonl";

const rl = jsonl.readlines<{slot: number, timestamp: number}>("firehose.jsonl");
const transactions = new Map();

while (true) {
    const {value, done} = await rl.next()
    if (done) break;
    transactions.set(value.slot, value.timestamp);
}

const rl2 = jsonl.readlines<{slot: number, timestamp: number}>("substreams.jsonl");
let better_firehose = 0;
let better_substreams = 0;
let timestamps_seconds: number[] = [];
while (true) {
    const {value, done} = await rl2.next()
    if (done) break;
    if ( !transactions.has(value.slot)) { continue }
    const firehose = transactions.get(value.slot) / 1000;
    const substreams = value.timestamp / 1000;

    const diff = firehose - substreams;
    timestamps_seconds.push(Number(diff.toFixed(2)));
    // timestamps_substreams.push(firehose - substreams);
    // timestamps_firehose.push(substreams - firehose);
    if ( diff > 0 ) {
        better_substreams += 1
    } else {
        better_firehose += 1
    }
    // console.log({diff, firehose, substreams});
}
console.log({
    timestamps_seconds,
    average: Number((timestamps_seconds.reduce((a, b) => a + b, 0) / timestamps_seconds.length).toFixed(2)),
    min: Math.min(...timestamps_seconds),
    max: Math.max(...timestamps_seconds),
    count: timestamps_seconds.length,
    better_substreams,
    better_firehose
    // timestamps_firehose,
    // timestamps_substreams
})