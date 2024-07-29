import { MAX_LINE_BYTE_LENGTH, range } from './common.js'

const controller = new AbortController()

async function handleEvent(event) {
	const { handle } = event.data

	const writable = await handle.createWritable()
	const writer = writable.getWriter()

	const stations = [
		'Bulawayo',
		'Palembang',
		'Hamburg',
		'St. John\'s',
		'Cracow',
		'❤️',
		'👩🏻‍❤️‍💋‍👩🏼❤❤️❤️❤️❤️️👩🏻‍❤️‍💋‍👩🏼', // 100 bytes
		// '👩🏻‍❤️‍💋‍👩🏼👩🏻‍❤️‍💋‍👩🏼👩🏻‍❤️‍💋‍👩🏼', // over 100
	]

	const profiles = new Map()

	for(const key of stations) {
		const min = -999 + Math.floor(Math.random() * (999 - -999 + 1 ))
		const max = Math.ceil(min + Math.floor(Math.random() * (999 - min + 1)))

		profiles.set(key, {
			min, max
		})
	}


	const sensorReading = profile => ((profile.min + Math.floor(Math.random() * (profile.max - profile.min + 1))) / 10).toFixed(1)
	const aStation = () => stations[Math.floor(Math.random() * stations.length)]

	function sensorData(target) {
		const key = aStation()
		const profile = profiles.get(key)
		const value = sensorReading(profile).toString()
		const { read, written } = encoder.encodeInto(key + ';' + value + '\n', target)
		return written
	}

	const encoder = new TextEncoder()
	let lastReportedPercent = -1

	const LINES_PER_CHUNK = 100
	const buffer = new ArrayBuffer(MAX_LINE_BYTE_LENGTH * LINES_PER_CHUNK)
	let targetOffset = 0

	const max = 1_000_000_000
	for await (const r of range(0, max, LINES_PER_CHUNK)) {
		targetOffset = 0

		for(const _u of range(0, LINES_PER_CHUNK)) {
			const target = new Uint8Array(buffer, targetOffset)
			const bytesWritten = sensorData(target)
			targetOffset += bytesWritten
		}

		await writer.ready
		writer.write(new Uint8Array(buffer, 0, targetOffset))

		const percent = Math.trunc(r / max * 100)
		if(percent !== lastReportedPercent) {
			console.log('percent', percent)
			lastReportedPercent = percent
			postMessage({ type: 'percent', percent, done: false })
			//await delayMs(1)
		}
	}

	await writer.ready
	await writer.close()

	// self close
	close()
}

onerror = event => controller.abort('onerror')
onmessage = event => handleEvent(event).catch(e => console.warn(e))
