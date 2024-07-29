export const MAX_KEY_BYTE_LENGTH = 100
export const MAX_VALUE_BYTE_LENGTH = 5
export const MAX_LINE_BYTE_LENGTH = MAX_KEY_BYTE_LENGTH + 1 + MAX_VALUE_BYTE_LENGTH + 1
export const MINUS_CHAR_CODE = '-'.charCodeAt(0)
export const SEMI_CHAR_CODE = ';'.charCodeAt(0)
export const LINE_FEED_CHAR_CODE = '\n'.charCodeAt(0)

//
export const delayMs = ms => new Promise(resolve => setTimeout(resolve, ms))

export function* range(start, end, step = 1) {
	for(let i = start; i < end; i += step) {
		yield i
	}
}

export function humanByteLength(byteLength) {
	let scratch = byteLength
	for(const suffix of ['bytes', 'KiB', 'MiB', 'GiB']) {
		if(scratch < 1024.0) return `${scratch} ${suffix}`
		scratch /= 1024.0
	}
}

export function parseValueBuffer(buffer8, offset = 0) {
	const byteLength = buffer8.byteLength - offset

	// console.log(buffer8, offset, byteLength)

	if(buffer8[offset + 0] === MINUS_CHAR_CODE) {
		if(byteLength === 5) {
			// -xx.x
			// console.log('-xx.x')
			return -(
				100 * (buffer8[offset + 1] - 0x30) +
				10 * (buffer8[offset + 2] - 0x30) +
				(buffer8[offset + 4] - 0x30)
			)
		}
		else {
			// -x.x
			// console.log('-x.x')
			return -(
				10 * (buffer8[offset + 1] - 0x30) +
				(buffer8[offset + 3] - 0x30)
			)
		}
	}
	else {
		if(byteLength === 4) {
			// xx.x
			// console.log('xx.x')
			return (
				100 * (buffer8[offset + 0] - 0x30) +
				10 * (buffer8[offset + 1] - 0x30) +
				(buffer8[offset + 3] - 0x30)
			)
		}
		else {
			// x.x
			// console.log('x.x')
			return (
				10 * (buffer8[offset + 0] - 0x30) +
				(buffer8[offset + 2] - 0x30)
			)
		}
	}
}


export function processLine(results, key, value) {
	const existing = results.get(key)
	if (existing === undefined) {
		results.set(key, { min: value, max: value, count: 1, sum: value })
		postMessage({ type: 'new', key, value, min: value, max: value })
	}
	else {
		existing.count += 1
		existing.sum += value

		if (value < existing.min) {
			existing.min = value
			postMessage({ type: 'update', key, ...existing })
		}

		if (value > existing.max) {
			existing.max = value
			postMessage({ type: 'update', key, ...existing })
		}

		const now = Date.now()
		if((existing.lastReportTime === undefined) || (now - existing.lastReportTime > 1000)) {
			postMessage({ type: 'update', key, ...existing })
			existing.lastReportTime = now
		}
	}
}
