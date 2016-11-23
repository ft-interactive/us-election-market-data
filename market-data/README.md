# Brexit Market Charts Data Generator

This 'app' contains two scripts that result in a valid `.json` file that can be rendered by the Brexit Market SVG Chart generator. The two scripts are to be run as individual cron jobs.

 - `data-poller.js` grabs data from the markets api and exports it in `.csv` format
 - `csv-to-chart-json.js` takes said `.csv` files and converts them into a `.json` file that can be used by the SVG Chart Generator.

## Reqs
Tested on Node `v5.5`.

## Install
Clone repo and `npm install` within this folder.

## Config
Change `config` object in either script, see inline comments for more info.

# Run

## `data-poller` Brexit Market Data Generator

From within this directory:

`node data-poller /PATH/TO/OUTPUT/DIRECTORY/`

From a different directory:

`node /path/to/this/directory/data-poller /PATH/TO/OUTPUT/DIRECTORY/`

## `csv-to-chart-json` Brexit Market Chart Json Generator

From within this directory:

`node csv-to-chart-json /PATH/TO/INPUT/DIRECTORY/ /PATH/TO/OUTPUT/DIRECTORY/`

From a different directory:

`node /path/to/this/directory/csv-to-chart-json /PATH/TO/INPUT/DIR/ /PATH/TO/OUTPUT/DIR/`

# Example cron setup

## Folder setup
```
live-brexit-market-data
	|
	|- csv			// raw csv market data for symbols
	|				// output of data-poller.js & input for csv-to-chart-json.js
	|
	|- json			// chart json generated from csv
	|				// output of csv-to-chart-json.js & input for ../charts/index.js
	|
	|- svg			// various chart svgs
	|				// output of ../charts/index.js
	|
	|- scripts		// cron job scripts
	|	|
	|	|-	poll-data.sh
	|	|-	generate-chart-data.sh
	|	|-	render-chart-svgs.sh
	|
	|- logs			// application script logs
```

## `/scripts/` setup

### `poll-data.sh`
```
#!/usr/bin/env sh
set -e
NODE=/path/to/bin/node

# vars
SCRIPT_LOCATION=/path/to/eu-referendum-results/market-data/
OUTPUT_DIR=/path/to/live-brexit-market-data/csv/
LOG_DIR=/path/to/live-brexit-market-data/logs/

# cd to the script location
cd $SCRIPT_LOCATION

# set up file structure
mkdir -p $OUTPUT_DIR

# poll data
$NODE data-poller $OUTPUT_DIR >> $LOG_DIR'market-data-poller.log'

```

```
crontab
-

* * * * * /path/to/bash/script/poll-data.sh
```

### `generate-chart-data.sh`

```
#!/usr/bin/env sh
set -e
NODE=/path/to/bin/node

# vars
SCRIPT_LOCATION=/path/to/eu-referendum-results/market-data/
INPUT_DIR=/path/to/live-brexit-market-data/csv/
OUTPUT_DIR=/path/to/live-brexit-market-data/json/
LOG_DIR=/path/to/live-brexit-market-data/logs/

# cd to the script location
cd $SCRIPT_LOCATION

# set up file structure
mkdir -p $INPUT_DIR
mkdir -p $OUTPUT_DIR

# generate chart json
$NODE csv-to-chart-json $INPUT_DIR $OUTPUT_DIR >> $LOG_DIR'market-data-csv-to-chart-json.log'

```

```
crontab
-

* * * * * /path/to/bash/script/generate-chart-data.sh
```

### `render-chart-svgs.sh`

```
#!/usr/bin/env sh
set -e
NODE=/path/to/bin/node

# vars
SCRIPT_LOCATION=/path/to/eu-referendum-results/charts/
INPUT_FILE=/path/to/live-brexit-market-data/json/brexit-market-chart-data.json
OUTPUT_DIR=/path/to/live-brexit-market-data/svg/
LOG_DIR=/path/to/live-brexit-market-data/logs/

# cd to the script location
cd $SCRIPT_LOCATION

# set up file structure
mkdir -p $OUTPUT_DIR

# poll data
$NODE index.js $INPUT_FILE $OUTPUT_DIR >> $LOG_DIR'market-svg-chart-generator.log'

```

```
crontab
-

* * * * * /path/to/bash/script/render-chart-svgs.sh
```
