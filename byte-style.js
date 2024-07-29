import {
	LINE_FEED_CHAR_CODE,
	MAX_KEY_BYTE_LENGTH,
	MAX_LINE_BYTE_LENGTH,
	MAX_VALUE_BYTE_LENGTH,
	SEMI_CHAR_CODE,
	humanByteLength,
	parseValueBuffer,
	processLine
} from './common.js'

const delayMs = ms => new Promise(resolve => setTimeout(resolve, ms))


const STATE_PARSING_KEY = 0
const STATE_PARSING_VALUE = 1

const controller = new AbortController()

export async function handleStream(stream, { totalByteLength, signal }) {
	const decoder = new TextDecoder()
	const results = new Map()
	let lastReportedPercent = -1
	let processedBytes = 0
	let lineCount = 0
	const start = Date.now()

	let state = STATE_PARSING_KEY
	let keyOffset = 0
	let valueOffset = 0

	const keyBuffer = new ArrayBuffer(MAX_KEY_BYTE_LENGTH)
	const valueBuffer = new ArrayBuffer(MAX_VALUE_BYTE_LENGTH)

	let keyBuffer8 = new Uint8Array(keyBuffer)
	let valueBuffer8 = new Uint8Array(valueBuffer)

	for await (const buffer of stream) {
		// await delayMs(1)
		for (const b of buffer) {
			processedBytes += 1

			if (b === SEMI_CHAR_CODE) {
				keyBuffer8 = new Uint8Array(keyBuffer, 0, keyOffset)
				state = STATE_PARSING_VALUE
			}
			else if (b === LINE_FEED_CHAR_CODE) {
				valueBuffer8 = new Uint8Array(valueBuffer, 0, valueOffset)

				const key = decoder.decode(keyBuffer8)
				const value = parseValueBuffer(valueBuffer8) / 10

				//
				processLine(results, key, value)

				//
				lineCount += 1

				const percent = Math.ceil(processedBytes / totalByteLength * 100)
				if (lastReportedPercent !== percent) {
					const delta = Date.now() - start
					const rate = Math.round(lineCount / delta)
					lastReportedPercent = percent
					console.log('new percent', percent, lineCount, rate)
					console.log(delta)
					postMessage({ type: 'percent', percent, done: false })
					// await delayMs(1)
				}

				//
				state = STATE_PARSING_KEY
				keyOffset = 0
				valueOffset = 0
				keyBuffer8 = new Uint8Array(keyBuffer)
				valueBuffer8 = new Uint8Array(valueBuffer)
			}
			else if (state === STATE_PARSING_KEY) {
				keyBuffer8[keyOffset] = b
				keyOffset += 1
			}
			else { // STATE_PARSING_VALUE
				valueBuffer8[valueOffset] = b
				valueOffset += 1
			}
		}
	}

	if(state === STATE_PARSING_VALUE && valueOffset > 0) {
		valueBuffer8 = new Uint8Array(valueBuffer, 0, valueOffset)

		const key = decoder.decode(keyBuffer8)
		const value = parseValueBuffer(valueBuffer8) / 10

		//
		processLine(results, key, value)

		//
		lineCount += 1
	}

	return results
}
