import { handleStream  as handleStreamStreamStyle } from './stream-style.js'
import { humanByteLength } from './common.js'
import { handleStream  as handleStreamByteStyle } from './byte-style.js'

const controller = new AbortController()

async function handleEvent(event) {
	const { handle } = event.data

	const file = await handle.getFile()
	const totalByteLength = file.size
	console.log('File Size', humanByteLength(totalByteLength))
	const stream = await file.stream()
	const signal = controller.signal

	const handleStream = (true) ? handleStreamByteStyle : handleStreamStreamStyle
	const results = await handleStream(stream, { totalByteLength, signal: controller.signal })

  const end = Date.now()

	// postMessage({ type: 'percent', done: true })
	let totalCount = 0
	for(const [ key, value ] of results.entries()) {
		totalCount += value.count
		postMessage({ type: 'update', key, ...value })
	}

	console.log(totalCount)

	//
	close()
}

onerror = event => controller.abort('onerror')
onmessage = event => handleEvent(event).catch(e => console.warn(e))
