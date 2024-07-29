import {
	LINE_FEED_CHAR_CODE,
	MAX_LINE_BYTE_LENGTH,
	SEMI_CHAR_CODE,
	humanByteLength,
	parseValueBuffer,
	processLine
} from './common.js'


let max = 0
const underlyingSource = {
	processedBytes: 0,
	lineCount: 0,
	tails: new Array(),
	start() { },
	async transform(chunk, controller) {
		// if (chunk.byteLength > max) {
		// 	max = chunk.byteLength
		// 	console.log(humanByteLength(max))
		// }
		console.log(humanByteLength(chunk.byteLength))

		this.processedBytes += chunk.byteLength
		let offset = chunk.byteOffset
		let index = chunk.indexOf(LINE_FEED_CHAR_CODE, offset)

		while (index >= 0) {
			this.lineCount += 1
			const length = index - offset + 1 - 1
			const view = new Uint8Array(chunk.buffer, offset, length)

			if (this.tails.length > 0) {
				this.tails.push(view)
				const blob = new Blob(this.tails)
				this.tails = []
				const buffer = await blob.arrayBuffer()

				controller.enqueue(new Uint8Array(buffer))
			} else {
				controller.enqueue(view)
			}

			offset = index + 1
			index = chunk.indexOf(LINE_FEED_CHAR_CODE, offset)
		}

		const tail = new Uint8Array(chunk.buffer, offset)
		this.tails.push(tail)

	},
	async flush(controller) {
		const blob = new Blob(this.tails)
		this.tails = []
		const buffer = await blob.arrayBuffer()

		this.lineCount += 1
		controller.enqueue(new Uint8Array(buffer))
	}
}
const transform = new TransformStream(
	underlyingSource,
	// new ByteLengthQueuingStrategy({ // writable strategy
	// 	highWaterMark: 1024 * 1024
	// }),
	// new ByteLengthQueuingStrategy({ // readable strategy
	// 	highWaterMark: MAX_LINE_BYTE_LENGTH
	// })
	)




export async function handleStream(stream, { totalByteLength, signal }) {

	const lines = stream.pipeThrough(transform, { signal })

	const decoder = new TextDecoder()


	let lastReportedPercent = -1
	const start = Date.now()

	const results = new Map()

	// for await (const chunk of lines) {
	for await (const line8 of lines) {
		// console.log('lines8', ...line8)
		const marker = line8.indexOf(SEMI_CHAR_CODE)
		const keyRaw = line8.subarray(0, marker)
		const valueRaw = line8.subarray(marker + 1)

		const key = decoder.decode(keyRaw)
		// const value = parseValueBuffer(line8, marker + 1) / 10
		const value = parseValueBuffer(valueRaw) / 10
		// const x = decoder.decode(new Uint8Array(line8.buffer, line8.byteOffset + marker + 1, line8.byteLength - (marker + 1)))

		processLine(results, key, value)

		const percent = Math.ceil(underlyingSource.processedBytes / totalByteLength * 100)
		if(lastReportedPercent !== percent) {
			const delta = Date.now() - start
			const rate = Math.round(underlyingSource.lineCount / delta)
			lastReportedPercent = percent
			console.log('new percent', percent, underlyingSource.lineCount, rate)
			console.log(delta, )
			postMessage({ type: 'percent', percent, done: false })
			// await delayMs(1)
		}
	}

	return results
}