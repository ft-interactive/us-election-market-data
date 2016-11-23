
# Brexit Market Charts Generator

Generate SVG charts graphing markets data for Brexit.

**See how this can interact with `../market-data/` generator [here](../market-data/README.md#example-cron-setup)**


## Requirements

The following tools are required to run the application:

  * [Node.js] 4+


## Running

Clone the repository, then install dependencies with:

```sh
npm install
```

You can generate charts with:

```sh
node .
```

This will generate charts and save them to the `build` folder.

Each chart is configured using `charts.json`. This specifies width, height, and other properties for each chart.

The data comes from `data/sample.json` and is built to `build/`. You can specify a different JSON file and build folder using a command-line arguments:

```sh
node . data/example.json /new-build-folder
```


[node.js]: https://nodejs.org/
