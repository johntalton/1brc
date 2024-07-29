# 1️⃣ 🐝 🏎️

## One Billion Row Challenge: How I Learned to Stop Worrying and Love the Browser

The [One Billion Row Challenge](https://github.com/gunnarmorling/1brc), in general, is an excessive in the processing capabilities and optimization of processing text from a file.

This repo specifically demonstrates an implementation in Javascript in the Browser.

- This is a SPA, there is NO server involvement!
- Likely Chrome-only due to `showOpenFilePicker` API
- Leverages SteamReader / StreamWriter API
- Workers used to "free up" the UI interaction for smooth processing

## Usage

### Generate:

The application provide a File Generation function.  This is useful to create the initial 1billion rows file is the user so desires.  Click Generate and choose a location to save the file (then be patient 😉).

The "official" file can be generated using the original challenges source code found [here](https://github.com/gunnarmorling/1brc/blob/main/src/main/python/create_measurements.py)

(note: browser generation does not YET use station names from source)

### Process:

The Meat of the App.  By clicking the Process and selecting an input file, a Worker thread will be spawned to process the file.  Progress can be tracked by the onscreen progress bar (as well as some debug text in the console).

In addition a live summary of the processed states (min / max / avg) outputted onto the page.




## Why? And Why the Browser?

tl;dr - Because 🤪

While the core challenge was intended for Java community, it rapidly spread to other environments / languages.

This is both an opportunity to "show off" developers skills, but more directly, show off the capabilities of the chosen environment.

While the core solution remains very similar in most languages, the ceremony around setting up can have impact on the outcome.  That is, most implementation (Java, C#, node or otherwise) all process byte-for-byte using a state machine to track key/value lines.

However, this "key insight" alone does NOT unlock performance needed to "reasonably" process such a large dataset.   Specifically, Javascript ability to JIT code must be considered, such that, the Hot-Loop must remain in JIT code as much as posable reducing thrashing of the VM to and from non-JIT code.

With this in mind, the "generic" JavaScript solution (for node) provides a good model.

The Browser, however adds additional "constraints".  Additionally, UI interaction and feedback are "expected" within the browsing context. Which presents the need for graceful shutdown and feedback to the user.

This solution also leverages several "new" APIs that have landed in the Browser stack (specifically the [StreamReader](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API), and [FilePicker](https://developer.mozilla.org/en-US/docs/Web/API/Window/showOpenFilePicker) APIs) as well as Generators and Workers

## To Do

While this satisfies the core challenge, the UI could be improved to provide more options (like generation parameters: station count, row count, etc).

An update to the output and progress of both the Generation and Processing would help users understand and visualize the process better.

Updated UI interaction (start / stop / restart) are needed, as-is, the UI doesn't prevent the user from doing-bad-things.

There also exists (due to the use of StreamReader -> StreamWriter binding) the ability to "bypass" the File and connect the Generator directly to the Processor (thus, generating and processing in one-step) 🚀.

